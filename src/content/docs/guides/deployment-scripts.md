---
title: Deployment scripts
draft: true
description: Run raw, imperative SQL before or after a migration — for the things declarative DDL can't express.
---

Some setup can't be expressed declaratively — creating an extension, a role, a custom grant, or
backfilling data. For these, NSchema has **deployment scripts**: raw SQL that runs before or
after the computed migration.

## Declaring them inline: `PRE/POST DEPLOYMENT`

Deployment scripts are declared **inline** in your `.sql` files, with a dollar-quoted body:

```sql
PRE DEPLOYMENT 'enable_citext' AS $$
    CREATE EXTENSION IF NOT EXISTS citext;
$$;

POST DEPLOYMENT 'reindex' (run_outside_transaction = true) AS $$
    CREATE INDEX CONCURRENTLY idx_widgets_name ON app.widgets (name);
$$;
```

- `PRE DEPLOYMENT` blocks run **before** the computed migration;
- `POST DEPLOYMENT` blocks run **after** it.

The name (a single-quoted string) appears in plan output and logs. The body is opaque SQL —
NSchema runs it verbatim rather than parsing it as declarative schema. They sit right alongside
your table and view declarations in the same files; [`plan`](/cli/commands/plan/) previews them
and [`apply`](/cli/commands/apply/) runs them.

The `run_outside_transaction = true` option is for statements the database forbids inside a
transaction (e.g. `CREATE INDEX CONCURRENTLY`). See the
[grammar reference](/ddl/grammar/#deployment-scripts) for the full syntax.

This is the same whether you drive NSchema through the [CLI](/cli/) or by
[embedding the engine](/library/embedding/) — scripts live in the DDL either way.

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
