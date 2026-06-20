---
title: PostgreSQL provider
draft: true
description: Configure the PostgreSQL provider — the live database NSchema reads from and writes to.
sidebar:
  order: 20
---

PostgreSQL is the provider NSchema supports today. Declare it with a `PROVIDER postgres`
[config block](/cli/configuration/):

```sql
PROVIDER postgres (
  connection_string = '',
  command_timeout = 30
);
```

The `postgres` label names the provider on its own — there's no separate provider selector.

## Attributes

| Attribute           | Type    | Description                                                                                             |
|---------------------|---------|---------------------------------------------------------------------------------------------------------|
| `connection_string` | string  | The Npgsql connection string used to reach the database. Best supplied via the environment (see below). |
| `username`          | string  | The username, supplied separately from the connection string. Overrides any user embedded in it.        |
| `password`          | string  | The password, supplied separately from the connection string. Overrides any password embedded in it.    |
| `command_timeout`   | integer | The command timeout, in seconds. When omitted, Npgsql's default is used.                                |

Any attribute not listed here is rejected — a typo surfaces as an error rather than being
silently ignored.

## The connection string

The connection string is a secret. Supply it through the environment rather than committing
it:

```sh
export NSCHEMA_POSTGRES_CONNECTION_STRING="Host=localhost;Database=app;Username=postgres;Password=postgres"
```

`NSCHEMA_POSTGRES_CONNECTION_STRING` **takes precedence** over a `connection_string` set in
the block. A `connection_string` in the block is fine for a local throwaway database, but
keep real secrets in the environment.

## Credentials supplied separately

When a secret store (e.g. AWS Secrets Manager) injects the database username and password out
of band, keep only the non-secret host/port/database in the connection string and supply the
credentials on their own:

```sh
export NSCHEMA_POSTGRES_CONNECTION_STRING="Host=db.internal;Port=5432;Database=app"
export NSCHEMA_POSTGRES_USERNAME="$DB_USER"
export NSCHEMA_POSTGRES_PASSWORD="$DB_PASSWORD"
```

These (also settable as `username` / `password` block attributes) override any user/password
embedded in the connection string. The base connection string is applied first, then the
discrete overrides are layered on top — see
[Environment variables](/cli/environment-variables/#credentials-separately).

## Dialect

The SQL dialect is determined by the provider, so there is nothing to configure. NSchema's
canonical [DDL types](/ddl/types/) are translated to PostgreSQL's spelling on output, and
expressions in `DEFAULT` / `CHECK` / index `WHERE` are passed through verbatim.

## Using the library

When [embedding the engine](/library/embedding/) instead of the CLI, register Postgres with the
`NSchema.Postgres` package:

```sh
dotnet add package NSchema.Core
dotnet add package NSchema.Postgres
```

`UseCurrentSchemaPostgres` has four overloads. The three connection-aware overloads register an
`NpgsqlDataSource` for you (via `AddNpgsqlDataSource`) and wire up both the current-schema
provider and the SQL generator; the no-arg overload assumes you've already registered an
`NpgsqlDataSource`:

```csharp
// 1. Connection string.
builder.UseCurrentSchemaPostgres("Host=localhost;Database=app;Username=postgres;Password=postgres");

// 2. Configure the NpgsqlDataSourceBuilder directly.
builder.UseCurrentSchemaPostgres(b => b.EnableDynamicJson());

// 3. As above, with access to the IServiceProvider.
builder.UseCurrentSchemaPostgres((sp, b) => b.UseLoggerFactory(sp.GetRequiredService<ILoggerFactory>()));

// 4. Bring your own data source (register it yourself first).
builder.Services.AddNpgsqlDataSource(connectionString);
builder.UseCurrentSchemaPostgres();
```

### Postgres-specific types

`SqlTypePostgresExtensions` adds Postgres-only members to `SqlType` for code-built schemas:

| Member           | Postgres type | Notes                                                   |
|------------------|---------------|---------------------------------------------------------|
| `SqlType.Citext` | `citext`      | Case-insensitive text. Requires the `citext` extension. |
| `SqlType.Jsonb`  | `jsonb`       | Binary JSON.                                            |

In [DDL](/ddl/types/) you write these as ordinary type names (`citext`, `jsonb`); unrecognised
names pass through as custom types. `citext` requires the extension to exist in the target
database — NSchema does not create it for you, so add a
[deployment script](/guides/deployment-scripts/) (`CREATE EXTENSION IF NOT EXISTS citext;`).
