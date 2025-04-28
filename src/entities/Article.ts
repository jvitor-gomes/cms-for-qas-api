import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";
import { Category } from "./Category";

@Entity("articles")
export class Article {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ length: 100 })
    titulo: string;

    @Column("text")
    conteudo: string;

    @Column({ name: "autor_id" })
    autorId: string;

    @Column({ name: "categoria_id" })
    categoriaId: string;

    @Column({ name: "data_publicacao" })
    dataPublicacao: Date;

    @CreateDateColumn({ name: "data_criacao" })
    dataCriacao: Date;

    @ManyToOne(() => User, user => user.artigos)
    @JoinColumn({ name: "autor_id" })
    autor: User;

    @ManyToOne(() => Category, category => category.artigos)
    @JoinColumn({ name: "categoria_id" })
    categoria: Category;
} 