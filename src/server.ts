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

        app.listen(PORT, () => {
            console.log("\n=== CMS API ===");
            console.log(`Servidor iniciado com sucesso na porta ${PORT}`);
            console.log(`Documentação: http://localhost:${PORT}/api-docs\n`);
        });
    })
    .catch((error) => {
        console.error("Erro ao inicializar o servidor:", error);
        process.exit(1);
    }); 