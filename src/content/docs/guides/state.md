---
title: State
description: How the state store enables planning without a database.
sidebar:
  order: 30
---

Rather than comparing directly against the live database, NSchema plans against an offline snapshot held in the state store.
Alongside the schema, it holds information about [scripts](#script-executions) that have been run, and which database objects are _[managed](#the-managed-set)_ by
NSchema. This approach has three major advantages:

1. **Offline planning.** By using the state store, your CI pipelines can produce a migration plan without being able to access the real database.
2. **Drift detection.** By comparing the recorded state against the live database, you can detect changes made out-of-band.
3. **Ledger history.** Most database management tools install some kind of ledger table to record scripts run against the database, but NSchema can use its own state store instead.

Offline planning is the most obvious win, because your PR build can't connect to your production database to plan a migration
(and if it can, you need to fix that immediately). By using the state store, NSchema can produce a plan at PR time, which
can be reviewed, audited, or saved as its own independent artifact.

## Enabling a state store

Write a [`STATE` statement](/state/) in your configuration. The simplest option is a local file:

```nsql
STATE file (
  path = './nschema.state.json'
);
```

For a team, or in a CI environment, you'll want somewhere more persistent, like Amazon S3:

```nsql
PLUGIN s3 (
  source  = 'NSchema.Aws',
  version = '[5.0,6.0)'
);

STATE s3 (
  bucket = 'my-bucket',
  key = 'env/state.json'
);
```

## The managed set

Rather than only storing objects that NSchema manages, the state snapshot covers the entire database. Alongside that is
declared the managed set: the names of every database object that NSchema is responsible for managing. Counterintuitively, 
this is actually what enables partial adoption. Database schemas can get complex, and their dependencies are what guarantee
data integrity. By keeping the whole database snapshot in state, NSchema can validate at plan time that it won't error 
due to out of scope dependencies (like dropping a custom type used by a table in a schema you haven't imported yet). 

Objects not in the managed set are _never_ modified by NSchema, they are used as reference only, so you can't accidentally
drop something that isn't managed, even by doing a full [`destroy`](/cli/commands/destroy/).

This is why [`refresh`](/cli/commands/refresh/) is safe to run against a shared database: capturing the live schema
records an observation, not an adoption.

## Script executions

The state also records which [`RUN ONCE` scripts](/guides/deployment-scripts/#run-conditions) have executed (by name,
with a hash of the body that ran), which is how later plans know to skip them. This ledger is the one part of the
state that is **not** a rebuildable cache — a `refresh` carries it over rather than reconstructing it, because the
database can't tell NSchema which scripts already ran.

The [`script` command group](/cli/commands/script/) manages the ledger directly:

```sh
nschema script list                 # what has run, when, and with which body
nschema script taint seed-users     # forget an execution — the script runs again on the next apply
nschema script untaint seed-users   # record a pending script as executed, without running it
```

## Ephemeral state

Some databases are disposable, like a container instance in an integration test, or your local dev environment (yes, it
should be disposable), but planning still needs state to work from. For these cases, you can use the `--ephemeral` flag:

```sh
nschema apply --ephemeral --auto-approve
```

This configures an in-memory store that lives only as long as the command, standing in for a configured `STATE` statement. 
Because the state is refreshed before an `apply`, the diff will run correctly: only new objects will be added, but any 
scripts won't be remembered the next time you apply. The easiest way around this is to just write them idempotently.

## Seeding and repairing state

When you first add a state store, or after [out-of-band changes](/guides/drift/), seed it from the live database using the 
[`refresh`](/cli/commands/refresh/) command:

```sh
nschema refresh
```

This captures the **whole** live schema to the store. Run it again any time you need to reconcile the store with reality
(for example, after someone changed the database by hand).

## Inspecting state

[`state show`](/cli/commands/state-show/) prints what the store currently holds, without touching the database:

```sh
nschema state show
```

## Locking

NSchema locks the store during writes (`apply`, `destroy`, `refresh`) so concurrent runs can't corrupt it. An interrupted 
run can leave a stale lock; clear it with [`lock release`](/cli/commands/lock-release/) once you're certain nothing is 
still running. You can check the lock without touching it with [`lock status`](/cli/commands/lock-status/), or hold 
it deliberately for out-of-band coordination with [`lock acquire`](/cli/commands/lock-acquire/).

## State surgery

When the recorded state is wrong in a way `refresh` can't fix, two loops cover everything:

**Pull → edit → push** is the universal option. [`state pull`](/cli/commands/state-pull/) downloads the raw payload (even one too corrupt to parse), 
you edit it as JSON, and [`state push`](/cli/commands/state-push/) validates it and writes it back byte-for-byte:

```sh
nschema state pull > state.json
# …edit state.json…
nschema state push state.json
```

This also serves as backup/restore, and as migration between backends: pull with one `STATE` configuration, push with 
the other. When an edit touches the script ledger, [`script hash`](/cli/commands/script-hash/) computes the body hash a ledger entry must carry.

**Refresh → untaint** rebuilds after state loss. The schema snapshot is just a cache of the live database, so
[`refresh`](/cli/commands/refresh/) reconstructs it wholesale; the [script ledger](#script-executions) is then restored by [`untaint`](/cli/commands/script-untaint/)ing each script
that had already executed:

```sh
nschema refresh
nschema script untaint seed-users
```

Pushes, taints, and untaints run under the [state lock](/cli/commands/lock/), like every other state write.

## State format and compatibility

Pull and push make the state payload a public surface, so its compatibility rules form part of the semantic versioning contract:

- The payload is JSON, carrying a format `version` number.
- **Within a major version of NSchema, the format only changes additively.** Every 5.x release reads state written by
  every other 5.x release. A payload written by a *newer minor* may carry fields an older release doesn't know.
- **A payload from a newer major version is refused, never misread.** The format `version` number changes at most at
  a major release, and a reader that encounters a newer one fails with an explicit error instead of guessing.
- **Hand-edits are preserved.** A push validates that the payload parses, then stores your bytes verbatim. 
- Check your work with [`state show`](/cli/commands/state-show/) or [`script list`](/cli/commands/script-list/).
- **Corrupt state is never a dead end.** An unreadable payload fails planning loudly (it can't be trusted for
  [run-once scripts](#script-executions)), but it can still be pulled for repair — and `refresh --force` replaces it
  and rebuilds, the recovery path of last resort, with a warning that the script ledger was reset.

## Detecting divergence

To check whether the live database has diverged from the recorded state, see [Detecting drift](/guides/drift/).
