# Addio peccati

Aplicação web católica para auxiliar o exame de consciência e a preparação
pessoal para a confissão.

O projeto organiza um catálogo editorial versionado, conduz o usuário por
seções do exame e mantém as marcações privadas no próprio navegador. Ele não
substitui um sacerdote, não oferece absolvição e não presume automaticamente a
culpabilidade pessoal do usuário.

> **Estado atual:** aplicação em desenvolvimento, com conteúdo rascunho ainda
> sujeito a revisão clerical. Não está pronta para uso pastoral em produção.

## O que já funciona

- catálogo editorial em português estruturado e versionado;
- PostgreSQL local com migrations e seed do conteúdo editorial;
- API REST somente para leitura do catálogo;
- endpoint controlado para visualizar conteúdo rascunho em desenvolvimento;
- exame dividido em nove seções, exibidas uma por vez;
- navegação anterior/próxima e progresso responsivo;
- seleções múltiplas e opções negativas exclusivas;
- explicação das três condições do pecado mortal com referência ao Catecismo;
- seleções e etapa atual restauradas durante a mesma aba com `sessionStorage`;
- lista privada dos itens marcados, agrupada por seção ao final do exame;
- ação explícita para apagar o exame local;
- interface adaptada para celular e desktop;
- validação de contratos e regras com testes automatizados.

## Próximos marcos

- interface completa para avaliar matéria grave, plena consciência e
  consentimento deliberado;
- perguntas complementares previstas nas regras do domínio;
- revisão clerical e publicação de uma versão editorial;
- refinamento contínuo de acessibilidade e experiência mobile.

## Privacidade por arquitetura

O PostgreSQL armazena somente conteúdo editorial, como perguntas, opções,
regras, referências doutrinárias e versões.

As seleções pessoais:

- permanecem na aba atual do navegador;
- não são enviadas à API;
- não são armazenadas no PostgreSQL;
- não entram em logs ou analytics;
- podem ser apagadas pelo próprio usuário.

O `sessionStorage` é utilizado para evitar que uma atualização acidental da
página destrua o progresso. Fechar a aba encerra essa sessão. O projeto não usa
`localStorage` automaticamente para o exame pessoal.

Leia a política completa em [docs/product/privacy.md](docs/product/privacy.md).

## Arquitetura

Monorepo TypeScript com monólito modular:

```text
apps/web              React, Vite e React Router
apps/api              Fastify e API REST
packages/domain       Regras de negócio em TypeScript puro
packages/contracts    DTOs, contratos HTTP e schemas Zod
packages/database     Drizzle, PostgreSQL, migrations e seeds
content/editorial     Catálogos editoriais versionados
scripts               Normalização e mapeamento do catálogo
```

O fluxo principal é:

```text
PostgreSQL ──> API REST ──> catálogo editorial no navegador
                               │
                               └── respostas privadas somente no navegador
```

A interface nunca acessa o banco diretamente. A API fornece conteúdo
editorial, mas não recebe o exame pessoal do usuário.

## Tecnologias

- TypeScript;
- pnpm Workspaces;
- React, Vite e React Router;
- Fastify;
- PostgreSQL 18;
- Drizzle ORM;
- Zod;
- Docker Compose;
- Vitest e Testing Library.

## Requisitos locais

- Node.js 24;
- pnpm 11;
- Docker com Docker Compose.

As versões esperadas estão declaradas no `package.json` da raiz.

## Como executar localmente

Instale as dependências:

```bash
pnpm install
```

Crie o arquivo local de configuração:

```bash
cp .env.example .env
```

Suba somente o PostgreSQL e aguarde o healthcheck:

```bash
pnpm infra:up
```

Aplique as migrations e carregue o catálogo editorial rascunho:

```bash
pnpm db:migrate
pnpm db:seed
```

Inicie a API e a interface web:

```bash
pnpm dev
```

Depois, abra [http://127.0.0.1:5173](http://127.0.0.1:5173) e selecione
**Iniciar exame de consciência**.

| Serviço | Endereço local |
| --- | --- |
| Interface web | `http://127.0.0.1:5173` |
| API | `http://127.0.0.1:3000` |
| PostgreSQL | `127.0.0.1:5433` |

O `.env.example` habilita a prévia rascunho apenas para desenvolvimento por
meio de `ENABLE_DRAFT_PREVIEW=true`.

## Comandos principais

| Comando | Finalidade |
| --- | --- |
| `pnpm dev` | Executa API e web em modo de desenvolvimento |
| `pnpm web:dev` | Executa somente a interface web |
| `pnpm api:dev` | Executa somente a API |
| `pnpm check` | Verifica os tipos de todos os pacotes |
| `pnpm test` | Executa os testes automatizados |
| `pnpm build` | Gera o build de todos os pacotes e aplicações |
| `pnpm infra:up` | Inicia o PostgreSQL local |
| `pnpm infra:down` | Para o PostgreSQL e preserva seus dados |
| `pnpm db:migrate` | Aplica as migrations do Drizzle |
| `pnpm db:seed` | Valida e importa o catálogo editorial rascunho |
| `pnpm db:studio` | Abre o Drizzle Studio |

`pnpm infra:down` preserva o volume nomeado do PostgreSQL. Não execute
`docker compose down -v` a menos que queira apagar deliberadamente todo o banco
local.

## Catálogo editorial

O catálogo atual fica em:

```text
content/editorial/pt-BR/examination-catalog.v2.json
content/editorial/pt-BR/examination-catalog.v3.json
```

O comando abaixo transforma deterministicamente o catálogo v2 no v3 e adiciona
os mapeamentos estruturados das regras:

```bash
pnpm catalog:map-rules
```

O seed valida o catálogo v3 antes de gravá-lo. Uma versão rascunho de mesmo
idioma e número pode ser atualizada durante o desenvolvimento, mas o seed recusa
sobrescrever uma versão publicada.

## Endpoints atuais

```text
GET /health
GET /v1/examination-catalogs/current?locale=pt-BR
GET /v1/examination-catalogs/preview?locale=pt-BR&catalogVersion=0.4.0-draft
```

`/current` retorna somente conteúdo publicado. Como o catálogo atual ainda é
rascunho, a resposta esperada é `404 catalog_not_found`.

`/preview` existe exclusivamente para desenvolvimento. Ele exige
`ENABLE_DRAFT_PREVIEW=true`, uma versão terminada em `-draft` e não é registrado
quando `NODE_ENV=production`.

## Documentação

Antes de alterar produto, domínio, privacidade ou arquitetura, leia:

- [AGENTS.md](AGENTS.md);
- [PLANS.md](PLANS.md);
- [MVP](docs/product/mvp.md);
- [Privacidade](docs/product/privacy.md);
- [Regras do exame](docs/domain/examination-rules.md);
- [Visão geral da arquitetura](docs/architecture/overview.md);
- [Limites entre camadas](docs/architecture/boundaries.md);
- [Decisões arquiteturais](docs/architecture/decisions/).

## Verificação antes de contribuir

Execute:

```bash
pnpm check
pnpm test
pnpm build
```

Mudanças que envolvam respostas pessoais não podem introduzir envio à API,
persistência no PostgreSQL, logs ou analytics do conteúdo do exame.
