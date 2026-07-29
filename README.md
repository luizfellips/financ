# Financ — Finanças Pessoais

Aplicação web completa de finanças pessoais, com dashboard premium, receitas, despesas, categorias, orçamentos, metas, relatórios e importação/exportação.

Inspirada em produtos como Monarch Money, YNAB, Copilot Money e Mobills.

## Tech Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** + **Lucide** + **Framer Motion**
- **Prisma ORM** + **PostgreSQL 16**
- **Auth.js (NextAuth v5)** — Credentials + JWT
- **TanStack Query** + **Zustand** + **React Hook Form** + **Zod**
- **Recharts** + **date-fns** + **sonner**
- **Vitest** + **React Testing Library**
- **Docker** + **Railway-ready**

## Features

- Autenticação completa (registro, login, logout, rotas protegidas)
- Dashboard com KPIs animados, fluxo de caixa, contas próximas, orçamentos e metas
- CRUD de receitas e despesas (recorrência e parcelamento)
- Categorias customizáveis (cor + ícone)
- Orçamentos mensais com alertas
- Metas financeiras com aportes e estimativa de conclusão
- Histórico unificado de transações (filtros, busca, ordenação, paginação)
- Relatórios com gráficos Recharts
- Importação/exportação CSV e JSON + backup/restore
- Tema claro / escuro / sistema
- Command palette (`Ctrl+K`)
- Layout responsivo mobile-first

## Screenshots

Após subir a aplicação localmente, capture e anexe:

- Dashboard (`/dashboard`)
- Transações (`/transacoes`)
- Relatórios (`/relatorios`)
- Login (`/login`)

## Architecture

```
UI (App Router) → TanStack Query hooks → Route Handlers
  → Controllers → Services → Repositories → Prisma → PostgreSQL
```

Camadas:

- `src/app` — páginas e route handlers
- `src/features` — UI por domínio
- `src/components` — UI compartilhada + shadcn
- `src/server/controllers` — orquestração HTTP
- `src/server/services` — regras de negócio
- `src/server/repositories` — acesso a dados (sempre scoped por `userId`)
- `src/server/validation` — schemas Zod
- `src/server/dto` — mappers Decimal ↔ number

## Folder Structure

```text
financ/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (auth)/login|register
│   │   ├── (dashboard)/dashboard|transacoes|receitas|despesas|...
│   │   └── api/...
│   ├── components/{ui,layout,shared,charts,providers}
│   ├── features/{transactions,categories,budgets,goals}
│   ├── hooks/
│   ├── lib/
│   ├── server/{controllers,services,repositories,validation,dto,errors,http}
│   ├── stores/
│   ├── types/
│   └── utils/
├── tests/
├── docker-compose.yml
├── Dockerfile
├── railway.json
└── README.md
```

## Prerequisites

- Node.js 20+ (recomendado 22)
- npm 10+
- Docker Desktop (para PostgreSQL e deploy local)

## Environment Variables

Copie o exemplo e ajuste:

```bash
cp .env.example .env
```

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string PostgreSQL |
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | Segredo JWT (32+ chars) |
| `AUTH_URL` / `NEXTAUTH_URL` | URL pública da app |
| `PORT` | Porta HTTP (padrão `3000`) |
| `NODE_ENV` | `development` ou `production` |
| `SEED_USER_EMAIL` | E-mail do usuário demo |
| `SEED_USER_PASSWORD` | Senha do usuário demo |

## Installation

```bash
npm install
cp .env.example .env
# Defina AUTH_SECRET com ≥32 caracteres aleatórios no .env
# Para Postgres via Compose com porta no host, crie docker-compose.override.yml
# (veja seção Docker) ou use um Postgres local.
docker compose up -d db
npx prisma migrate dev
npm run db:seed
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Credenciais demo

- **E-mail:** `demo@financ.app`
- **Senha:** `Demo@123456`

## Development

```bash
npm run dev          # Next.js + Turbopack
npm run typecheck    # TypeScript strict
npm run lint         # ESLint
npm run format       # Prettier
npm test             # Vitest
npm run db:studio    # Prisma Studio
```

## Database

```bash
npm run db:migrate          # migrate dev
npm run db:migrate:deploy   # produção
npm run db:seed             # dados demo pt-BR
npm run db:reset            # reset + seed
```

## Docker

Sobe app + Postgres em um comando (defina um `AUTH_SECRET` forte com ≥32 caracteres):

```bash
# PowerShell
$env:AUTH_SECRET = -join ((48..57)+(65..90)+(97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
docker compose up --build

# bash
export AUTH_SECRET="$(openssl rand -base64 32)"
docker compose up --build
```

- App: http://localhost:3000
- Healthcheck: `GET /api/health` (verifica Postgres)
- O Postgres **não** é publicado na porta do host (rede interna do Compose). Para `psql`: `docker compose exec db psql -U financ -d financ`
- No start, o container executa `prisma migrate deploy` e sobe o Next.js standalone

Somente o banco (para desenvolvimento local com `npm run dev`, publique a porta via override):

```bash
# docker-compose.override.yml (gitignored localmente)
# services:
#   db:
#     ports:
#       - "5432:5432"
docker compose up -d db
```

## Railway Deployment

1. Crie um projeto no [Railway](https://railway.app)
2. Adicione um serviço PostgreSQL
3. Faça deploy deste repositório (Dockerfile)
4. Configure as variáveis:

```env
DATABASE_URL=<railway postgres url>
AUTH_SECRET=<gere um secret longo>
NEXTAUTH_SECRET=<mesmo secret>
AUTH_URL=https://seu-dominio.up.railway.app
NEXTAUTH_URL=https://seu-dominio.up.railway.app
NODE_ENV=production
PORT=3000
```

O arquivo `railway.json` já define healthcheck em `/api/health`.

Após o deploy, rode o seed uma vez (Railway shell ou one-off):

```bash
npx prisma db seed
```

## Scripts

| Script | Descrição |
|--------|-----------|
| `dev` | Servidor de desenvolvimento |
| `build` | `prisma generate` + `next build` |
| `start` | Servidor de produção |
| `test` | Testes Vitest |
| `lint` | ESLint |
| `typecheck` | `tsc --noEmit` |
| `db:*` | Comandos Prisma |

## API Overview

Resposta padrão:

```json
{
  "success": true,
  "data": {},
  "meta": { "page": 1, "pageSize": 20, "total": 100, "totalPages": 5 }
}
```

Principais rotas autenticadas:

- `GET /api/dashboard`
- `CRUD /api/transactions|incomes|expenses`
- `CRUD /api/categories|budgets|goals`
- `GET /api/reports`
- `GET /api/export` · `POST /api/import`
- `GET /api/backup` · `POST /api/restore`
- `GET /api/health` (público)
- `POST /api/auth/register` (público)

## Testing

```bash
npm test
```

Cobertura básica:

- Utilitários de moeda e data
- KPI card
- Filtros de transações
- Schemas Zod (auth, budget, transaction)
- Cálculo de orçamento e parcelamento

## License

MIT © Financ
