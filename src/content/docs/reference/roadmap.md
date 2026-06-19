---
title: Roadmap
description: Where NSchema is headed — planned providers, backends, and features.
---

NSchema is feature-complete for its first target — PostgreSQL, with file or S3 state — but
there's more planned. This page sketches the direction; it's not a commitment, and priorities
may shift.

:::caution[Pre-release]
NSchema has no stable release yet. Everything here, including what already works, is subject to
change before 1.0.
:::

## Available today

- **Provider:** PostgreSQL — see [PostgreSQL provider](/providers/postgres/).
- **Backends:** local file and Amazon S3 — see [Backends](/backends/).
- **Environments:** `*.env.<name>.sql` overlays selected with
  [`--environment`](/cli/configuration/#environments).

## Planned

### More database providers

The provider abstraction is built so a new database is a self-contained addition. On the list:

- **SQLite**
- **SQL Server**

Because the [DDL is dialect-agnostic](/ddl/grammar/), the goal is for the same schema files to
target a new database largely by switching the provider.

### More state backends

- **Azure Blob Storage**, alongside the existing file and S3 backends.

## Following along

NSchema is developed in the open. Track progress, file issues, or ask questions on
[GitHub](https://github.com/nschema-org/NSchema).
