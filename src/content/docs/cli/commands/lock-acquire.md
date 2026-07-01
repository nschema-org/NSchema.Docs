---
title: lock acquire
description: Manually take and hold the state-store lock for out-of-band coordination.
sidebar:
  order: 13.2
---

Manually take the state lock. Unlike the automatic lock a write operation takes and releases, this lock outlives the command. 
It is left held for out-of-band coordination, for example to claim the state before a migration window so nothing else 
can write while you prepare. Release it with [`lock release`](/cli/commands/lock-release/) when you're done.

```sh
nschema lock acquire
nschema lock acquire --reason "release 4.0 migration window"
nschema lock acquire --ttl 2h
```

:::note[Needs]
A state store (a `BACKEND` block); the lock lives with it.
:::

It prints the new lock's id and the exact command to release it.

## Scripting

Pass `--json`, to print details of the acquired lock in JSON format.

```sh
LOCK_ID=$(nschema lock acquire --json | jq -r .lockId)
# ... run your out-of-band checks ...
nschema lock release "$LOCK_ID" --auto-approve
```

```json
{ "locked": true, "lockId": "ba5edd4334d74f1a89d6f143f506fe7f", "operation": "manual", "who": "ci@runner", "since": "2026-06-27T20:30:59+00:00" }
```

## Options

- **`--reason <text>`** — annotate the lock with a human-readable reason, surfaced by [`lock status`](/cli/commands/lock-status/) 
  so others know why the state is held.
- **`--ttl <duration>`** — record an optional expiry on the lock (for example `90s`, `30m`, `2h`, `1d`). [`lock status`](/cli/commands/lock-status/) 
  surfaces it, but it is **never auto-enforced**: the lock stays held until you release it.
- **`--json`** — print the held lock as a structured object on stdout (instead of formatted text), so a script can read
  the `lockId` to release it later.
