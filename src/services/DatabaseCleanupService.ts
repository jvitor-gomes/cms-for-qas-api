import { AppDataSource } from "../database/data-source";
import { EventSubscriber, EntitySubscriberInterface, InsertEvent } from "typeorm";

@EventSubscriber()
export class DatabaseCleanupService implements EntitySubscriberInterface {
    private static LIMITE_REGISTROS = 500;
    private static REGISTROS_PARA_REMOVER = 250;
    private tableCounters: Map<string, number>;

    constructor() {
        this.tableCounters = new Map();
        AppDataSource.subscribers.push(this);
        console.log("Serviço de limpeza automática do banco de dados iniciado");
    }

    afterInsert(event: InsertEvent<any>): void {
        const tableName = event.metadata.tableName;
        const currentCount = (this.tableCounters.get(tableName) || 0) + 1;
        this.tableCounters.set(tableName, currentCount);

        if (currentCount >= DatabaseCleanupService.LIMITE_REGISTROS) {
            this.limparRegistrosAntigos(event.metadata.target, tableName);
            this.tableCounters.set(tableName, 0);
        }
    }

    private async limparRegistrosAntigos(entity: any, tableName: string): Promise<void> {
        try {
            const repository = AppDataSource.getRepository(entity);
            
            const registrosAntigos = await repository
                .createQueryBuilder()
                .orderBy("COALESCE(created_at, data_registro)", "ASC")
                .take(DatabaseCleanupService.REGISTROS_PARA_REMOVER)
                .getMany();

            if (registrosAntigos.length > 0) {
                await repository.remove(registrosAntigos);
                console.log(`[Limpeza Automática] Removidos ${registrosAntigos.length} registros antigos da tabela ${tableName}`);
            }
        } catch (error) {
            console.error(`[Limpeza Automática] Erro ao limpar registros da tabela ${tableName}:`, error);
        }
    }

    async verificarEstadoAtual(): Promise<void> {
        const entities = AppDataSource.entityMetadatas;
        
        for (const entity of entities) {
            try {
                const repository = AppDataSource.getRepository(entity.target);
                const count = await repository.count();
                
                if (count >= DatabaseCleanupService.LIMITE_REGISTROS) {
                    await this.limparRegistrosAntigos(entity.target, entity.tableName);
                }
                
                this.tableCounters.set(entity.tableName, count % DatabaseCleanupService.LIMITE_REGISTROS);
            } catch (error) {
                console.error(`[Limpeza Automática] Erro ao verificar tabela ${entity.tableName}:`, error);
            }
        }
    }
} 