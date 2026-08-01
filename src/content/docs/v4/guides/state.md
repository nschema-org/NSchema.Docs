---
title: Offline planning & state
description: How NSchema's optional state store enables planning without a database.
sidebar:
  order: 30
slug: v4/guides/state
---

By default, NSchema will `plan` against the **live database**: it introspects the database schema and diffs it against the
desired schema. But your PR build can't just connect to the database to compute that diff (and if it can: fix that first,
then we'll talk), so instead, NSchema can configure a `BACKEND` store that contains a persisted snapshot of the last known
state of the database schema that planning can run against instead.

## Enabling a state store

Enabling a state store is as simple as writing a [`BACKEND` block](/v4/backends/) in your DDL. The most basic option is a
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

* **`plan`** will run offline, against the recorded snapshot, with no database connection.
* **`apply`** always reads the **live** database, and after a successful apply it refreshes the state snapshot.
* **`refresh`**, **`drift`**, **`state show`**, and the **`lock`** subcommands all operate against the store see their command pages.

## Script executions

The state also records which [`RUN ONCE` scripts](/v4/guides/deployment-scripts/#run-conditions) have executed (by name,
with a hash of the body that ran), which is how later plans know to skip them. This ledger is the one part of the
state that is **not** a rebuildable cache — a `refresh` carries it over rather than reconstructing it, because the
database can't tell NSchema which scripts already ran.

The [`script` command group](/v4/cli/commands/script/) manages the ledger directly:

```sh
nschema script list                 # what has run, when, and with which body
nschema script taint seed-users     # forget an execution — the script runs again on the next apply
nschema script untaint seed-users   # record a pending script as executed, without running it
```

## Seeding and repairing state

When you first add a state store, or after [out-of-band changes](/v4/guides/drift/), seed it from the live database using the
[`refresh`](/v4/cli/commands/refresh/) command:

```sh
nschema refresh
```

This captures the **whole** live schema to the store. Run it again any time you need to reconcile the store with reality
(for example, after someone changed the database by hand).

## Inspecting state

[`state show`](/v4/cli/commands/state-show/) prints what the store currently holds, without touching the database:

```sh
nschema state show
```

## Locking

NSchema locks the store during writes (`apply`, `destroy`, `refresh`) so concurrent runs can't corrupt it. An interrupted
run can leave a stale lock; clear it with [`lock release`](/v4/cli/commands/lock-release/) once you're certain nothing is
still running. You can check the lock without touching it with [`lock status`](/v4/cli/commands/lock-status/), or hold
it deliberately for out-of-band coordination with [`lock acquire`](/v4/cli/commands/lock-acquire/).

## State surgery

When the recorded state is wrong in a way `refresh` can't fix, two loops cover everything:

**Pull → edit → push** is the universal option. [`state pull`](/v4/cli/commands/state-pull/) downloads the raw payload (even one too corrupt to parse),
you edit it as JSON, and [`state push`](/v4/cli/commands/state-push/) validates it and writes it back byte-for-byte:

```sh
nschema state pull > state.json
# …edit state.json…
nschema state push state.json
```

This also serves as backup/restore, and as migration between backends: pull with one `BACKEND` configuration, push with
the other. When an edit touches the script ledger, [`script hash`](/v4/cli/commands/script-hash/) computes the body hash a ledger entry must carry.

**Refresh → untaint** rebuilds after state loss. The schema snapshot is just a cache of the live database, so
[`refresh`](/v4/cli/commands/refresh/) reconstructs it wholesale; the [script ledger](#script-executions) is then restored by [`untaint`](/v4/cli/commands/script-untaint/)ing each script
that had already executed:

```sh
nschema refresh
nschema script untaint seed-users
```

Pushes, taints, and untaints run under the [state lock](/v4/cli/commands/lock/), like every other state write.

## State format and compatibility

Pull and push make the state payload something you can hold in your hands, so its compatibility rules form part of our
semantic versioning contract:

* The payload is JSON, carrying a format `version` number.
* **Within a major version of NSchema, the format only changes additively.** Every 4.x release reads state written by
  every other 4.x release. A payload written by a *newer minor* may carry fields an older release doesn't know.
* **A payload from a newer major version is refused, never misread.** The format `version` number changes at most at
  a major release, and a reader that encounters a newer one fails with an explicit error instead of guessing.
* **Hand-edits are preserved.** A push validates that the payload parses, then stores your bytes verbatim.
* Check your work with [`state show`](/v4/cli/commands/state-show/) or [`script list`](/v4/cli/commands/script-list/).
* **Corrupt state is never a dead end.** An unreadable payload fails planning loudly (it can't be trusted for
  [run-once scripts](#script-executions)), but it can still be pulled for repair — and `refresh --force` replaces it
  and rebuilds, the recovery path of last resort, with a warning that the script ledger was reset.

## Detecting divergence

To check whether the live database has diverged from the recorded state, see [Detecting drift](/v4/guides/drift/).
