---
title: db
description: Inspect the live database directly through the provider.
sidebar:
  order: 10.6
slug: v4/cli/commands/db
---

Top-level group for commands that inspect the live database directly, reading through the configured
[provider](/v4/providers/). This is the online counterpart to [`state`](/v4/cli/commands/state/), which reads the recorded
snapshot: `db` always contacts the live database.

`db` is a group, run it with one of the subcommands below. On its own, `nschema db` just prints this list.

* **[`db show`](/v4/cli/commands/db-show/)** — print the live database schema, read directly from the database.

:::note[Needs]
A [provider](/v4/providers/) (a `PROVIDER` block); the live schema is read through it.
:::
