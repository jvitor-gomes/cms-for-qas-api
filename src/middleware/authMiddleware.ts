import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { LoggerService } from "../services/LoggerService";

const JWT_SECRET = process.env.JWT_SECRET || "sua_chave_secreta_aqui";

export interface AuthRequest extends Request {
    userId?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        LoggerService.warn("Tentativa de acesso sem token", { path: req.path, method: req.method });
        return res.status(401).json({ erro: "Token não fornecido" });
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2) {
        LoggerService.warn("Token mal formatado", { path: req.path, method: req.method, token: authHeader });
        return res.status(401).json({ erro: "Token mal formatado" });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
        LoggerService.warn("Tipo de autenticação inválido", { path: req.path, method: req.method, scheme});
        return res.status(401).json({ erro: "Token mal formatado" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
        req.userId = decoded.id;
        LoggerService.info("Usuário autenticado com sucesso", { userId: decoded.id, });
        return next();
    } catch (error) {
        LoggerService.error("Token inválido", { path: req.path, method: req.method, error });
        return res.status(401).json({ erro: "Token inválido" });
    }
};