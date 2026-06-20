---
title: Offline planning & state
draft: true
description: How NSchema's optional state store enables planning without a database, and how to seed and maintain it.
---

By default, NSchema plans against the **live database**: it introspects the current schema at
plan time and diffs your desired schema against it. That's simple and needs no extra setup.

Sometimes you can't (or don't want to) reach the database at plan time — generating a migration
preview in CI, for instance. For that, NSchema can keep a **state store**: a persisted snapshot
of the last applied schema that planning can run against instead.

## Enabling a state store

Declare a [`BACKEND` block](/backends/). A local file:

```sql
BACKEND file (
  path = './nschema.state.json'
);
```

…or shared via S3 for a team or CI:

```sql
BACKEND s3 (
  bucket = 'my-bucket',
  key = 'env/state.json'
);
```

## How it changes each command

With a state store configured:

- **`plan`** can run **offline**, against the recorded snapshot, with no database connection —
  so a `PROVIDER` isn't required for planning. (`plan` still uses the live database if that's
  all that's configured.)
- **`apply`** always reads the **live** database, and after a successful apply it **captures**
  the resulting schema back to the store.
- **`refresh`**, **`drift`**, **`show`**, and **`force-unlock`** all operate against the store —
  see their command pages.

## Seeding and repairing state

When you first add a state store — or after out-of-band changes — seed it from the live
database with [`refresh`](/cli/commands/refresh/):

```sh
nschema refresh
```

This captures the **whole** live schema to the store. Run it again any time you need to
reconcile the store with reality (for example, after someone changed the database by hand).

## Inspecting state

[`show`](/cli/commands/show/) prints what the store currently holds, without touching the
database:

```sh
nschema show
```

## Locking

NSchema locks the store during writes (`apply`, `destroy`, `refresh`) so concurrent runs can't
corrupt it. An interrupted run can leave a stale lock; clear it with
[`force-unlock`](/cli/commands/force-unlock/) once you're certain nothing is still running.

## Detecting divergence

To check whether the live database has diverged from the recorded state, see
[Detecting drift](/guides/drift/).
