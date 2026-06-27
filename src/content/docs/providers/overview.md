---
title: Providers
description: The database providers NSchema supports, and how they're configured.
sidebar:
  order: 10
---

A provider is the live database NSchema reads from and writes to. It's declared in a `PROVIDER` [config block](/cli/configuration/) and 
describes where your schema lives and how to connect to it. Secrets are generally provided as environment variables as 
opposed to inline configuration.

The provider is configured separately from the optional [backend](/backends/), which persists a snapshot of the schema 
for offline planning. This section covers the live-database providers; see [Backends](/backends/) for the state backends.

Each provider ships as a **plugin**; a NuGet package named and version-pinned in its `PROVIDER` block, which `nschema`
restores on first use. The pages below cover the first-party providers; a block can also point at a third-party provider
package with a `source` attribute (see [Configuration](/cli/configuration/#plugins-and-versions)).

## Available providers

| Provider   | Page                                          |
|------------|-----------------------------------------------|
| Postgres   | [Postgres provider](/providers/postgres/)     |
| SQL Server | [SQL Server provider](/providers/sqlserver/)  |
| SQLite     | [SQLite provider](/providers/sqlite/)         |

## How a provider relates to the DDL

The [DDL you write](/ddl/defining-schemas/) is dialect-agnostic by design: canonical type names like `bigint` and 
`varchar(255)`, and `CREATE TABLE`-shaped statements that map onto NSchema's domain model. The provider is what turns 
that model into database-specific SQL on output, translating `bigint` to the dialect's spelling, rendering `DEFAULT now()`,
and introspecting the live schema back into the same model for comparison. Custom types you write (`jsonb`, a 
schema-qualified enum) pass through to the provider untouched. This is why the same schema files can, in principle, 
target a different database simply by switching the provider.
