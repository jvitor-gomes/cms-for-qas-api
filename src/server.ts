import "reflect-metadata";
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { AppDataSource } from "./database/data-source";
import userRoutes from "./routes/userRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import articleRoutes from "./routes/articleRoutes";
import authRoutes from "./routes/authRoutes";
import { authMiddleware } from "./middleware/authMiddleware";
import { Router } from "express";
import { DatabaseCleanupService } from "./services/DatabaseCleanupService";
import { LoggerService } from "./services/LoggerService";

const app = express();

app.use(cors());
app.use(express.json());

const swaggerDocument = YAML.load(path.resolve(__dirname, "../swagger.yaml"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/auth", authRoutes);

const userRouter = Router();
app.use("/usuarios", userRouter);

userRouter.post("/", userRoutes);

userRouter.use(authMiddleware);
userRouter.get("/", userRoutes);
userRouter.get("/:id", userRoutes);
userRouter.put("/:id", userRoutes);
userRouter.delete("/:id", userRoutes);

app.use("/categorias", authMiddleware, categoryRoutes);
app.use("/artigos", authMiddleware, articleRoutes);

const PORT = process.env.PORT || 3000;

AppDataSource.initialize()
    .then(async () => {
        const cleanupService = new DatabaseCleanupService();
        await cleanupService.verificarEstadoAtual();
        LoggerService.info("Banco de dados inicializado com sucesso");

        app.listen(PORT, () => {
            LoggerService.info(`Servidor iniciado na porta ${PORT}`);
            LoggerService.info(`Documentação disponível em http://localhost:${PORT}/api-docs`);
        });
    })
    .catch((error) => {
        LoggerService.error("Erro ao inicializar o servidor", error);
        process.exit(1);
    });