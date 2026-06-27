---
title: nschema lock-status
description: Show whether the state store is currently locked, and by whom.
sidebar:
  label: lock-status
  order: 13
slug: v3/cli/commands/lock-status
---

Show whether the state store is currently locked. It reads the lock, if there is one, and surfaces information like who
holds the lock, and the id you need to release it.

```sh
nschema lock-status
```

When locked, it prints the holder and the id, and the exact command to release it:

```text
⚠ The state is locked by alice@ci (operation 'apply', since 2026-06-25 10:00:00Z).
  Lock ID: 9f8e7d6c
  Release it, once you're sure no operation is still running, with: nschema force-unlock 9f8e7d6c
```

It pairs with [`force-unlock`](/v3/cli/commands/force-unlock/): check the lock, copy the id, then release that specific
lock. For a broader health check (database + state store + lock together) see [`doctor`](/v3/cli/commands/doctor/).

:::note[Needs]
A state store (a `BACKEND file` or `BACKEND s3` block); the lock lives with it. The live database is never contacted.
:::

## Options

* **`--detailed-exitcode`** — return a [detailed exit code](/v3/cli/exit-codes/): `0` when the state is not locked, `2`
  when it is locked (errors stay `1`), so a CI job can gate on it. Without it, `lock-status` always exits `0` and you
  read the state from its output.
* **`--json`** — emit a single structured object instead of text, for scripting:

  ```json
  { "locked": true, "lockId": "9f8e7d6c", "operation": "apply", "who": "alice@ci", "since": "2026-06-25T10:00:00+00:00" }
  ```

  When not locked, it is simply `{ "locked": false }`.
