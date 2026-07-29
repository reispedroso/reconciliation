# Confession App

Aplicação web para auxiliar católicos no exame de consciência e na preparação pessoal para a confissão.

## Stack

- pnpm Workspaces
- React
- Vite
- React Router
- Fastify
- PostgreSQL
- Drizzle ORM
- Zod
- Docker Compose
- Vitest
- Playwright

## Arquitetura

```text
apps/web              Interface web
apps/api              API REST
packages/domain       Regras de negócio puras
packages/contracts    Contratos HTTP e schemas Zod
packages/database     Drizzle, PostgreSQL, migrations e seeds
```

## Princípio de privacidade

O servidor armazena apenas conteúdo editorial.

As respostas pessoais, seleções, observações e o resumo do usuário devem permanecer no navegador ou dispositivo. Esses dados não devem ser enviados para a API nem persistidos no PostgreSQL no MVP.

## Documentação principal

Leia antes de alterar produto ou arquitetura:

- `AGENTS.md`
- `PLANS.md`
- `docs/product/mvp.md`
- `docs/product/privacy.md`
- `docs/domain/glossary.md`
- `docs/domain/examination-rules.md`
- `docs/architecture/overview.md`
- `docs/architecture/boundaries.md`

## Comandos planejados

```bash
pnpm install
pnpm dev
pnpm check
pnpm test
pnpm build

pnpm infra:up
pnpm infra:down

pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm db:studio
```

Os scripts serão implementados durante a fundação do monorepo.
