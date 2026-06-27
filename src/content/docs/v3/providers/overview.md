---
title: Providers
description: The database providers NSchema supports, and how they're configured.
sidebar:
  order: 10
slug: v3/providers
---

A provider is the live database NSchema reads from and writes to. It's declared in a `PROVIDER` [config block](/v3/cli/configuration/) and
describes where your schema lives and how to connect to it. Secrets are generally provided as environment variables as
opposed to inline configuration.

The provider is configured separately from the optional [backend](/v3/backends/), which persists a snapshot of the schema
for offline planning. This section covers the live-database providers; see [Backends](/v3/backends/) for the state backends.

## Available providers

| Provider   | Page                                          |
|------------|-----------------------------------------------|
| Postgres   | [Postgres provider](/v3/providers/postgres/)     |
| SQL Server | [SQL Server provider](/v3/providers/sqlserver/)  |
| SQLite     | [SQLite provider](/v3/providers/sqlite/)         |

## How a provider relates to the DDL

The [DDL you write](/v3/ddl/defining-schemas/) is dialect-agnostic by design: canonical type names like `bigint` and
`varchar(255)`, and `CREATE TABLE`-shaped statements that map onto NSchema's domain model. The provider is what turns
that model into database-specific SQL on output, translating `bigint` to the dialect's spelling, rendering `DEFAULT now()`,
and introspecting the live schema back into the same model for comparison. Custom types you write (`jsonb`, a
schema-qualified enum) pass through to the provider untouched. This is why the same schema files can, in principle,
target a different database simply by switching the provider.
