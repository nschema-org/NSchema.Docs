---
title: Data migrations
description: Attach raw-SQL migration steps to structural changes, so they run exactly once.
sidebar:
  order: 55
---

NSchema's core engine helps guide the transition of a database to a desired schema, but some transitions require a migration 
script, whether it's a backfill, a data fix, or a de-duplication, that runs exactly once, when the change is applied. 
A `MIGRATION` block can attach that SQL to the structural change itself:

```sql
CREATE TABLE app.users (
    id int NOT NULL,
    email varchar(320) NOT NULL,
    CONSTRAINT pk_users PRIMARY KEY (id)
);

MIGRATION 'backfill emails' FOR ADD COLUMN app.users.email AS $$
    UPDATE app.users SET email = username || '@legacy.example' WHERE email IS NULL;
$$;
```

If the plan adds `app.users.email`, the block's SQL is spliced into the migration. If it doesn't, because the column already 
exists, or the change was applied last week, the block does nothing, and `plan` tells you it is safe to delete.

## Triggers

| Trigger                                      | The block runs…                                     | Typical use                             |
|----------------------------------------------|-----------------------------------------------------|-----------------------------------------|
| `FOR ADD COLUMN schema.table.column`         | after the column is added (see decomposition below) | backfilling a new required column       |
| `FOR ALTER COLUMN TYPE schema.table.column`  | before the column's type is changed                 | fixing values the new type can't hold   |
| `FOR ADD CONSTRAINT schema.table.constraint` | before the constraint is added                      | de-duplicating rows before a unique key |

Triggers match changes to existing tables only. A brand-new table is empty, so a block targeting it has no data to move.

## NOT NULL adds are decomposed

When adding a `NOT NULL` column with no default would fail against a populated table, with a matching`FOR ADD COLUMN` block, 
the planner decomposes the add into three steps:

1. add the column _nullable_,
2. run the block's SQL (the backfill),
3. `SET NOT NULL`.

The plan preview shows all three statements. A nullable or defaulted column add isn't decomposed, the block's SQL
simply runs after the add. (Declaring a `DEFAULT` is still often the whole fix, without any migration block; see
[Data hazards](/guides/data-hazards/).)

:::note[SQLite]
The SQLite provider doesn't support tightening a column to NOT NULL (it would require SQLite's full table-rebuild
procedure), so the decomposed form isn't available there.
:::

## Hazard suppression

A matching block also silences the corresponding [data-hazard](/guides/data-hazards/) diagnostic. The hazard warns
that a change can fail on existing data, and the block is your declaration of how the data gets into shape.

## Lifecycle: blocks expire themselves

Because a block only fires when its change is in the plan, it naturally goes dead once the change has shipped
everywhere. `plan` and `apply` report each unmatched block as an informational diagnostic:

```
Migration 'backfill emails' (ADD COLUMN app.users.email) matches no change in this plan and will not run.
If the change it supports has been applied everywhere, the block is safe to delete.
```

Delete the block whenever every environment you deploy to has the change. This replaces the pre/post
[deployment-script](/guides/deployment-scripts/) pattern for transition SQL: a deployment script runs on every apply and 
must be written idempotently, while a migration block only runs alongside its change.

## Migrations in templates

A [schema template](/guides/templates/) can declare migrations alongside the objects they support, so a change to a templated table 
doesn't need the block repeated for every schema it's applied to. 

Because we treat provider-native SQL as opaque, NSchema can't automatically attach unqualified names to the correct schema.
Instead, the `{schema}` token stands in for the target schema:

```sql
TEMPLATE outbox
BEGIN
    CREATE TABLE outbox_events (
        id       uuid NOT NULL,
        trace_id text NOT NULL,
        CONSTRAINT pk_outbox_events PRIMARY KEY (id)
    );

    MIGRATION 'backfill trace ids' FOR ADD COLUMN outbox_events.trace_id AS $$
        UPDATE {schema}.outbox_events SET trace_id = gen_random_uuid()::text WHERE trace_id IS NULL;
    $$;
END;

APPLY TEMPLATE outbox IN SCHEMA sales, billing;
```

Applying the template instantiates one block per schema, and each behaves exactly like a hand-written one.A schema that 
already has the change reports its instance as inert while a lagging schema's still fires, and a schema newly added to the
`APPLY` list creates its table fresh (empty), so the migration correctly doesn't run there. 

Delete the block from the template once every applied schema has the change.

A migration in a template must target a table the template itself declares, and a template block colliding with a hand-written 
one for the same change is rejected as a duplicate.

## Options

`run_outside_transaction = true` works exactly as it does for deployment scripts, for statements the database forbids 
inside a transaction:

```sql
MIGRATION FOR ADD CONSTRAINT app.users.users_email_uq (run_outside_transaction = true) AS $$
    DELETE FROM app.users a USING app.users b
    WHERE a.id > b.id AND a.email = b.email;
$$;
```
