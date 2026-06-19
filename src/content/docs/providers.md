---
title: Providers & Backends
description: The database providers and state backends NSchema supports, and how they're configured.
---

NSchema separates two concerns, each declared in a [config block](/cli/configuration/):

- **Provider** — the *live database* NSchema reads from and writes to. Declared in a
  `PROVIDER` block.
- **Backend** — the optional *state store* that persists a snapshot of the last applied
  schema, enabling [offline planning](/guides/state/) and [drift detection](/guides/drift/).
  Declared in a `BACKEND` block.

Both describe *where* your schema lives — like a Terraform backend — so they live in config
blocks rather than CLI flags.

## Supported today

| Kind | Option | Page |
| ---- | ------ | ---- |
| Provider | PostgreSQL | [PostgreSQL provider](/providers/postgres/) |
| Backend | Local file | [State backends](/providers/backends/#local-file) |
| Backend | Amazon S3 | [State backends](/providers/backends/#amazon-s3) |

## On the roadmap

Additional providers (SQLite, SQL Server) and backends (Azure Blob Storage) are planned — see
the [roadmap](/reference/roadmap/).

## How a provider relates to the DDL

The [DDL you write](/ddl/defining-schemas/) is dialect-agnostic by design: canonical type
names like `bigint` and `varchar(255)`, and `CREATE TABLE`-shaped statements that map onto
NSchema's domain model. The **provider** is what turns that model into database-specific SQL
on output — translating `bigint` to the dialect's spelling, rendering `DEFAULT now()`, and
introspecting the live schema back into the same model for comparison. Custom types you write
(`jsonb`, a schema-qualified enum) pass through to the provider untouched. This is why the
same schema files can, in principle, target a different database simply by switching the
provider.
