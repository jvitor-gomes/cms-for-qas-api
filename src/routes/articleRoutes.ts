import { Router, Request, Response } from "express";
import { body } from "express-validator";
import { AppDataSource } from "../database/data-source";
import { Article } from "../entities/Article";
import { User } from "../entities/User";
import { Category } from "../entities/Category";
import { validateRequest } from "../middleware/validateRequest";
import { LoggerService } from "../services/LoggerService";

const router = Router();
const articleRepository = AppDataSource.getRepository(Article);
const userRepository = AppDataSource.getRepository(User);
const categoryRepository = AppDataSource.getRepository(Category);

router.post("/",
    [
        body("titulo")
            .notEmpty().withMessage("Título é obrigatório")
            .isLength({ max: 100 }).withMessage("Título deve ter no máximo 100 caracteres"),
        body("conteudo").notEmpty().withMessage("Conteúdo é obrigatório"),
        body("nomeAutor").notEmpty().withMessage("Nome do autor é obrigatório"),
        body("nomeCategoria").notEmpty().withMessage("Nome da categoria é obrigatório"),
        body("dataPublicacao")
            .optional()
            .isISO8601().withMessage("Data de publicação deve estar no formato ISO8601"),
        validateRequest
    ],
    async (req: Request, res: Response) => {
        try {
            const { titulo, conteudo, nomeAutor, nomeCategoria, dataPublicacao } = req.body;
            LoggerService.info(`Iniciando criação de artigo: ${titulo}`);

            const autor = await userRepository.findOne({
                where: { nomeUsuario: nomeAutor }
            });

            if (!autor) {
                LoggerService.warn(`Autor não encontrado: ${nomeAutor}`);
                return res.status(404).json({ erro: "Autor não encontrado" });
            }
        
            const categoria = await categoryRepository.findOne({
                where: { nome: nomeCategoria }
            });

            if (!categoria) {
                LoggerService.warn(`Categoria não encontrada: ${nomeCategoria}`);
                return res.status(404).json({ erro: "Categoria não encontrada" });
            }

            const article = new Article();
            article.titulo = titulo;
            article.conteudo = conteudo;
            article.autor = autor;
            article.categoria = categoria;
            article.dataPublicacao = dataPublicacao ? new Date(dataPublicacao) : new Date();

            await articleRepository.save(article);
            LoggerService.info(`Artigo criado com sucesso: ${article.id}`);

            return res.status(201).json(article);
        } catch (error) {
            LoggerService.error("Erro ao criar artigo", error);
            return res.status(500).json({ erro: "Erro ao criar artigo" });
        }
    }
);

router.get("/", async (req: Request, res: Response) => {
    try {
        const { categoria_id, autor_id, page = 1, limit = 10 } = req.query;
        LoggerService.info(`Listando artigos - page: ${page}, limit: ${limit}`, { categoria_id, autor_id });

        const skip = (Number(page) - 1) * Number(limit);
        let where: any = {};

        if (categoria_id) {
            where.categoriaId = categoria_id;
        }
        if (autor_id) {
            where.autorId = autor_id;
        }

        const [articles, total] = await articleRepository.findAndCount({
            where,
            skip,
            take: Number(limit),
            relations: ["autor", "categoria"],
            order: { dataPublicacao: "DESC" }
        });

        LoggerService.info(`Artigos listados com sucesso. Total: ${total}`);
        return res.json({
            data: articles,
            total,
            page: Number(page),
            lastPage: Math.ceil(total / Number(limit))
        });
    } catch (error) {
        LoggerService.error("Erro ao listar artigos", error);
        return res.status(500).json({ erro: "Erro ao listar artigos" });
    }
});

router.get("/:id", async (req: Request, res: Response) => {
    try {
        LoggerService.info(`Buscando artigo: ${req.params.id}`);
        const article = await articleRepository.findOne({
            where: { id: req.params.id },
            relations: ["autor", "categoria"]
        });
        if (!article) {
            LoggerService.warn(`Artigo não encontrado: ${req.params.id}`);
            return res.status(404).json({ erro: "Artigo não encontrado" });
        }
        LoggerService.info(`Artigo encontrado: ${req.params.id}`);
        return res.json(article);
    } catch (error) {
        LoggerService.error(`Erro ao buscar artigo: ${req.params.id}`, error);
        return res.status(500).json({ erro: "Erro ao buscar artigo" });
    }
});

router.put("/:id",
    [
        body("titulo")
            .optional()
            .isLength({ max: 100 }).withMessage("Título deve ter no máximo 100 caracteres"),
        body("conteudo")
            .optional()
            .notEmpty().withMessage("Conteúdo não pode ser vazio"),
        validateRequest
    ],
    async (req: Request, res: Response) => {
        try {
            LoggerService.info(`Iniciando atualização do artigo: ${req.params.id}`);
            const article = await articleRepository.findOne({ 
                where: { id: req.params.id },
                relations: ["autor", "categoria"]
            });

            if (!article) {
                LoggerService.warn(`Artigo não encontrado para atualização: ${req.params.id}`);
                return res.status(404).json({ erro: "Artigo não encontrado" });
            }

            const changes = Object.entries(req.body).some(([key, value]) => 
                article[key as keyof Article] !== value
            );

            if (!changes) {
                LoggerService.info(`Nenhuma alteração necessária para o artigo: ${req.params.id}`);
                return res.status(200).json({ mensagem: "Não houve alterações" });
            }

            articleRepository.merge(article, req.body);
            await articleRepository.save(article);
            LoggerService.info(`Artigo atualizado com sucesso: ${req.params.id}`);
            
            return res.json(article);
        } catch (error) {
            LoggerService.error(`Erro ao atualizar artigo: ${req.params.id}`, error);
            return res.status(500).json({ erro: "Erro ao atualizar artigo" });
        }
    }
);

router.delete("/:id", async (req: Request, res: Response) => {
    try {
        LoggerService.info(`Iniciando exclusão do artigo: ${req.params.id}`);
        const article = await articleRepository.findOne({ where: { id: req.params.id } });
        if (!article) {
            LoggerService.warn(`Artigo não encontrado para exclusão: ${req.params.id}`);
            return res.status(404).json({ erro: "Artigo não encontrado" });
        }

        await articleRepository.remove(article);
        LoggerService.info(`Artigo excluído com sucesso: ${req.params.id}`);
        return res.status(204).send();
    } catch (error) {
        LoggerService.error(`Erro ao excluir artigo: ${req.params.id}`, error);
        return res.status(500).json({ erro: "Erro ao excluir artigo" });
    }
});

export default router;