import { Router, Request, Response } from "express";
import { body } from "express-validator";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { AppDataSource } from "../database/data-source";
import { User } from "../entities/User";
import { validateRequest } from "../middleware/validateRequest";

const router = Router();
const userRepository = AppDataSource.getRepository(User);

const JWT_SECRET = process.env.JWT_SECRET || "sua_chave_secreta_aqui";

router.post("/login",
    [
        body("email").isEmail().withMessage("Email inválido"),
        body("senha").notEmpty().withMessage("Senha é obrigatória"),
        validateRequest
    ],
    async (req: Request, res: Response) => {
        try {
            const { email, senha } = req.body;

            const user = await userRepository.findOne({
                where: { email },
                select: ["id", "email", "senha", "nomeCompleto", "nomeUsuario"]
            });

            if (!user || !(await bcrypt.compare(senha, user.senha))) {
                return res.status(401).json({ erro: "Email ou senha inválidos" });
            }

            const token = jwt.sign({ id: user.id }, JWT_SECRET, {
                expiresIn: "1d"
            });

            const { senha: _, ...userWithoutPassword } = user;

            return res.json({
                user: userWithoutPassword,
                token
            });
        } catch (error) {
            console.error("Erro ao realizar login:", error);
            return res.status(500).json({ erro: "Erro ao realizar login" });
        }
    }
);

export default router; 