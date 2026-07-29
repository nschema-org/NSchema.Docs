---
title: Postgres
description: Connect NSchema to a PostgreSQL database.
sidebar:
  order: 20
---

Declare the plugin, then point a `DATABASE` [statement](/cli/configuration/) at it:

```sql
PLUGIN postgres (
  source  = 'NSchema.Postgres',
  version = '[5.0,6.0)'
);

DATABASE postgres (
  connection_string = '',
  command_timeout = 30
);
```

The label (`postgres` here) is yours to choose; the `DATABASE` statement selects the plugin by referencing it. The package
is resolved and locked by [`init`](/cli/commands/init/) and restored on first use — for CLI use you don't install it by hand.

## Attributes

| Attribute           | Type    | Description                                                                                          |
|---------------------|---------|------------------------------------------------------------------------------------------------------|
| `connection_string` | string  | The connection string used to reach the database. Best supplied via the environment (see below).     |
| `username`          | string  | The username, supplied separately from the connection string. Overrides any user embedded in it.     |
| `password`          | string  | The password, supplied separately from the connection string. Overrides any password embedded in it. |
| `command_timeout`   | integer | The command timeout, in seconds.                                                                     |

## The connection string

The connection string is a secret. Supply it through an environment variable rather than committing it:

```sh
export NSCHEMA_DATABASE_CONNECTION_STRING="Host=localhost;Database=app;Username=postgres;Password=postgres"
```

`NSCHEMA_DATABASE_CONNECTION_STRING` **takes precedence** over a `connection_string` set in the statement. A
`connection_string` in the statement is fine for a local database, but keep real secrets in the environment.

## Credentials supplied separately

When a secret store (e.g. AWS Secrets Manager) injects the database username and password out of band, keep only the 
non-secret host/port/database in the connection string and supply the credentials on their own:

```sh
export NSCHEMA_DATABASE_CONNECTION_STRING="Host=db.internal;Port=5432;Database=app"
export NSCHEMA_DATABASE_USERNAME="$DB_USER"
export NSCHEMA_DATABASE_PASSWORD="$DB_PASSWORD"
```

These override any user/password embedded in the connection string. The base connection string is applied first, then the
discrete overrides are layered on top. See [Environment variables](/cli/environment-variables/#separate-credentials).

## Dialect and equivalence

The SQL dialect is determined by the provider, so there is nothing to configure. NSchema's canonical [types](/nsql/types/) are
translated to PostgreSQL's spelling on output, and any opaque expressions in `DEFAULT` / `CHECK` / etc. are passed through verbatim.

The provider also registers **equivalence rules** for comparison, so spellings the catalog and your project may
legitimately disagree on (`bool` against `boolean`, a default the server has rewritten with a cast) compare equal in
either direction and don't show up as drift.
