# addiopeccati

Aplicação web para exame de consciência com lista privada temporária para a confissão. A API fornece somente o catálogo editorial atual; seleções pessoais permanecem no navegador e nunca são enviadas ao servidor.

## Requisitos

- Node.js 24
- pnpm 11
- Docker Compose

## Desenvolvimento

```bash
pnpm install
cp .env.example .env
pnpm infra:up
pnpm db:migrate
pnpm catalog:sync
pnpm dev
```

Web: `http://127.0.0.1:5173`; API: `http://127.0.0.1:3000`.

## Comandos

```bash
pnpm check
pnpm test
pnpm build
pnpm db:migrate
pnpm catalog:sync
```

O catálogo fica em `content/editorial/pt-BR/examination-catalog.json`. O sync valida o JSON e substitui atomically o único catálogo atual no PostgreSQL.

## API

```text
GET /health
GET /v1/examination-catalogs/current?locale=pt-BR
```
