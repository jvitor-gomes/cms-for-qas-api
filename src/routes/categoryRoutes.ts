import { Router, Request, Response } from "express";
import { body } from "express-validator";
import { AppDataSource } from "../database/data-source";
import { Category } from "../entities/Category";
import { validateRequest } from "../middleware/validateRequest";
import { LoggerService } from "../services/LoggerService";

const router = Router();
const categoryRepository = AppDataSource.getRepository(Category);

interface CreateCategoryRequest {
    nome: string;
    descricao?: string;
}

interface UpdateCategoryRequest {
    descricao: string;
}

router.post("/",
    [
        body("nome").notEmpty().withMessage("Nome é obrigatório"),
        validateRequest
    ],
    async (req: Request<{}, {}, CreateCategoryRequest>, res: Response) => {
        try {
            const { nome, descricao } = req.body;
            LoggerService.info(`Iniciando criação de categoria: ${nome}`);

            const existingCategory = await categoryRepository.findOne({ where: { nome } });
            if (existingCategory) {
                LoggerService.warn(`Tentativa de criar categoria com nome duplicado: ${nome}`);
                return res.status(400).json({ erro: "Nome de categoria já existe" });
            }

            const category = categoryRepository.create({ nome, descricao });
            await categoryRepository.save(category);
            
            LoggerService.info(`Categoria criada com sucesso: ${category.id}`);
            return res.status(201).json(category);
        } catch (error) {
            LoggerService.error("Erro ao criar categoria", error);
            return res.status(500).json({ erro: "Erro ao criar categoria" });
        }
    }
);

router.get("/", async (req: Request<{}, {}, {}, { nome?: string }>, res: Response) => {
    try {
        const { nome } = req.query;
        LoggerService.info("Listando categorias", nome ? { filtroNome: nome } : undefined);

        let where = {};
        if (nome) {
            where = { nome: nome };
        }

        const categories = await categoryRepository.find({ where });
        LoggerService.info(`Categorias listadas com sucesso. Total: ${categories.length}`);
        return res.json(categories);
    } catch (error) {
        LoggerService.error("Erro ao listar categorias", error);
        return res.status(500).json({ erro: "Erro ao listar categorias" });
    }
});

router.get("/:id", async (req: Request<{ id: string }>, res: Response) => {
    try {
        LoggerService.info(`Buscando categoria: ${req.params.id}`);
        const category = await categoryRepository.findOne({ where: { id: req.params.id } });
        if (!category) {
            LoggerService.warn(`Categoria não encontrada: ${req.params.id}`);
            return res.status(404).json({ erro: "Categoria não encontrada" });
        }
        LoggerService.info(`Categoria encontrada: ${req.params.id}`);
        return res.json(category);
    } catch (error) {
        LoggerService.error(`Erro ao buscar categoria: ${req.params.id}`, error);
        return res.status(500).json({ erro: "Erro ao buscar categoria" });
    }
});

router.put("/:id",
    [
        body("descricao").optional().notEmpty().withMessage("Descrição não pode ser vazia"),
        validateRequest
    ],
    async (req: Request<{ id: string }, {}, UpdateCategoryRequest>, res: Response) => {
        try {
            LoggerService.info(`Iniciando atualização da categoria: ${req.params.id}`);
            const category = await categoryRepository.findOne({ where: { id: req.params.id } });
            if (!category) {
                LoggerService.warn(`Categoria não encontrada para atualização: ${req.params.id}`);
                return res.status(404).json({ erro: "Categoria não encontrada" });
            }

            categoryRepository.merge(category, { descricao: req.body.descricao });
            await categoryRepository.save(category);
            
            LoggerService.info(`Categoria atualizada com sucesso: ${req.params.id}`);
            return res.json(category);
        } catch (error) {
            LoggerService.error(`Erro ao atualizar categoria: ${req.params.id}`, error);
            return res.status(500).json({ erro: "Erro ao atualizar categoria" });
        }
    }
);

router.delete("/:id", async (req: Request<{ id: string }>, res: Response) => {
    try {
        LoggerService.info(`Iniciando exclusão da categoria: ${req.params.id}`);
        const category = await categoryRepository.findOne({
            where: { id: req.params.id },
            relations: ["artigos"]
        });

        if (!category) {
            LoggerService.warn(`Categoria não encontrada para exclusão: ${req.params.id}`);
            return res.status(404).json({ erro: "Categoria não encontrada" });
        }

        if (category.artigos && category.artigos.length > 0) {
            LoggerService.warn(`Tentativa de excluir categoria com artigos vinculados: ${req.params.id}`);
            return res.status(400).json({ erro: "Não é possível excluir categoria com artigos vinculados" });
        }

        await categoryRepository.remove(category);
        LoggerService.info(`Categoria excluída com sucesso: ${req.params.id}`);
        return res.status(204).send();
    } catch (error) {
        LoggerService.error(`Erro ao excluir categoria: ${req.params.id}`, error);
        return res.status(500).json({ erro: "Erro ao excluir categoria" });
    }
});

export default router;