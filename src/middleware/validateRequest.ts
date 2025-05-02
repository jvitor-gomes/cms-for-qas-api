import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { LoggerService } from "../services/LoggerService";

export const validateRequest = (
    req: Request,
    res: Response,
    next: NextFunction
): Response | void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const validationErrors = errors.array();
        LoggerService.warn(`Validação falhou na rota ${req.method} ${req.path}`, { errors: validationErrors });
        return res.status(400).json({ errors: validationErrors });
    }
    LoggerService.info(`Validação bem-sucedida na rota ${req.method} ${req.path}`);
    next();
};