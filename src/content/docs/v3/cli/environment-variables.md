---
title: Environment variables
description: Every environment variable the nschema CLI reads as a configuration override.
slug: v3/cli/environment-variables
---

The CLI offers a small list of environment variables as configuration overrides. Environment values sit above config
blocks and below command-line flags in [precedence](/v3/cli/configuration/#precedence).

| Variable                              | Overrides                        | Notes                                                                                                               |
|---------------------------------------|----------------------------------|---------------------------------------------------------------------------------------------------------------------|
| `NSCHEMA_POSTGRES_CONNECTION_STRING`  | The Postgres connection string   | Names the Postgres provider on its own, and overwrites a `connection_string` set in a `PROVIDER postgres` block.    |
| `NSCHEMA_POSTGRES_USERNAME`           | The Postgres username            | Layered onto the connection string, overriding any user embedded in it.                                             |
| `NSCHEMA_POSTGRES_PASSWORD`           | The Postgres password            | Layered onto the connection string, overriding any password embedded in it.                                         |
| `NSCHEMA_SQLITE_CONNECTION_STRING`    | The SQLite connection string     | Names the SQLite provider on its own, and overwrites a `connection_string` set in a `PROVIDER sqlite` block.        |
| `NSCHEMA_SQLSERVER_CONNECTION_STRING` | The SQL Server connection string | Names the SQL Server provider on its own, and overwrites a `connection_string` set in a `PROVIDER sqlserver` block. |
| `NSCHEMA_SQLSERVER_USERNAME`          | The SQL Server username          | Layered onto the connection string, overriding any user embedded in it.                                             |
| `NSCHEMA_SQLSERVER_PASSWORD`          | The SQL Server password          | Layered onto the connection string, overriding any password embedded in it.                                         |
| `NSCHEMA_DESTRUCTIVE_ACTION_POLICY`   | The destructive-action policy    | `error` (default), `warn`, or `allow`. Equivalent to `--destructive-actions`.                                       |
| `NSCHEMA_ENVIRONMENT`                 | The target environment           | Selects the `*.env.<name>.sql` [overlay files](/v3/cli/configuration/#environments). Equivalent to `--environment`.    |
| `NO_COLOR`                            | Colored output                   | The well-known [`NO_COLOR`](https://no-color.org) convention; any value disables color. Equivalent to `--no-color`. |

## The connection string

The connection string is a secret. Supply it through the environment rather than committing it:

```sh
export NSCHEMA_POSTGRES_CONNECTION_STRING="Host=localhost;Database=app;Username=postgres;Password=postgres"
```

## Separate credentials

When your platform manages the database username and password apart from the rest of the connection (for example, AWS
Secrets Manager injecting them out of band), keep only the non-secret host in the connection string and supply the
credentials on their own:

```sh
export NSCHEMA_POSTGRES_CONNECTION_STRING="Host=db.internal;Port=5432;Database=app"
export NSCHEMA_POSTGRES_USERNAME="$DB_USER"
export NSCHEMA_POSTGRES_PASSWORD="$DB_PASSWORD"
```

`NSCHEMA_POSTGRES_USERNAME` / `NSCHEMA_POSTGRES_PASSWORD` (also settable as `username` / `password` in the `PROVIDER postgres` block)
override any user/password embedded in the connection string, so you don't need to recombine the pieces into a single string yourself.

The base connection string is applied first, then these discrete overrides are layered on top.

SQL Server works the same way: `NSCHEMA_SQLSERVER_USERNAME` / `NSCHEMA_SQLSERVER_PASSWORD` (or `username` / `password` in
the `PROVIDER sqlserver` block) compose onto `NSCHEMA_SQLSERVER_CONNECTION_STRING`.
