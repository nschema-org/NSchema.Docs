---
title: SQLite
description: Connect NSchema to a SQLite database.
sidebar:
  order: 30
---

Declare a sqlite provider using a `PROVIDER sqlite` [config block](/cli/configuration/):

```sql
PROVIDER sqlite (
  connection_string = 'Data Source=app.db'
);
```

## Attributes

| Attribute           | Type   | Description                                                                  |
|---------------------|--------|------------------------------------------------------------------------------|
| `connection_string` | string | The connection string used to reach the database, e.g. `Data Source=app.db`. |

SQLite is file-based, so the connection string is its only setting.

## The connection string

A SQLite connection string usually points at a file (`Data Source=app.db`). Unlike a Postgres connection string it is
not a secret, so keeping it in the `PROVIDER sqlite` block is fine. You can still override it from the environment (handy
in CI) or to point at a different database file per [environment](/cli/configuration/#environments) without editing the checked-in `.sql`:

```sh
export NSCHEMA_SQLITE_CONNECTION_STRING="Data Source=/var/data/app.db"
```

`NSCHEMA_SQLITE_CONNECTION_STRING` takes precedence over a `connection_string` set in the block.

## The `main` schema

SQLite has a single primary database, surfaced as the schema **`main`**. Declare every object as `main.<name>` in your
DDL:

```sql
CREATE TABLE main.widgets (
  id   bigint NOT NULL,
  name text,
  CONSTRAINT widgets_pkey PRIMARY KEY (id)
);
```

`main` always exists, so it is never planned as a create. Schemas other than `main` (and `temp` / `ATTACH`ed databases)
are out of scope.

## What's supported

SQLite has a deliberately small surface, so this provider only allows what SQLite supports:

- **Supported:** tables, columns (including `DEFAULT` and stored generated columns), primary keys, foreign keys, unique
  constraints, check constraints, indexes, and views.
- **Native `ALTER TABLE` only.** Creating, dropping and renaming tables and columns, and creating or dropping
  indexes and views, are applied directly. Operations SQLite cannot do in place: changing a column's type, nullability,
  default or generated expression, or adding/dropping a constraint on an *existing* table would require a full
  table rebuild and raises a clear `NotSupportedException`.
- **Not supported (SQLite has no equivalent):** schemas other than `main`, sequences, enums, domains, composite types,
  stored functions/procedures, grants, materialized views, and triggers. These raise `NotSupportedException`.
- **Comments are not persisted.** SQLite has no `COMMENT ON`, so documentation comments are ignored when generating SQL.
  A desired schema that carries comments will show those comment changes as perpetually pending.

## Using the library

When [embedding the engine](/library/embedding/) instead of the CLI, register SQLite with the `NSchema.SQLite` package:

```sh
dotnet add package NSchema.Core
dotnet add package NSchema.SQLite
```

`UseSqliteSchema` wires up both the current-schema provider and the SQL generator. The two connection-aware overloads
also register the connection source the provider reads from and the data source the executor applies through:

```csharp
// 1. Connection string.
builder.UseSqliteSchema("Data Source=app.db");

// 2. Configure the SqliteConnectionStringBuilder directly.
builder.UseSqliteSchema(b => b.DataSource = "app.db");
```

If you only need DDL generation and not introspection (for example, to render the migration SQL without connecting to a
database), register just the generator with `UseSqliteGenerator()`.
