---
title: Data hazards
description: How NSchema warns about changes that are valid against the schema but can fail on the data already in a table.
sidebar:
  order: 65
---

Some changes are perfectly valid against the schema, but can fail against the data when the migration runs. The classic 
example is adding a `NOT NULL` column without a default: on an empty table it succeeds, but if the table has rows, the 
database refuses mid-deployment. NSchema calls these data hazards and flags them at plan time, with a suggested fix.

## What gets flagged

On tables that already exist (a freshly created table is empty, so nothing in it can fail on data):

| Change                                                                                                                   | Why it can fail                                           | Typical fix                                                                                  |
|--------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------|----------------------------------------------------------------------------------------------|
| Adding a `NOT NULL` column with no default                                                                               | Existing rows have no value for it                        | Declare a `DEFAULT` — on PostgreSQL 11+ this fills existing rows without rewriting the table |
| Changing a column to `NOT NULL`                                                                                          | Existing rows may hold `NULL`s                            | Backfill the `NULL`s first                                                                   |
| Changing a column's type where the cast can fail (e.g. `text` → `int`, `varchar(100)` → `varchar(50)`, `bigint` → `int`) | Stored values may not fit or parse into the new type      | Verify the data fits, or migrate through a backfill                                          |
| Adding a primary key or unique constraint/index over existing columns                                                    | Existing rows may hold duplicates (or `NULL`s, for a key) | De-duplicate first, or scope uniqueness to the new columns                                   |

Identity and generated columns are exempt (they compute their own values), as is uniqueness confined to columns added in 
the same change (a new column starts empty). Type changes involving a custom type the engine has no knowledge of are not flagged.

## Policy levels

The reaction is controlled by the `--data-hazards` option:

| Value            | Behaviour                                                    |
|------------------|--------------------------------------------------------------|
| `error`          | A hazardous change fails the run. Nothing is applied.        |
| `warn` (default) | Each hazard is reported as a warning, but the run continues. |
| `allow`          | Hazards are reported as informational notes only.            |
| `ignore`         | Hazards are not reported at all.                             |

```sh
# environment variable
export NSCHEMA_DATA_HAZARD_POLICY=error
```

```sh
# command-line flag (highest precedence)
nschema apply --data-hazards error
```

The option applies to both [`plan`](/cli/commands/plan/) and [`apply`](/cli/commands/apply/).

## Resolving a hazard with a migration block

Declaring a matching [`MIGRATION` block](/guides/data-migrations/) silences the corresponding hazard: the block states
how the data gets into shape (a backfill before `SET NOT NULL`, a de-duplication before a unique constraint), so there
is nothing left to warn about. The plan output shows the block against its change instead.

## Teardowns are exempt

Like every diff policy, data-hazard detection applies to forward migrations. A teardown ([`destroy`](/cli/commands/destroy/), 
[`plan --destroy`](/cli/commands/plan/)) bypasses the diff and its policies entirely.
