---
title: lock status
description: Show whether the state store is currently locked, and who holds it.
sidebar:
  order: 13.1
---

Show whether the [state store](/guides/state/) is currently locked. It reads the lock, if there is one, and surfaces who
holds it, the operation, when it was taken, and the id you need to release it.

```sh
nschema lock status
```

:::note[Needs]
A state store (a `BACKEND` block); the lock lives with it.
:::

When locked, it prints the lock's details and the exact command to release it:

```text
⚠ The state is locked.
  Lock ID: 9f8e7d6c
  Held by: alice@ci
  Operation: apply
  Since: 2026-06-25 10:00:00Z
  Release it, once you're sure no operation is still running, with: nschema lock release 9f8e7d6c
```

If the lock records a [`--ttl`](/cli/commands/lock-acquire/), the expiry is surfaced here too (it is informational only: 
NSchema never auto-enforces it). For a broader health check (database + state store + lock together) see [`doctor`](/cli/commands/doctor/).

## Options

- **`--detailed-exitcode`** — return a [detailed exit code](/cli/exit-codes/): `0` when the state is not locked,
  `2` when it is locked (errors stay `1`), so a CI job can gate on it. Without it, `lock status` always exits `0`
  and you read the state from its output.
- **`--json`** — emit a single structured object instead of text, for scripting:

  ```json
  { "locked": true, "lockId": "9f8e7d6c", "operation": "apply", "who": "alice@ci", "since": "2026-06-25T10:00:00+00:00" }
  ```

  When not locked, it is simply `{ "locked": false }`.
