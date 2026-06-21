---
title: SQL Server
description: Connect NSchema to a Microsoft SQL Server database.
sidebar:
  order: 25
---

Declare a sqlserver provider using a `PROVIDER sqlserver` [config block](/cli/configuration/):

```sql
PROVIDER sqlserver (
  connection_string = ''
);
```

## Requirements

The provider targets **SQL Server 2016 SP1 or newer** (including Azure SQL Database). Views and routines are replaced in
place with `CREATE OR ALTER`, which requires this baseline.

## Attributes

| Attribute           | Type   | Description                                                                                      |
|---------------------|--------|--------------------------------------------------------------------------------------------------|
| `connection_string` | string | The connection string used to reach the database. Best supplied via the environment (see below). |

## The connection string

The connection string is a secret, so you should probably supply it through an environment variable rather than committing
it, but I promise not to report you to the connection string police:

```sh
export NSCHEMA_SQLSERVER_CONNECTION_STRING="Server=localhost;Database=app;User Id=sa;Password=hunter2;TrustServerCertificate=True"
```

`NSCHEMA_SQLSERVER_CONNECTION_STRING` **takes precedence** over a `connection_string` set in the block.

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
