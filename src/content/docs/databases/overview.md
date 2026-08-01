---
title: Databases
description: The database providers NSchema supports, and how they're configured.
slug: databases
sidebar:
  order: 10
---

NSchema uses Database plugins as an interop between your project and your live database. They're declared with a `DATABASE`
[statement](/cli/configuration/) and describe how to connect to your database and what plugin to use. Secrets are generally
provided as environment variables as opposed to inline configuration.

The database is configured separately from the [state store](/state/), which holds the snapshot every plan is
computed against. This section covers the live-database providers; see [State](/state/) for the state stores.

Each provider ships as a **plugin**: a NuGet package declared by a `PLUGIN` statement and referenced by label from the
`DATABASE` statement, which `nschema` restores on first use:

```sql
PLUGIN postgres (
  source  = 'NSchema.Postgres',
  version = '[5.0,6.0)'
);

DATABASE postgres (
  connection_string = ''
);
```

The pages below cover the first-party providers; a `PLUGIN` statement can point at any package, so a third-party provider
is declared exactly the same way (see [Configuration](/cli/configuration/#plugins)).

## Available providers

| Provider   | Package             | Page                                         |
|------------|---------------------|----------------------------------------------|
| Postgres   | `NSchema.Postgres`  | [Postgres provider](/databases/postgres/)    |
| SQL Server | `NSchema.SqlServer` | [SQL Server provider](/databases/sqlserver/) |
| SQLite     | `NSchema.Sqlite`    | [SQLite provider](/databases/sqlite/)        |

## How a provider relates to NSQL

The [schema you write](/nsql/defining-schemas/) is dialect-agnostic by design: canonical type names like `bigint` and 
`varchar(255)`, and `CREATE TABLE`-shaped statements that map onto NSchema's domain model. The provider is what turns 
that model into database-specific SQL, translating `bigint` to the dialect's spelling, rendering `DEFAULT now()`,
and introspecting the live schema back into the same model for comparison. Custom types you write (`jsonb`, a 
schema-qualified enum) pass through to the provider untouched. This is why the same schema files can, in principle, 
target a different database simply by switching the provider.
