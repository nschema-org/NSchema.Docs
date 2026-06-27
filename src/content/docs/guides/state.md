---
title: Offline planning & state
description: How NSchema's optional state store enables planning without a database.
sidebar:
  order: 30
---

By default, NSchema will `plan` against the **live database**: it introspects the database schema and diffs it against the
desired schema. But your PR build can't just connect to the database to compute that diff (and if it can: fix that first, 
then we'll talk), so instead, NSchema can configure a `BACKEND` store that contains a persisted snapshot of the last known 
state of the database schema that planning can run against instead.

## Enabling a state store

Enabling a state store is as simple as writing a [`BACKEND` block](/backends/) in your DDL. The most basic option is a 
local file:

```sql
BACKEND file (
  path = './nschema.state.json'
);
```

For a team, or in a CI environment, you'll want somewhere more persistent, like Amazon S3:

```sql
BACKEND s3 (
  version = '4.0.0',
  bucket = 'my-bucket',
  key = 'env/state.json'
);
```

## How it changes each command

With a state store configured:

- **`plan`** will run offline, against the recorded snapshot, with no database connection.
- **`apply`** always reads the **live** database, and after a successful apply it refreshes the state snapshot.
- **`refresh`**, **`drift`**, **`show`**, and **`force-unlock`** all operate against the store see their command pages.

## Seeding and repairing state

When you first add a state store, or after [out-of-band changes](/guides/drift.md), seed it from the live database using the 
[`refresh`](/cli/commands/refresh/) command:

```sh
nschema refresh
```

This captures the **whole** live schema to the store. Run it again any time you need to reconcile the store with reality
(for example, after someone changed the database by hand).

## Inspecting state

[`show`](/cli/commands/show/) prints what the store currently holds, without touching the database:

```sh
nschema show
```

## Locking

NSchema locks the store during writes (`apply`, `destroy`, `refresh`) so concurrent runs can't corrupt it. An interrupted 
run can leave a stale lock; clear it with [`force-unlock`](/cli/commands/force-unlock/) once you're certain nothing is 
still running.

## Detecting divergence

To check whether the live database has diverged from the recorded state, see [Detecting drift](/guides/drift/).
