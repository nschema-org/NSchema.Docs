---
title: What is NSchema?
description: NSchema is a declarative database schema migration tool — you describe the schema you want, and it computes and applies the migration to get there.
sidebar:
  order: 1
---

NSchema is a **declarative database schema migration tool**. You describe the schema you
want — in a familiar, SQL-flavoured DDL — and NSchema compares it against the live database,
computes the difference, and applies the changes needed to get there. Think of it as
*Terraform for your database schema*.

## Declarative, not imperative

Most migration tools are imperative: you hand-write an ordered sequence of `ALTER` steps,
one file per change, and the tool replays them. NSchema works the other way around. You
maintain a single, declarative description of the schema's **desired state** — the final
shape you want — and the planner derives the steps to reach it:

```sql
CREATE SCHEMA app;

CREATE TABLE app.widgets (
  id   bigint NOT NULL,
  name text,
  CONSTRAINT widgets_pkey PRIMARY KEY (id)
);
```

There is no `ALTER`. You add a column to the table above, run `nschema plan`, and NSchema
works out that it needs to add exactly that column. This is the same model Terraform uses
for infrastructure: describe the goal, let the tool find the path.

## How it works

A run flows through a simple pipeline:

1. **Read the desired schema** — every `*.sql` file under your project directory.
2. **Read the current schema** — from the live database, or from a persisted state snapshot
   for offline planning.
3. **Diff** the two to produce a structured migration plan.
4. **Validate** the plan against policies (for example, the built-in guard against
   destructive changes).
5. **Render** the plan for review — and, on `apply`, execute it.

Because the plan is computed and rendered before anything is executed, you always see the
exact changes first. You can even [save a plan to a file](/cli/commands/plan/) and apply
that precise file later, so what was reviewed is what runs.

## What it manages

NSchema models the structures of a relational database: schemas, tables, columns, primary
and foreign keys, unique/check/exclusion constraints, indexes, views (including
materialized), enums, domains, composite types, sequences, functions and procedures,
triggers, extensions, and grants. For anything that can't be expressed declaratively —
backfills, custom grants, `CREATE INDEX CONCURRENTLY` — there are
[deployment scripts](/guides/deployment-scripts/): raw SQL that runs before or after the
migration.

## CLI or library

There are two ways to use NSchema:

- **The `nschema` CLI** — a global .NET tool that resolves configuration from your project
  and runs one operation. This is what most people want, and what the bulk of these docs
  cover. Start with [Installation](/start/installation/) and the
  [Quickstart](/start/quickstart/).
- **The `NSchema.Core` library** — the engine the CLI is built on, embeddable directly in
  a .NET application when you need to build your own harness. See
  [Embedding the engine](/library/embedding/).

## Where things stand

NSchema currently targets **PostgreSQL**, with state stored in a **local file** or **Amazon
S3**. Other providers (SQLite, SQL Server) and backends (Azure Blob Storage) are on the
[roadmap](/reference/roadmap/).

:::caution[Pre-release]
NSchema is still very new. It's not production-ready yet — follow along and experiment, but
don't point it at a database you can't afford to lose.
:::
