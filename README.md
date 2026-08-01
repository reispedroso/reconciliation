# Reconciliation

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

## Comandos disponíveis

```bash
pnpm install
pnpm check
pnpm test
pnpm build

pnpm catalog:normalize <entrada-v1.json> <saida-v2.json>
pnpm catalog:map-rules

cp .env.example .env
pnpm infra:up
pnpm db:migrate
pnpm db:seed
pnpm db:studio
pnpm infra:down

pnpm api:dev
pnpm build
pnpm api:start
```

`infra:down` para o container, mas preserva o volume nomeado do PostgreSQL. Não use
`docker compose down -v` a menos que queira apagar deliberadamente o banco local.

O mapeamento de regras transforma deterministicamente o catálogo v2 em
`content/editorial/pt-BR/examination-catalog.v3.json`. O seed valida o v3 e carrega
somente conteúdo editorial. Ele substitui a mesma versão enquanto ela for
rascunho e recusa sobrescrever uma versão publicada.

A API expõe:

```text
GET /health
GET /v1/examination-catalogs/current?locale=pt-BR
```

O endpoint do catálogo retorna somente uma versão `published`. Enquanto o banco
possuir apenas o catálogo `0.2.0-draft`, a resposta esperada é
`404 catalog_not_found`.

## Comandos planejados

```bash
pnpm web:dev
```

Os comandos da aplicação web serão implementados no respectivo marco.
