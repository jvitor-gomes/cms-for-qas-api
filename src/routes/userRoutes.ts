import { Router, Request, Response } from "express";
import { body } from "express-validator";
import bcrypt from "bcrypt";
import { AppDataSource } from "../database/data-source";
import { User } from "../entities/User";
import { validateRequest } from "../middleware/validateRequest";
import { QueryFailedError } from "typeorm";

const router = Router();
const userRepository = AppDataSource.getRepository(User);

interface CreateUserRequest {
    nomeCompleto: string;
    nomeUsuario: string;
    email: string;
    senha: string;
}

interface UpdateUserRequest {
    nomeCompleto?: string;
    nomeUsuario?: string;
    email?: string;
    senha?: string;
}

router.post("/",
    [
        body("nomeCompleto").notEmpty().withMessage("Nome completo é obrigatório"),
        body("nomeUsuario").notEmpty().withMessage("Nome de usuário é obrigatório"),
        body("email").isEmail().withMessage("Email inválido"),
        body("senha")
            .isLength({ min: 6 }).withMessage("Senha deve ter no mínimo 6 caracteres")
            .matches(/\d/).withMessage("Senha deve conter pelo menos um número")
            .matches(/[A-Z]/).withMessage("Senha deve conter pelo menos uma letra maiúscula"),
        validateRequest
    ],
    async (req: Request<{}, {}, CreateUserRequest>, res: Response) => {
        try {
            const [existingUserByUsername, existingUserByEmail] = await Promise.all([
                userRepository.findOne({ where: { nomeUsuario: req.body.nomeUsuario } }),
                userRepository.findOne({ where: { email: req.body.email } })
            ]);

            const errors = [];
            if (existingUserByUsername) {
                errors.push({ campo: "nomeUsuario", mensagem: "Nome de usuário já está em uso" });
            }
            if (existingUserByEmail) {
                errors.push({ campo: "email", mensagem: "E-mail já está em uso" });
            }

            if (errors.length > 0) {
                return res.status(400).json({ erros: errors });
            }

            const hashedPassword = await bcrypt.hash(req.body.senha, 10);

            const user = userRepository.create({
                nomeCompleto: req.body.nomeCompleto,
                nomeUsuario: req.body.nomeUsuario,
                email: req.body.email,
                senha: hashedPassword
            });

            await userRepository.save(user);

            const { senha: _, ...userWithoutPassword } = user as User & { senha: string };
            return res.status(201).json(userWithoutPassword);
        } catch (error) {
            console.error("Erro ao criar usuário:", error);
            return res.status(500).json({ erro: "Erro ao criar usuário" });
        }
    }
);

router.get("/", async (req: Request<{}, {}, {}, { nomeUsuario?: string; email?: string }>, res: Response) => {
    try {
        const { nomeUsuario, email } = req.query;
        let where = {};

        if (nomeUsuario) {
            where = { ...where, nomeUsuario };
        }
        if (email) {
            where = { ...where, email };
        }

        const users = await userRepository.find({ where });
        return res.json(users);
    } catch (error) {
        return res.status(500).json({ erro: "Erro ao listar usuários" });
    }
});

router.get("/:id", async (req: Request<{ id: string }>, res: Response) => {
    try {
        const user = await userRepository.findOne({ where: { id: req.params.id } });
        if (!user) {
            return res.status(404).json({ erro: "Usuário não encontrado" });
        }
        return res.json(user);
    } catch (error) {
        return res.status(500).json({ erro: "Erro ao buscar usuário" });
    }
});

router.put("/:id",
    [
        body("nomeCompleto").optional().notEmpty().withMessage("Nome completo não pode ser vazio"),
        body("nomeUsuario").optional().notEmpty().withMessage("Nome de usuário não pode ser vazio"),
        body("email").optional().isEmail().withMessage("Email inválido"),
        body("senha")
            .optional()
            .isLength({ min: 6 }).withMessage("Senha deve ter no mínimo 6 caracteres")
            .matches(/\d/).withMessage("Senha deve conter pelo menos um número")
            .matches(/[A-Z]/).withMessage("Senha deve conter pelo menos uma letra maiúscula"),
        validateRequest
    ],
    async (req: Request<{ id: string }, {}, UpdateUserRequest>, res: Response) => {
        try {
            const user = await userRepository.findOne({ 
                where: { id: req.params.id },
                select: ["id", "nomeCompleto", "nomeUsuario", "email", "senha"]
            });
            
            if (!user) {
                return res.status(404).json({ erro: "Usuário não encontrado" });
            }

            const updateData: Partial<UpdateUserRequest> = {};
            let hasChanges = false;

            if (req.body.nomeCompleto && req.body.nomeCompleto !== user.nomeCompleto) {
                updateData.nomeCompleto = req.body.nomeCompleto;
                hasChanges = true;
            }

            if (req.body.nomeUsuario && req.body.nomeUsuario !== user.nomeUsuario) {
                const existingUser = await userRepository.findOne({
                    where: { nomeUsuario: req.body.nomeUsuario }
                });

                if (existingUser) {
                    return res.status(400).json({ erro: "Nome de usuário já está em uso" });
                }
                updateData.nomeUsuario = req.body.nomeUsuario;
                hasChanges = true;
            }

            if (req.body.email && req.body.email !== user.email) {
                updateData.email = req.body.email;
                hasChanges = true;
            }

            if (req.body.senha) {
                updateData.senha = await bcrypt.hash(req.body.senha, 10);
                hasChanges = true;
            }

            if (!hasChanges) {
                return res.status(200).json({ mensagem: "Não houve alterações" });
            }

            Object.assign(user, updateData);
            await userRepository.save(user);
            
            const { senha: _, ...userWithoutPassword } = user as User & { senha: string };
            return res.json(userWithoutPassword);
        } catch (error) {
            if (error instanceof QueryFailedError && error.message.includes('duplicate key')) {
                if (error.message.includes('email')) {
                    return res.status(400).json({ erro: "Email já está em uso" });
                }
                return res.status(400).json({ erro: "Nome de usuário já está em uso" });
            }
            return res.status(500).json({ erro: "Erro ao atualizar usuário" });
        }
    }
);

router.delete("/:id", async (req: Request<{ id: string }>, res: Response) => {
    try {
        const user = await userRepository.findOne({ 
            where: { id: req.params.id },
            relations: ["artigos"]
        });

        if (!user) {
            return res.status(404).json({ erro: "Usuário não encontrado" });
        }

        if (user.artigos && user.artigos.length > 0) {
            return res.status(400).json({ erro: "Não é possível excluir usuário com artigos vinculados" });
        }

        await userRepository.remove(user);
        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ erro: "Erro ao excluir usuário" });
    }
});

export default router;