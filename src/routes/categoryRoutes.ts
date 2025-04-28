import { Router, Request, Response } from "express";
import { body } from "express-validator";
import { AppDataSource } from "../database/data-source";
import { Category } from "../entities/Category";
import { validateRequest } from "../middleware/validateRequest";

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

            const existingCategory = await categoryRepository.findOne({ where: { nome } });
            if (existingCategory) {
                return res.status(400).json({ erro: "Nome de categoria já existe" });
            }

            const category = categoryRepository.create({ nome, descricao });
            await categoryRepository.save(category);
            
            return res.status(201).json(category);
        } catch (error) {
            return res.status(500).json({ erro: "Erro ao criar categoria" });
        }
    }
);

router.get("/", async (req: Request<{}, {}, {}, { nome?: string }>, res: Response) => {
    try {
        const { nome } = req.query;
        let where = {};

        if (nome) {
            where = { nome: nome };
        }

        const categories = await categoryRepository.find({ where });
        return res.json(categories);
    } catch (error) {
        return res.status(500).json({ erro: "Erro ao listar categorias" });
    }
});

router.get("/:id", async (req: Request<{ id: string }>, res: Response) => {
    try {
        const category = await categoryRepository.findOne({ where: { id: req.params.id } });
        if (!category) {
            return res.status(404).json({ erro: "Categoria não encontrada" });
        }
        return res.json(category);
    } catch (error) {
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
            const category = await categoryRepository.findOne({ where: { id: req.params.id } });
            if (!category) {
                return res.status(404).json({ erro: "Categoria não encontrada" });
            }

            categoryRepository.merge(category, { descricao: req.body.descricao });
            await categoryRepository.save(category);
            
            return res.json(category);
        } catch (error) {
            return res.status(500).json({ erro: "Erro ao atualizar categoria" });
        }
    }
);

router.delete("/:id", async (req: Request<{ id: string }>, res: Response) => {
    try {
        const category = await categoryRepository.findOne({
            where: { id: req.params.id },
            relations: ["artigos"]
        });

        if (!category) {
            return res.status(404).json({ erro: "Categoria não encontrada" });
        }

        if (category.artigos && category.artigos.length > 0) {
            return res.status(400).json({ erro: "Não é possível excluir categoria com artigos vinculados" });
        }

        await categoryRepository.remove(category);
        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ erro: "Erro ao excluir categoria" });
    }
});

export default router; 