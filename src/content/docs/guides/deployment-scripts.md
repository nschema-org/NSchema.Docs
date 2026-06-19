---
title: Deployment scripts
description: Run raw, imperative SQL before or after a migration — for the things declarative DDL can't express.
---

Some setup can't be expressed declaratively — creating an extension, a role, a custom grant, or
backfilling data. For these, NSchema has **deployment scripts**: raw SQL that runs before or
after the computed migration.

## With the CLI: `.pre.sql` / `.post.sql` files

With the [CLI](/cli/), deployment scripts are raw SQL files distinguished by suffix:

- `*.pre.sql` files run (in filename order) **before** the migration;
- `*.post.sql` files run (in filename order) **after** it.

They can live anywhere under the project, alongside your schema files — the suffix is what
marks them. They're **excluded** from the desired schema (never parsed as NSchema DDL).
[`plan`](/cli/commands/plan/) previews them and [`apply`](/cli/commands/apply/) runs them. Use a
numeric prefix to order them:

```sql
-- 001_extensions.pre.sql
CREATE EXTENSION IF NOT EXISTS citext;
```

```sql
-- 010_backfill.post.sql
UPDATE app.users SET status = 'active' WHERE status IS NULL;
```

## With the library: inline `PRE/POST DEPLOYMENT`

When [embedding the engine](/library/embedding/), deployment scripts are declared **inline** in
the `.sql` files instead, with a dollar-quoted body:

```sql
PRE DEPLOYMENT 'enable_citext' AS $$
    CREATE EXTENSION IF NOT EXISTS citext;
$$;

POST DEPLOYMENT 'reindex' (run_outside_transaction = true) AS $$
    CREATE INDEX CONCURRENTLY idx_widgets_name ON app.widgets (name);
$$;
```

The `run_outside_transaction = true` option is for statements the database forbids inside a
transaction (e.g. `CREATE INDEX CONCURRENTLY`). See the
[grammar reference](/ddl/grammar/#deployment-scripts) for the full syntax.

## They must be idempotent

:::caution
Deployment scripts run on **every** apply — they are not one-time, versioned migrations. Write
them so re-running is safe:

```sql
CREATE EXTENSION IF NOT EXISTS citext;
```
:::

## When to use them

Reach for a deployment script only for what NSchema's declarative model doesn't cover:
extensions, roles, data backfills, concurrent index builds, and similar imperative steps.
Everything NSchema *does* model — tables, columns, constraints, indexes, views, and so on —
belongs in the [declarative schema](/ddl/defining-schemas/), so the planner can diff it.
