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
pnpm dev

pnpm catalog:normalize <entrada-v1.json> <saida-v2.json>
pnpm catalog:map-rules

cp .env.example .env
pnpm infra:up
pnpm db:migrate
pnpm db:seed
pnpm db:studio
pnpm infra:down

pnpm api:dev
pnpm web:dev
pnpm build
pnpm api:start
```

Com o PostgreSQL ativo, `pnpm dev` sobe API e interface em conjunto:

```text
http://127.0.0.1:3000   API
http://127.0.0.1:5173   interface web
```

Abra `http://127.0.0.1:5173` e use **Abrir prévia do exame**. As marcações
ficam apenas na memória da página e são apagadas ao recarregá-la.

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
GET /v1/examination-catalogs/preview?locale=pt-BR&catalogVersion=0.3.0-draft
```

O endpoint do catálogo retorna somente uma versão `published`. Enquanto o banco
possuir apenas catálogos rascunho, a resposta esperada é
`404 catalog_not_found`.

O endpoint `/preview` é exclusivo para desenvolvimento: exige
`ENABLE_DRAFT_PREVIEW=true`, uma versão `-draft` explícita e não é registrado
quando `NODE_ENV=production`. Ele serve somente conteúdo editorial; respostas
do exame nunca são enviadas à API.
