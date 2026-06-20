---
title: Deployment scripts
draft: true
description: Run imperative SQL before or after a migration
sidebar:
  order: 50
---

Some database configuration can't be expressed declaratively, or isn't yet supported by the engine. For this, NSchema 
supports pre-deployment and post-deployment scripts that let you run arbitrary SQL on either side of a migration.

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

The name (a single-quoted string) appears in the plan output. The body is opaque SQL, that gets passed to the target 
database verbatim. NSchema can't validate its syntax, so be careful here.

The `run_outside_transaction = true` option is for statements the database forbids inside a transaction 
(e.g. `CREATE INDEX CONCURRENTLY`). See the [grammar reference](/ddl/grammar/#deployment-scripts) for the full syntax.

## Idempotency

:::caution
NSchema is stateless with respect to the target database, so deployment scripts run on every apply. Write them with this
behavior in mind:

```sql
CREATE EXTENSION IF NOT EXISTS citext;
```
:::

## When to use them

Deployment scripts are intended as an escape hatch rather than a recommendation. Great power, great responsibility, etc.
If there's something you need a deployment script for, consider logging a feature request for it instead. :thumbs_up: