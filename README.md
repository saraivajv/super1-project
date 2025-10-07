# Mini Marketplace de Serviços

Bem-vindo ao Mini Marketplace de Serviços, uma plataforma full-stack completa onde prestadores podem oferecer seus serviços e clientes podem contratá-los de forma simples e intuitiva.

---

## 🏛️ Arquitetura

O projeto foi construído sobre uma arquitetura de microsserviços containerizada, garantindo isolamento, escalabilidade e um ambiente de desenvolvimento consistente.

- **Backend:** API RESTful construída com **Node.js** e **Express.js**.
- **Frontend:** Interface reativa e moderna desenvolvida com **SvelteKit** e estilizada com **Tailwind CSS**.
- **Banco de Dados:** **PostgreSQL** como a nossa base de dados relacional principal.
- **Cache:** **Redis** para cache de respostas de API, como a busca por horários disponíveis, melhorando a performance.
- **Orquestração:** **Docker** e **Docker Compose** para gerenciar todos os serviços, garantindo que a aplicação inteira suba com um único comando.

---

## 🚀 Como Executar o Projeto

Siga os passos abaixo para ter a aplicação rodando localmente.

### Pré-requisitos

- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/products/docker-desktop/) (que inclui o Docker Compose)
- Um editor de código, como o [VS Code](https://code.visualstudio.com/).

### 1. Clonar o Repositório

Abra o seu terminal e clone o projeto:

```bash
git clone https://github.com/saraivajv/super1-project
cd super1-project
```

### 2. Configurar Variáveis de Ambiente

Crie uma cópia do arquivo de exemplo `.env.example` e renomeie-a para `.env`.

```bash
cp .env.example .env
```

O arquivo `.env` já vem com valores padrão para o ambiente Docker e não precisa de alterações para rodar o projeto.

### 3. Rodar a Aplicação com Docker

Com o Docker Desktop em execução, suba todos os serviços com o seguinte comando. Na primeira vez, use a flag `--build` para construir as imagens:

```bash
docker compose up --build
```

Aguarde até que todos os serviços estejam estáveis. Você verá logs do `backend`, `frontend`, `db` e `cache`.


Você verá logs no terminal indicando que os dados foram criados com sucesso.

### 4. Acessar a Aplicação

- **Frontend (Aplicação Principal):** `http://localhost:5173`
- **Backend (API):** `http://localhost:3000`

---

## 📜 Scripts Disponíveis

Os scripts são executados a partir da pasta correspondente (`backend` ou `frontend`).

### Backend (`/backend`)

- `npm run dev`: Inicia o servidor em modo de desenvolvimento com `nodemon`.
- `npm run start`: Inicia o servidor em modo de produção.

### Frontend (`/frontend`)

- `npm run dev`: Inicia o servidor de desenvolvimento do SvelteKit.
- `npm run build`: Compila a aplicação para produção.
