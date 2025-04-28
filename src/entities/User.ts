import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, Index } from "typeorm";
import { Article } from "./Article";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "nome_completo" })
    nomeCompleto: string;

    @Column({ name: "nome_usuario" })
    @Index({ unique: true })
    nomeUsuario: string;

    @Column()
    @Index({ unique: true })
    email: string;

    @Column({ select: false })
    senha: string;

    @CreateDateColumn({ name: "data_criacao" })
    dataCriacao: Date;

    @OneToMany(() => Article, article => article.autor)
    artigos: Article[];
} 