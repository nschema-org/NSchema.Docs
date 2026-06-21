---
title: SQL Server
description: Connect NSchema to a Microsoft SQL Server database.
sidebar:
  order: 25
---

Declare a sqlserver provider using a `PROVIDER sqlserver` [config block](/cli/configuration/):

```sql
PROVIDER sqlserver (
  connection_string = '',
  command_timeout = 30
);
```

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
export NSCHEMA_SQLSERVER_CONNECTION_STRING="Server=localhost;Database=app;User Id=sa;Password=hunter2;TrustServerCertificate=True"
```

`NSCHEMA_SQLSERVER_CONNECTION_STRING` **takes precedence** over a `connection_string` set in the block.

## Credentials supplied separately

When a secret store (e.g. AWS Secrets Manager) injects the database username and password out of band, keep only the
non-secret host/database in the connection string and supply the credentials on their own:

```sh
export NSCHEMA_SQLSERVER_CONNECTION_STRING="Server=db.internal;Database=app;TrustServerCertificate=True"
export NSCHEMA_SQLSERVER_USERNAME="$DB_USER"
export NSCHEMA_SQLSERVER_PASSWORD="$DB_PASSWORD"
```

These (also settable as `username` / `password` in the block) override any user/password embedded in the connection
string. The base connection string is applied first, then the discrete overrides are layered on top. See
[Environment variables](/cli/environment-variables/#separate-credentials).

## Identifiers and dialect

Identifiers are emitted bracket-quoted (`[schema].[name]`), so reserved words and unusual names are always safe.

## What's supported

SQL Server is a full server database, so this provider covers most of NSchema's model:

- **Supported:** schemas, tables, columns (with `DEFAULT`, `IDENTITY`, and persisted computed columns), primary keys,
  foreign keys, unique constraints, check constraints, indexes (including `INCLUDE` columns and filtered indexes), views,
  sequences, scalar/table functions and stored procedures, table-level `GRANT`s, triggers, and documentation comments
  (stored as `MS_Description` extended properties).

## Using the library

When [embedding the engine](/library/embedding/) instead of the CLI, register SQL Server with the `NSchema.SqlServer`
package:

```sh
dotnet add package NSchema.Core
dotnet add package NSchema.SqlServer
```

`UseSqlServerSchema` wires up both the current-schema provider and the SQL generator. The two connection-aware overloads
also register the connection source the provider reads from and the data source the executor applies through:

```csharp
// 1. Connection string.
builder.UseSqlServerSchema("Server=localhost;Database=app;User Id=sa;Password=…;TrustServerCertificate=True");

// 2. Configure the SqlConnectionStringBuilder directly.
builder.UseSqlServerSchema(b =>
{
    b.DataSource = "localhost";
    b.InitialCatalog = "app";
    b.IntegratedSecurity = true;
    b.TrustServerCertificate = true;
});
```

If you only need DDL generation and not introspection (for example, to render the migration SQL without connecting to a
database), register just the generator with `UseSqlServerGenerator()`.

### SQL Server-specific types

`SqlTypeSqlServerExtensions` adds SQL Server-only members to `SqlType` for code-built schemas:

| Member               | SQL Server type | Notes                                                  |
|----------------------|-----------------|--------------------------------------------------------|
| `SqlType.Money`      | `money`         | Fixed-point currency value.                            |
| `SqlType.Xml`        | `xml`           | XML documents and fragments.                           |
| `SqlType.RowVersion` | `rowversion`    | Automatically maintained row-version stamp.            |

In [DDL](/ddl/types/) you write these as ordinary type names (`money`, `xml`, `rowversion`); unrecognized names pass through as 
custom types.
