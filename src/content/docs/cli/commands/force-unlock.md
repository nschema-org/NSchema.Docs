---
title: nschema force-unlock
draft: true
description: Forcibly release a stale lock on the state store.
sidebar:
  label: force-unlock
  order: 11
---

Forcibly release a stale lock on the state store.

NSchema locks the state during write operations ([`apply`](/cli/commands/apply/),
[`destroy`](/cli/commands/destroy/), [`refresh`](/cli/commands/refresh/)); if one is
interrupted, the lock can be left behind and block further runs. This removes whatever lock
is currently held — use it only once you're sure no operation is still running, Terraform's
`force-unlock` style.

```sh
nschema force-unlock
```

:::caution
Overriding a live lock can corrupt shared state, so `force-unlock` prompts for confirmation
first. Only release a lock you're certain is stale.
:::

:::note[Needs]
A state store (a `BACKEND file` or `BACKEND s3` block); the lock lives with it. The live
database is never contacted.
:::

## Options

- **`--force`** — skip the confirmation prompt.
