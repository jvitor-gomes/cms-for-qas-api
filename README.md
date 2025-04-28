# API - CMS For QA's (Gestão de Conteúdo)

Uma API RESTful para gestão de conteúdo com autenticação JWT, permitindo gerenciar usuários, categorias e artigos.

## Requisitos

- Node.js (versão 14 ou superior)
- npm ou yarn

## Instalação

1. Clone o repositório
2. Instale as dependências:
```
npm install
```

3. Inicie o servidor de desenvolvimento:
```
npm run dev
```

O servidor estará rodando em `http://localhost:3000`

## Autenticação

A API utiliza autenticação JWT (JSON Web Token). Para acessar endpoints protegidos:

1. Faça login através do endpoint `/auth/login`
2. Use o token retornado no header `Authorization: Bearer <token>`

Exemplo de login:

`POST /auth/login`
```json
{
  "nome": "Usuario",
  "email": "usuario@email.com"
}
```

## Endpoints

### Autenticação
- `POST /auth/login`: Login do usuário (retorna token JWT)

### Usuários

- `POST /usuarios`: Criar usuário (público)
  ```json
  {
    "nome": "Usuario",
    "email": "usuario@email.com"
  }
  ```
- `GET /usuarios`: Listar usuários (com filtros opcionais)
  - Query params: `nome`, `email`
- `GET /usuarios/:id`: Buscar usuário por ID
- `PUT /usuarios/:id`: Atualizar usuário
- `DELETE /usuarios/:id`: Excluir usuário

### Categorias

- `POST /categorias`: Criar categoria
  ```json
  {
    "nome": "Tecnologia",
    "descricao": "Artigos sobre tecnologia"
  }
  ```
- `GET /categorias`: Listar categorias
  - Query params: `nome`
- `GET /categorias/:id`: Buscar categoria por ID
- `PUT /categorias/:id`: Atualizar categoria
- `DELETE /categorias/:id`: Excluir categoria

### Artigos

- `POST /artigos`: Criar artigo
  ```json
  {
    "titulo": "Introdução aos Testes Automatizados",
    "conteudo": "Exemplos de ferramentas de testes automatizados...",
    "nomeAutor": "Usuario",
    "nomeCategoria": "Tecnologia",
    "dataPublicacao": "2024-03-21T10:00:00Z"
  }
  ```
- `GET /artigos`: Listar artigos (com paginação e filtros)
  - Query params: 
    - `categoriaId`: UUID da categoria
    - `autorId`: UUID do autor
    - `page`: Número da página (default: 1)
    - `limit`: Itens por página (default: 10)
- `GET /artigos/:id`: Buscar artigo por ID
- `PUT /artigos/:id`: Atualizar artigo
- `DELETE /artigos/:id`: Excluir artigo

## Modelos de Dados

### Usuário (User)
- `id`: UUID (automático)
- `nome`: string (obrigatório)
- `email`: string (obrigatório, único)
- `dataCriacao`: datetime (automático)
- `artigos`: array de Artigos

### Categoria (Category)
- `id`: UUID (automático)
- `nome`: string (obrigatório, único)
- `descricao`: string (opcional)
- `dataCriacao`: datetime (automático)
- `artigos`: array de Artigos

### Artigo (Article)
- `id`: UUID (automático)
- `titulo`: string (obrigatório, máx 100 caracteres)
- `conteudo`: texto (obrigatório)
- `autorId`: UUID (obrigatório, referência User)
- `categoriaId`: UUID (obrigatório, referência Category)
- `dataPublicacao`: datetime
- `dataCriacao`: datetime (automático)
- `autor`: objeto User
- `categoria`: objeto Category

## Regras de Negócio

1. Todos os endpoints (exceto criação de usuário e login) requerem autenticação JWT
2. Não é possível excluir um usuário que possui artigos vinculados
3. Não é possível excluir uma categoria que possui artigos vinculados
4. Email do usuário deve ser único
5. Nome da categoria deve ser único
6. Título do artigo deve ter no máximo 100 caracteres
7. Ao criar um artigo, o autor e a categoria são referenciados por nome

## Respostas de Erro

A API retorna erros no seguinte formato:
```json
{
  "erro": "Mensagem principal do erro",
  "errors": [
    {
      "msg": "Detalhamento do erro",
      "param": "Campo relacionado",
      "location": "Localização do erro"
    }
  ]
}
```
<hr>
<div align="center"> <h3>< Contato ></h4> </div>
<div align="center"> 
👤 Autor: João Vitor Gomes <br>
📧 Email: bgomes.joaovitor@gmail.com
</div>
