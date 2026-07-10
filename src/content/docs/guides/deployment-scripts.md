---
title: Deployment scripts
description: Run imperative SQL before or after a migration.
sidebar:
  order: 50
---

Some database configuration can't be expressed declaratively, or isn't yet supported by the engine. For this, NSchema
supports deployment scripts that run arbitrary SQL on either side of a migration.

Scripts are declared **inline** in your `.sql` files with the `SCRIPT` statement, with a dollar-quoted body:

```sql
SCRIPT 'enable_citext' RUN ON PRE DEPLOYMENT AS $$
    CREATE EXTENSION IF NOT EXISTS citext;
$$;

SCRIPT 'reindex' RUN ON POST DEPLOYMENT (run_outside_transaction = true) AS $$
    CREATE INDEX CONCURRENTLY idx_widgets_name ON app.widgets (name);
$$;
```

- `ON PRE DEPLOYMENT` scripts run **before** the computed migration;
- `ON POST DEPLOYMENT` scripts run **after** it.

The name (a single-quoted string) appears in the plan output and must be unique across the project. The body is opaque
SQL that gets passed to the target database verbatim. NSchema can't validate its syntax, so be careful here.

The `run_outside_transaction = true` option is for statements the database forbids inside a transaction
(e.g. `CREATE INDEX CONCURRENTLY`). See the [grammar reference](/ddl/grammar/#scripts) for the full syntax.

## Run conditions

The `RUN` clause says how often the script runs when its event occurs:

| Condition    | Behaviour                                 |
|--------------|-------------------------------------------|
| `RUN ALWAYS` | Runs on **every** apply (the default).    |
| `RUN ONCE`   | Runs on the next apply, then never again. |

### `RUN ALWAYS` scripts must be idempotent

:::caution
An always-run script executes on every apply. Write it with this behavior in mind:

```sql
CREATE EXTENSION IF NOT EXISTS citext;
```
:::

### `RUN ONCE` scripts are recorded

A `RUN ONCE` script is for work that... well, only needs to be run once, like seeding reference data, or bootstrapping.

```sql
SCRIPT 'seed currencies' RUN ONCE ON POST DEPLOYMENT AS $$
    INSERT INTO app.currencies (code) VALUES ('GBP'), ('USD'), ('EUR');
$$;
```

After an apply, NSchema records the script's execution (its name, and a hash of its body) in the
[state backend](/guides/state/), so later plans can skip it:

```
Run-once script 'seed currencies' has already run and is skipped.
```

Because the record lives in state, this works offline, and a plan against recorded state knows what has run without
touching the database. A few consequences to be aware of:

- **Editing an executed script doesn't re-run it.** The plan warns that the body has changed, but still skips it. To run
  the new body once, remove the script from the state, or rename it (a new name is a new identity).
- **Recording requires a state backend.** With no backend configured there is nowhere to remember executions, and the
  plan warns that run-once scripts will run on every apply.
- **A failed apply records nothing.** Whether the script ran before the failure is unknowable, so the next apply
  includes it again.

Plan output marks run-once scripts in the pre/post-deployment sections (`(run once)`; `runCondition` in `--json`).

## Scripts in templates

A [schema template](/guides/templates/) can declare deployment scripts, instantiated once per applied schema, with the
`{schema}` token substituted in the name and the SQL:

```sql
TEMPLATE currency_zone
BEGIN
    CREATE TABLE currencies ( code char(3) NOT NULL, CONSTRAINT pk_currencies PRIMARY KEY (code) );

    SCRIPT 'seed {schema} currencies' RUN ONCE ON POST DEPLOYMENT AS $$
        INSERT INTO {schema}.currencies (code) VALUES ('GBP'), ('USD'), ('EUR');
    $$;
END;

APPLY TEMPLATE currency_zone IN SCHEMA sales, billing;
```

Each instance is tracked independently, and script names must end up unique (a template applied to more than one
schema needs the `{schema}` token in the script's name).

## When to use them

Deployment scripts are intended as an escape hatch rather than a recommendation. Great power, great responsibility, etc.
If there's something you need a deployment script for, consider logging a feature request for it instead.

For transition SQL (backfills, and data fixes tied to a schema change) prefer a
[change-event script](/guides/data-migrations/) (`SCRIPT … RUN ON ADD COLUMN …`): it runs only when its matching
change is in the plan, then reports itself as safe to delete.

## The legacy form

Before NSchema 4.4, deployment scripts were declared as `PRE DEPLOYMENT 'name' AS $$…$$;` /
`POST DEPLOYMENT 'name' AS $$…$$;`. The old form still parses, but plans surface a deprecation warning naming the
`SCRIPT` replacement, and it will be removed in NSchema 5.0.
