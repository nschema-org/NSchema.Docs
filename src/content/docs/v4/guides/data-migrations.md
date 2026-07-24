---
title: Data migrations
description: Attach raw-SQL migration steps to structural changes, so they run exactly once.
sidebar:
  order: 55
slug: v4/guides/data-migrations
---

NSchema's core engine helps guide the transition of a database to a desired schema, but some transitions require a migration
script, whether it's a backfill, a data fix, or a de-duplication, that runs exactly once, when the change is applied.
A [`SCRIPT`](/v4/guides/deployment-scripts/) declared `ON` a structural change attaches that SQL to the change itself:

```sql
CREATE TABLE app.users (
    id int NOT NULL,
    email varchar(320) NOT NULL,
    CONSTRAINT pk_users PRIMARY KEY (id)
);

SCRIPT 'backfill emails' RUN ON ADD COLUMN app.users.email AS $$
    UPDATE app.users SET email = username || '@legacy.example' WHERE email IS NULL;
$$;
```

If the plan adds `app.users.email`, the script's SQL is spliced into the migration. If it doesn't, because the column already
exists, or the change was applied last week, the script does nothing, and `plan` tells you it is safe to delete.

## Change events

| Event                                       | The script runs…                                    | Typical use                              |
|---------------------------------------------|-----------------------------------------------------|------------------------------------------|
| `ON ADD COLUMN schema.table.column`         | after the column is added (see decomposition below) | backfilling a new required column        |
| `ON ALTER COLUMN TYPE schema.table.column`  | before the column's type is changed                 | fixing values the new type can't hold    |
| `ON ADD CONSTRAINT schema.table.constraint` | before the constraint is added                      | de-duplicating rows before a unique key  |

Change events match changes to existing tables only. A brand-new table is empty, so a script targeting it has no data to move.

## NOT NULL adds are decomposed

When adding a `NOT NULL` column with no default would fail against a populated table, with a matching `ON ADD COLUMN` script,
the planner decomposes the add into three steps:

1. add the column *nullable*,
2. run the script's SQL (the backfill),
3. `SET NOT NULL`.

The plan preview shows all three statements. A nullable or defaulted column add isn't decomposed, the script's SQL just
runs after the add. (Declaring a `DEFAULT` is still often a better option, without any migration script; see
[Data hazards](/v4/guides/data-hazards/).)

:::note[SQLite]
The SQLite provider doesn't support tightening a column to NOT NULL (it would require SQLite's full table-rebuild
procedure), so the decomposed form isn't available there.
:::

## Hazard suppression

A matching script also silences the corresponding [data-hazard](/v4/guides/data-hazards/) diagnostic. The hazard warns
that a change can fail on existing data, and the script is your declaration of how the data gets into shape.

## Lifecycle: change-event scripts expire themselves

Because the script only fires when its change is in the plan, it naturally goes dead once the change has shipped
everywhere. `plan` and `apply` report each unmatched script as an informational diagnostic:

```
Migration 'backfill emails' (ADD COLUMN app.users.email) matches no change in this plan and will not run.
If the change it supports has been applied everywhere, the block is safe to delete.
```

Delete the script whenever every environment you deploy to has the change. This replaces the pre/post
[deployment-script](/v4/guides/deployment-scripts/) pattern for transition SQL: an always-run deployment script must be
written idempotently, while a change-event script only runs alongside its change.

### `RUN ONCE` on a change event

The [`RUN ONCE`](/v4/guides/deployment-scripts/#run-once-scripts-are-recorded) condition composes with change events too:
`SCRIPT 'x' RUN ONCE ON ADD COLUMN …` runs at most once ever, even if the column is later dropped and re-added. It's
rarely needed — change events already self-expire — but it is well-defined.

## Migrations in templates

A [schema template](/v4/guides/templates/) can declare change-event scripts alongside the objects they support, so a change
to a templated table doesn't need the script repeated for every schema it's applied to.

Because we treat provider-native SQL as opaque, NSchema can't automatically attach unqualified names to the correct schema.
Instead, the `{schema}` token stands in for the target schema — in the name as well as the SQL, since instantiated
script names must stay unique:

```sql
TEMPLATE outbox
BEGIN
    CREATE TABLE outbox_events (
        id       uuid NOT NULL,
        trace_id text NOT NULL,
        CONSTRAINT pk_outbox_events PRIMARY KEY (id)
    );

    SCRIPT 'backfill {schema} trace ids' RUN ON ADD COLUMN outbox_events.trace_id AS $$
        UPDATE {schema}.outbox_events SET trace_id = gen_random_uuid()::text WHERE trace_id IS NULL;
    $$;
END;

APPLY TEMPLATE outbox IN SCHEMA sales, billing;
```

Applying the template instantiates one script per schema. A schema that already has the change reports its instance as
inert while a lagging schema's still fires, and a schema newly added to the `APPLY` list creates its table fresh (empty),
so the migration correctly doesn't run there.

Delete the script from the template once every applied schema has the change.

A change-event script in a template must target a table the template itself declares, and a template script colliding
with a hand-written one for the same change is rejected as a duplicate.

## Options

`run_outside_transaction = true` works exactly as it does for deployment scripts, for statements the database forbids
inside a transaction:

```sql
SCRIPT 'dedupe emails' RUN ON ADD CONSTRAINT app.users.users_email_uq (run_outside_transaction = true) AS $$
    DELETE FROM app.users a USING app.users b
    WHERE a.id > b.id AND a.email = b.email;
$$;
```

## The legacy form

Before NSchema 4.4, change-event scripts were declared as `MIGRATION ['name'] FOR <trigger> <path> AS $$…$$;` (with an
optional name). The old form still parses, but plans surface a deprecation warning naming the `SCRIPT` replacement, and
it will be removed in NSchema 5.0. Note the `SCRIPT` form requires a name.
