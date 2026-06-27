---
title: lock release
description: Release a held state-store lock, including a stale one left by an interrupted run.
sidebar:
  order: 13.3
---

Release the lock, even if it is held — this is the escape hatch for a stale lock left behind by an interrupted run. Use 
it only once you're sure no operation is still running.

```sh
nschema lock release <lock-id>   # release a specific lock (safe default)
nschema lock release --force     # release whatever lock is held
```

:::note[Needs]
A state store (a `BACKEND file` or `BACKEND s3` block); the lock lives with it. The live database is never contacted.
:::

The `lock-id` is shown by [`lock status`](/cli/commands/lock-status/), by [`lock acquire`](/cli/commands/lock-acquire/), 
and in the error of the operation that was blocked. `lock release` reads the held lock first and refuses if the id no 
longer matches, so you can't accidentally release a legitimate lock.

When you genuinely can't read the id first (clearing a stale or corrupt lock in CI), pass **`--force`** to release whatever
lock is held without naming it. Naming a `lock-id` takes precedence, so a redundant `--force` alongside one is simply ignored.

:::caution
Releasing a live lock can corrupt shared state, so `lock release` prompts for confirmation first. Only release a lock 
you're certain is stale.
:::

## Arguments

- **`lock-id`** — the id of the lock to release, copied from [`lock status`](/cli/commands/lock-status/),
  [`lock acquire`](/cli/commands/lock-acquire/), or the blocked operation's error. The release is refused if it no longer
  matches the held lock. Required unless `--force` is given.

## Options

- **`--force`** — release whatever lock is held without naming its id.
- **`-y`, `--auto-approve`** — skip the confirmation prompt. Required for non-interactive runs.
