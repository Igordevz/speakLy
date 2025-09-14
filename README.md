# Speakly Backend

## Descrição

Esta é a API backend para o aplicativo Speakly, desenvolvida com Fastify, Prisma (SQLite), TypeScript e Bun. Ela implementa um fluxo de autenticação simplificado via Magic Link, onde o registro e o login são unificados em um único endpoint.

## Tecnologias Utilizadas

-   **Fastify**: Framework web rápido e de baixo overhead para Node.js.
-   **Prisma**: ORM moderno para Node.js e TypeScript, utilizando SQLite como banco de dados.
-   **TypeScript**: Superset tipado de JavaScript para maior robustez e manutenibilidade.
-   **Bun**: Runtime JavaScript rápido, bundler, transpiler e gerenciador de pacotes.
-   **Zod**: Biblioteca de validação de esquemas TypeScript-first.
-   **@fastify/jwt**: Plugin para Fastify para lidar com JSON Web Tokens (JWT).
-   **@google/generative-ai**: SDK para interagir com a API Gemini (sumarização).
-   **assemblyai**: SDK para interagir com a API AssemblyAI (transcrição).

## Configuração do Projeto

### Pré-requisitos

Certifique-se de ter o [Bun.js](https://bun.sh/docs/installation) instalado em sua máquina.

### Instalação

Navegue até o diretório `server` e instale as dependências:

```bash
bun install
```

### Configuração do Banco de Dados

O projeto utiliza SQLite, e o arquivo do banco de dados (`dev.db`) será criado automaticamente. Para garantir que seu esquema de banco de dados esteja atualizado com o modelo Prisma, execute:

```bash
bun run prisma:reset
```

Este comando irá **resetar seu banco de dados de desenvolvimento** e aplicar todas as migrações. **CUIDADO: Isso apagará todos os dados existentes no `dev.db`.**

Após o reset, ou se você apenas modificou o `schema.prisma` e precisa gerar o cliente Prisma:

```bash
bun run prisma:generate
```

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do diretório `server` com as seguintes variáveis:

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="sua_chave_secreta_jwt_aqui"
R2_ACCOUNT_ID="<SEU_ACCOUNT_ID_R2>"
R2_ACCESS_KEY_ID="<SUA_ACCESS_KEY_ID_R2>"
R2_SECRET_ACCESS_KEY="<SUA_SECRET_ACCESS_KEY_R2>"
R2_BUCKET_NAME="<SEU_BUCKET_NAME_R2>"
R2_PUBLIC_DOMAIN="https://pub-7831f95a38df44deae79f91dbde9d032.r2.dev" # Sua URL pública do R2
GEMINI_API_KEY="<SUA_API_KEY_GEMINI>"
ASSEMBLYAI_API_KEY="<SUA_API_KEY_ASSEMBLYAI>"
```

-   `DATABASE_URL`: URL de conexão com o banco de dados (para SQLite, aponta para o arquivo `dev.db`).
-   `JWT_SECRET`: Uma string longa e aleatória usada para assinar os tokens JWT. Você pode gerar uma com `openssl rand -hex 32`.
-   `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`: Credenciais do Cloudflare R2 para upload de áudio.
-   `R2_PUBLIC_DOMAIN`: **A URL pública do seu bucket R2.** Esta é a URL que o AssemblyAI usará para acessar seus arquivos. Ex: `https://pub-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.r2.dev`
-   `GEMINI_API_KEY`: Sua chave de API para o Google Gemini (sumarização).
-   `ASSEMBLYAI_API_KEY`: Sua chave de API para o AssemblyAI (transcrição).

## Executando a Aplicação

Para iniciar o servidor em modo de desenvolvimento (com `watch` para recarregar automaticamente as mudanças):

```bash
bun run dev
```

O servidor estará disponível em `http://localhost:3333`.

## Endpoints da API

### Autenticação (Magic Link)

-   **`POST /auth/magic-link`**
    -   **Descrição**: Inicia o fluxo de autenticação/registro via Magic Link. Se o usuário existir, um novo token é gerado e enviado. Se não existir, um novo usuário é criado e um token é gerado.
    -   **Corpo da Requisição (JSON)**:
        ```json
        {
          "email": "seu.email@example.com"
        }
        ```
    -   **Resposta de Sucesso**: O magic link será logado no console do servidor. A resposta da API será:
        ```json
        {
          "success": true,
          "message": "Magic link sent. Check your console for the link."
        }
        ```

### Validação do Magic Link

-   **`GET /token/:token`**
    -   **Descrição**: Valida o token do Magic Link recebido por e-mail (ou do console). Se o token for válido e não expirado, o usuário é autenticado e um JWT é retornado.
    -   **Parâmetros de Rota**: `:token` (o token hexadecimal do Magic Link).
    -   **Resposta de Sucesso (JSON)**:
        ```json
        {
          "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        }
        ```
    -   **Resposta de Erro**: Retorna um erro se o token for inválido ou expirado.

### Upload e Processamento de Áudio

-   **`POST /audio/upload-url`**
    -   **Descrição**: Solicita uma URL pré-assinada para fazer o upload direto de um arquivo de áudio para o Cloudflare R2. Cria um registro inicial no banco de dados.
    -   **Headers**: `jwt: <seu-jwt-aqui>`
    -   **Corpo da Requisição (JSON)**:
        ```json
        {
          "name": "nome-do-audio.mp3",
          "contentType": "audio/mpeg"
        }
        ```
    -   **Resposta de Sucesso (JSON)**:
        ```json
        {
          "uploadUrl": "https://<seu-bucket>.r2.cloudflarestorage.com/...<SEU_ACCOUNT_ID_R2>.r2.cloudflarestorage.com/<reference>",
          "audioId": "cuid-do-audio",
          "reference": "userId/timestamp_filename.mp3"
        }
        ```
    -   **Próximo Passo**: Use `uploadUrl` para fazer um `PUT` do arquivo de áudio diretamente para o R2.

-   **`POST /audio/process-uploaded`**
    -   **Descrição**: Aciona o processamento de um áudio já enviado para o R2. O backend transcreve o áudio com AssemblyAI e resume com Gemini.
    -   **Headers**: `jwt: <seu-jwt-aqui>`
    -   **Corpo da Requisição (JSON)**:
        ```json
        {
          "audioId": "cuid-do-audio",
          "reference": "userId/timestamp_filename.mp3",
          "contentType": "audio/mpeg"
        }
        ```
    -   **Resposta de Sucesso (JSON)**:
        ```json
        {
          "success": true,
          "message": "Audio processed successfully.",
          "audioId": "cuid-do-audio",
          "text_brute": "Texto transcrito aqui...",
          "resume": "Resumo do texto aqui..."
        }
        ```

## Notas

-   O Magic Link é exibido no console do servidor. Em uma aplicação real, ele seria enviado por e-mail ou outro canal de comunicação.
-   O JWT retornado na validação do Magic Link deve ser armazenado no cliente e enviado em requisições futuras para endpoints protegidos (no cabeçalho `jwt: <token>`).
-   **Permissões do Cloudflare R2:** Para que o AssemblyAI possa acessar os arquivos de áudio, o bucket R2 ou os objetos específicos devem ter permissões de leitura pública.
# speakLy
