---
title: nschema force-unlock
description: Forcibly release a stale lock on the state store.
sidebar:
  label: force-unlock
  order: 13
---

Forcibly release a stale lock on the state store.

NSchema locks the state during write operations ([`apply`](/cli/commands/apply/), [`destroy`](/cli/commands/destroy/), [`refresh`](/cli/commands/refresh/)); if one is
interrupted, the lock can be left behind and block further runs. This removes whatever lock is currently held: use it 
only once you're sure no operation is still running.

```sh
nschema force-unlock <lock-id>   # release a specific lock (recommended)
nschema force-unlock             # release whatever lock is held
```

The `lock-id` is shown in the error message of the operation that was blocked. When you pass it, `force-unlock` reads
the held lock first and refuses if the id no longer matches. This guards against race conditions where the lock you read 
is released and a new one acquired, so you don't break the lock for a legitimate operation. Omitting the id removes whatever
lock is present (and also clears a lock whose contents are corrupt).

You can see the current lock without touching it with [`nschema lock-status`](/cli/commands/lock-status/), which reports
the holder and the lock id (or [`nschema doctor`](/cli/commands/doctor/) as part of a broader health check).

:::caution
Overriding a live lock can corrupt shared state, so `force-unlock` prompts for confirmation first. Only release a lock 
you're certain is stale.
:::

:::note[Needs]
A state store (a `BACKEND file` or `BACKEND s3` block); the lock lives with it. The live database is never contacted.
:::

## Arguments

- **`lock-id`** *(optional)* — the id of the lock to release, copied from the blocked operation's error. The unlock is
  refused if it no longer matches the held lock. Omit to release whatever lock is held.

## Options

- **`-f`, `--force`** — skip the confirmation prompt.
