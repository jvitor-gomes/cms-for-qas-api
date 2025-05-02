import { Router, Request, Response } from "express";
import { body } from "express-validator";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { AppDataSource } from "../database/data-source";
import { User } from "../entities/User";
import { validateRequest } from "../middleware/validateRequest";
import { LoggerService } from "../services/LoggerService";

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
            LoggerService.info("Tentativa de login", { email });

            const user = await userRepository.findOne({
                where: { email },
                select: ["id", "email", "senha", "nomeCompleto", "nomeUsuario"]
            });

            if (!user) {
                LoggerService.warn("Tentativa de login com email ou senha inválidos", { email });
                return res.status(401).json({ erro: "Email ou senha inválidos" });
            }

            const senhaValida = await bcrypt.compare(senha, user.senha);
            if (!senhaValida) {
                LoggerService.warn("Tentativa de login com email ou senha inválidos", { email });
                return res.status(401).json({ erro: "Email ou senha inválidos" });
            }

            const token = jwt.sign({ id: user.id }, JWT_SECRET, {
                expiresIn: "1d"
            });

            const { senha: _, ...userWithoutPassword } = user;

            LoggerService.info("Login realizado com sucesso", { userId: user.id });

            return res.json({
                user: userWithoutPassword,
                token
            });
        } catch (error) {
            LoggerService.error("Erro ao realizar login", error);
            return res.status(500).json({ erro: "Erro ao realizar login" });
        }
    }
);

export default router;