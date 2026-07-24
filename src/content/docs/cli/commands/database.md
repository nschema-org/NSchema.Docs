---
title: database
description: Inspect the live database directly through the provider.
sidebar:
  order: 10.6
---

Top-level group for commands that inspect the live database directly, reading through the configured
[provider](/databases/). This is the online counterpart to [`state`](/cli/commands/state/), which reads the recorded
snapshot: `database` always contacts the live database.

`database` is a group, run it with one of the subcommands below. On its own, `nschema database` just prints this list.

- **[`database show`](/cli/commands/database-show/)** — print the live database schema, read directly from the database.
