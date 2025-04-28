import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index, CreateDateColumn } from "typeorm";
import { Article } from "./Article";

@Entity("categories")
export class Category {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    @Index({ unique: true })
    nome: string;

    @Column({ nullable: true })
    descricao: string;

    @CreateDateColumn({ name: "data_criacao" })
    dataCriacao: Date;

    @OneToMany(() => Article, article => article.categoria)
    artigos: Article[];
} 