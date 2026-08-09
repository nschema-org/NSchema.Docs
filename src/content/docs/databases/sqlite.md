---
title: SQLite
description: Connect NSchema to a SQLite database.
sidebar:
  order: 30
---

Declare the plugin, then point a `DATABASE` [statement](/cli/configuration/) at it:

```sql
PLUGIN sqlite (
  source  = 'NSchema.Sqlite',
  version = '[5.0,6.0)'
);

DATABASE sqlite (
  connection_string = 'Data Source=app.db'
);
```

The label (`sqlite` here) is yours to choose; the `DATABASE` statement selects the plugin by referencing it. The package
is resolved and locked by [`init`](/cli/commands/init/) and restored on first use — for CLI use you don't install it by hand.

## Attributes

| Attribute           | Type   | Description                                                                         |
|---------------------|--------|-------------------------------------------------------------------------------------|
| `connection_string` | string | The connection string used to reach the database, e.g. `Data Source=app.db`.        |

SQLite is file-based, so the connection string is its only setting.

## The connection string

A SQLite connection string usually points at a file (`Data Source=app.db`). Unlike a Postgres connection string it is
not a secret, so keeping it in the `DATABASE sqlite` statement is fine. You can still override it from the environment (handy
in CI) or to point at a different database file per [environment](/cli/configuration/#environments) without editing the checked-in `.sql`:

```sh
export NSCHEMA_DATABASE_CONNECTION_STRING="Data Source=/var/data/app.db"
```

`NSCHEMA_DATABASE_CONNECTION_STRING` takes precedence over a `connection_string` set in the statement.

## The `main` schema

SQLite has a single primary database, surfaced as the schema **`main`**. Declare every object as `main.<name>`:

```sql
CREATE TABLE main.widgets (
  id   bigint NOT NULL,
  name text,
  CONSTRAINT widgets_pkey PRIMARY KEY (id)
);
```

`main` always exists, so the provider never creates or drops it: a [`destroy`](/cli/commands/destroy/) removes the
tables and leaves `main` in place. Schemas other than `main` (and `temp` / `ATTACH`ed databases) are out of scope.

## What's supported

SQLite has a deliberately small surface, so this provider only allows what SQLite supports:

- **Supported:** tables, columns (including `DEFAULT` and stored generated columns), primary keys, foreign keys, unique
  constraints, check constraints, indexes, views, and triggers.
- **Native `ALTER TABLE` only.** Creating, dropping and renaming tables and columns, and creating or dropping
  indexes and views, are applied directly. Operations SQLite cannot do in place — changing a column's type, nullability,
  default or generated expression, or adding/dropping a constraint on an *existing* table — would require a full
  table rebuild, and are reported as **error diagnostics on the plan**.
- **Triggers** carry an inline body, written as `CREATE TRIGGER … ON main.t AS $$ BEGIN … END $$` (see the [grammar](/nsql/grammar/#triggers)) 
  and fire `BEFORE` or `AFTER` a single event. SQLite's limits are errors too: one event per trigger (no 
  `INSERT OR UPDATE`), no `TRUNCATE`, and no `INSTEAD OF`.
- **Not supported (SQLite has no equivalent):** schemas other than `main`, sequences, enums, domains, composite types,
  stored functions/procedures, grants, and materialized views.
- **Clustering is skipped with a warning.** SQLite has no clustered indexes.
- **Comments are skipped with a warning.** SQLite has no `COMMENT ON`, so a declared comment emits no SQL and carries a
  warning explaining that the change can never converge.

Nothing here throws: an unsupported action is an error diagnostic on the plan, so you always get the complete plan and
can see every step it would have taken.
