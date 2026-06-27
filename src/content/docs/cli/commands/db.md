---
title: db
description: Inspect the live database directly through the provider.
sidebar:
  order: 10.6
---

Top-level group for commands that inspect the live database directly, reading through the configured
[provider](/providers/). This is the online counterpart to [`state`](/cli/commands/state/), which reads the recorded
snapshot: `db` always contacts the live database.

`db` is a group, run it with one of the subcommands below. On its own, `nschema db` just prints this list.

- **[`db show`](/cli/commands/db-show/)** — print the live database schema, read directly from the database.

:::note[Needs]
A [provider](/providers/) (a `PROVIDER` block); the live schema is read through it.
:::
