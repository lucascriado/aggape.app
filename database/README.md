# Banco de dados PostgreSQL

As migrations desta pasta preparam o banco da aplicacao. Elas usam SQL
PostgreSQL e continuam sendo a fonte de verdade do schema.

## Estrutura

- `migrations/001_initial_schema.sql`: tabelas, constraints, indices e triggers.
- `migrations/002_directory_views.sql`: views para as telas.
- `migrations/003_seed_mock_data.sql`: ministerios e registros iniciais.
- `migrations/004_add_member_cell.sql`: adiciona celulas aos membros.
- `migrations/005_seed_500_people.sql`: completa a base inicial.
- `migrations/006_repair_seed_utf8.sql`: corrige acentos dos seeds.
- `migrations/007_reduce_seed_records.sql`: reduz para 98 membros e 36 visitantes.
- `migrations/008_activities_events_dashboard.sql`: cria atividades e eventos.
- `migrations/009_add_recent_activity.sql`: adiciona atividade recente.

## Executar

Defina `DATABASE_URL` e execute:

```powershell
.\database\migrate.ps1
```

O executor mantem a tabela `schema_migrations` e ignora arquivos ja aplicados.
O usuario precisa ter permissao para habilitar `pgcrypto`.

## Backend Node e Sequelize

As rotas em `app/api` usam Sequelize v6 sobre o driver `pg`. A instancia
compartilhada e o pool ficam em `lib/db.ts`; os Models ficam em `lib/models.ts`.
O CRUD de membros e visitantes usa Models e transacoes Sequelize.

Consultas agregadas e views continuam usando SQL explicito por clareza. Nao use
`sequelize.sync()`: mudancas de schema devem ser feitas com uma nova migration
SQL em `database/migrations/`.

Na VPS:

```env
DATABASE_URL=postgresql://usuario:senha@127.0.0.1:5432/sibmirassol
```

Em desenvolvimento local, mantenha PostgreSQL fechado para a internet e use um
tunel SSH:

```powershell
ssh -N -L 15432:127.0.0.1:5432 root@servidor
```

Depois aponte `DATABASE_URL` para `127.0.0.1:15432`.

## Valores persistidos

| Banco | Interface |
| --- | --- |
| `active` / `inactive` | Ativo / Inativo |
| `baptized` / `waiting` | Batizado / Aguardando |
| `waiting_contact` | Aguardando Contato |
| `following_up` | Em Acompanhamento |
| `integrated` | Integrado |
