---
title: lock release
description: Release a held state-store lock, including a stale one left by an interrupted run.
sidebar:
  order: 13.3
---

Release the lock, even if it is held — this is the escape hatch for a stale lock left behind by an interrupted run. Use 
it only once you're sure no operation is still running.

```sh
nschema lock release <lock-id>   # release a specific lock (recommended)
nschema lock release             # release whatever lock is held
```

:::note[Needs]
A state store (a `BACKEND file` or `BACKEND s3` block); the lock lives with it. The live database is never contacted.
:::

The `lock-id` is shown by [`lock status`](/cli/commands/lock-status/) and in the error message of the operation that was
blocked. When you pass it, `lock release` reads the held lock first and refuses if the id no longer matches. This guards
against race conditions where the lock you read is released and a new one acquired, so you don't break the lock for a 
legitimate operation. Omitting the id releases whatever lock is present (and also clears a lock whose contents are corrupt).

:::caution
Releasing a live lock can corrupt shared state, so `lock release` prompts for confirmation first. Only release a lock 
you're certain is stale.
:::

## Arguments

- **`lock-id`** *(optional)* — the id of the lock to release, copied from [`lock status`](/cli/commands/lock-status/) or
  the blocked operation's error. The release is refused if it no longer matches the held lock. Omit to release whatever 
  lock is held.

## Options

- **`-y`, `--auto-approve`** — skip the confirmation prompt. Required for non-interactive runs.
