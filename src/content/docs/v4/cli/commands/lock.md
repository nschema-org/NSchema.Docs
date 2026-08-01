---
title: lock
description: Inspect, hold, and release the state-store lock.
sidebar:
  order: 13
slug: v4/cli/commands/lock
---

Top-level group for commands that inspect and manage the [state store](/v4/guides/state/)'s lock. This is the lock that stops
two or more independent `nschema` runs from writing the recorded state at once. Write operations ([`apply`](/v4/cli/commands/apply/),
[`refresh`](/v4/cli/commands/refresh/), [`destroy`](/v4/cli/commands/destroy/)) take and release this lock automatically; the
`lock` subcommands are for the times you need to look at it or hold it yourself.

`lock` is a group — run it with one of the subcommands below. On its own, `nschema lock` just prints this list.

* **[`lock status`](/v4/cli/commands/lock-status/)** — show whether the state is locked, and who holds it.
* **[`lock acquire`](/v4/cli/commands/lock-acquire/)** — manually take and hold the lock for out-of-band coordination.
* **[`lock release`](/v4/cli/commands/lock-release/)** — release a held lock, including a stale one left by an interrupted run.

:::note[Needs]
A state store (a `BACKEND` block); the lock lives with it. The live database is never contacted.
:::

For a broader health check that covers the database, state store, and lock together, see [`doctor`](/v4/cli/commands/doctor/).
