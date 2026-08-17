---
title: SQL Server
description: Connect NSchema to a Microsoft SQL Server database.
sidebar:
  order: 25
---

Declare the plugin, then point a `DATABASE` [statement](/cli/configuration/) at it:

```nsql
PLUGIN sqlserver (
  source  = 'NSchema.SqlServer',
  version = '[5.0,6.0)'
);

DATABASE sqlserver (
  connection_string = '',
  command_timeout = 30
);
```

The label (`sqlserver` here) is yours to choose; the `DATABASE` statement selects the plugin by referencing it. The
package is resolved and locked by [`init`](/cli/commands/init/) and restored on first use — for CLI use you don't install it by hand.

## Requirements

The provider targets **SQL Server 2016 SP1 or newer** (including Azure SQL Database). Views and routines are replaced in
place with `CREATE OR ALTER`, which requires this baseline.

## Attributes

| Attribute           | Type    | Description                                                                                          |
|---------------------|---------|------------------------------------------------------------------------------------------------------|
| `connection_string` | string  | The connection string used to reach the database. Best supplied via the environment (see below).     |
| `username`          | string  | The username, supplied separately from the connection string. Overrides any user embedded in it.     |
| `password`          | string  | The password, supplied separately from the connection string. Overrides any password embedded in it. |
| `command_timeout`   | integer | The command timeout, in seconds.                                                                     |

## The connection string

The connection string is a secret, so you should probably supply it through an environment variable rather than committing
it, but I promise not to report you to the connection string police:

```sh
export NSCHEMA_DATABASE_CONNECTION_STRING="Server=localhost;Database=app;User Id=sa;Password=hunter2;TrustServerCertificate=True"
```

`NSCHEMA_DATABASE_CONNECTION_STRING` **takes precedence** over a `connection_string` set in the statement.

## Credentials supplied separately

When a secret store (e.g. AWS Secrets Manager) injects the database username and password out of band, keep only the
non-secret host/database in the connection string and supply the credentials on their own:

```sh
export NSCHEMA_DATABASE_CONNECTION_STRING="Server=db.internal;Database=app;TrustServerCertificate=True"
export NSCHEMA_DATABASE_USERNAME="$DB_USER"
export NSCHEMA_DATABASE_PASSWORD="$DB_PASSWORD"
```

These (also settable as `username` / `password` in the statement) override any user/password embedded in the connection
string. The base connection string is applied first, then the discrete overrides are layered on top. See
[Environment variables](/cli/environment-variables).

## Identifiers and dialect

Identifiers are emitted bracket-quoted (`[schema].[name]`), so reserved words and unusual names are always safe. NSQL
accepts brackets on input too, as an alternative spelling of a [quoted identifier](/nsql/grammar/#identifiers).

## What's supported

SQL Server is a full server database, so this provider covers most of NSchema's model:

- **Supported:** schemas, tables, columns (with `DEFAULT`, `IDENTITY`, and persisted computed columns), primary keys,
  foreign keys, unique constraints, check constraints, indexes (including `INCLUDE` columns, filtered indexes,
  [clustering](/nsql/grammar/#clustering) and [XML indexes](/nsql/grammar/#xml-indexes)), views (including schema-bound
  and indexed views), [XML schema collections](/nsql/grammar/#xml-schema-collections) and typed `xml` columns,
  sequences, scalar/table functions and stored procedures, table-level `GRANT`s, triggers, and documentation comments
  (stored as `MS_Description` extended properties).
- **Not supported:** schema renames, materialized views, exclusion constraints, in-place identity/computed-column
  changes, and `BEFORE` / row-level / `WHEN` / function-style triggers. Each is reported as an **error diagnostic on the
  plan** — the plan still renders in full, so you can see everything else it would do.
