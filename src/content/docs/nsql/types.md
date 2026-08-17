---
title: Type reference
description: The canonical, dialect-agnostic column types NSQL accepts.
---

Column types in NSQL are dialect-agnostic. You write the canonical type; the provider maps it to the target 
database's spelling on output. Anything NSchema doesn't recognize is passed through verbatim as a custom type, so 
database-specific types still work.

## Canonical types

Parameterless types are just their name; sized and precision types include their arguments.

| String                                                       | Maps to                                                     |
|--------------------------------------------------------------|-------------------------------------------------------------|
| `boolean`, `tinyint`, `smallint`, `int`, `bigint`            | `SqlType.Boolean` … `SqlType.BigInt`                        |
| `float`, `double`                                            | `SqlType.Float`, `SqlType.Double`                           |
| `text`, `date`, `time`, `datetime`, `datetimeoffset`, `guid` | `SqlType.Text` … `SqlType.Guid`                             |
| `decimal(18,2)`                                              | `SqlType.Decimal(18, 2)`                                    |
| `char(8)`, `nchar(4)`, `binary(16)`                          | `SqlType.Char(8)`, `SqlType.NChar(4)`, `SqlType.Binary(16)` |
| `varchar`, `varchar(255)`                                    | `SqlType.VarChar()`, `SqlType.VarChar(255)`                 |
| `nvarchar`, `nvarchar(64)`                                   | `SqlType.NVarChar()`, `SqlType.NVarChar(64)`                |
| `varbinary`, `varbinary(32)`                                 | `SqlType.VarBinary()`, `SqlType.VarBinary(32)`              |
| any other value, e.g. `jsonb`                                | `SqlType.Custom("jsonb")`                                   |

Any string that isn't a recognized built-in type becomes a **custom type**, which is how you target database-specific 
types like `jsonb` or a schema-qualified enum (`app.status`).

## SQL spelling aliases

Common SQL spellings normalize to the canonical name, so a SQL-flavored schema round-trips cleanly against database 
introspection:

| You write                         | Normalizes to               |
|-----------------------------------|-----------------------------|
| `integer`                         | `int`                       |
| `bool`                            | `boolean`                   |
| `real`                            | `float`                     |
| `numeric(p,s)`                    | `decimal(p,s)`              |
| `timestamp`                       | `datetime`                  |
| `timestamptz`                     | `datetimeoffset`            |
| `uuid`                            | `guid`                      |
| `bytea`                           | `varbinary`                 |
| `int2`, `int4`, `int8` (Postgres) | `smallint`, `int`, `bigint` |
| `float4`, `float8` (Postgres)     | `float`, `double`           |

## Using enums, domains, and composite types as column types

Types you declare with `CREATE ENUM`, `CREATE DOMAIN`, or `CREATE TYPE` are used by naming them as a column's type, 
schema-qualified:

```nsql
CREATE ENUM app.order_status ('pending', 'shipped', 'delivered');

CREATE TABLE app.orders (
  id     bigint NOT NULL,
  status app.order_status NOT NULL DEFAULT ('pending'),
  CONSTRAINT orders_pkey PRIMARY KEY (id)
);
```

See the [grammar reference](/nsql/grammar/#enums) for declaring these types.

## Typed `xml` columns

An `xml` column may name an [XML schema collection](/nsql/grammar/#xml-schema-collections) to validate against, saying
whether it holds a whole `DOCUMENT` or any `CONTENT` fragment:

```nsql
CREATE TABLE app.responses (
  survey xml(DOCUMENT app.survey_schema) NULL,
  notes  xml NULL
);
```

A bare `xml` is untyped and binds to nothing. The binding is carried structurally rather than folded into the type name,
so the collection is a real dependency: it is created before, and dropped after, the columns that use it.
