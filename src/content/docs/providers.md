---
title: Providers
description: The database providers NSchema supports, and how they're configured.
---

A **provider** is the live database NSchema reads from and writes to. It's declared in a
`PROVIDER` [config block](/cli/configuration/) — describing *where* your schema lives, like a
Terraform backend, so it lives in config rather than CLI flags.

The provider is separate from the optional [backend](/backends/), which persists a snapshot of
the schema for offline planning. This section covers the live-database providers; see
[Backends](/backends/) for the state backends.

## Supported today

| Provider | Page |
| -------- | ---- |
| PostgreSQL | [PostgreSQL provider](/providers/postgres/) |

## On the roadmap

Additional providers (SQLite, SQL Server) are planned — see the [roadmap](/reference/roadmap/).

## How a provider relates to the DDL

The [DDL you write](/ddl/defining-schemas/) is dialect-agnostic by design: canonical type
names like `bigint` and `varchar(255)`, and `CREATE TABLE`-shaped statements that map onto
NSchema's domain model. The **provider** is what turns that model into database-specific SQL
on output — translating `bigint` to the dialect's spelling, rendering `DEFAULT now()`, and
introspecting the live schema back into the same model for comparison. Custom types you write
(`jsonb`, a schema-qualified enum) pass through to the provider untouched. This is why the
same schema files can, in principle, target a different database simply by switching the
provider.
