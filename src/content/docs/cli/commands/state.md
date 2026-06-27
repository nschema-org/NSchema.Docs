---
title: state
description: Inspect the schema NSchema has recorded in the state store.
sidebar:
  order: 10
---

Top-level group for commands that inspect and manage the schema snapshot NSchema has recorded in the [state store](/guides/state/).
The snapshot is used for offline planning and [drift detection](/guides/drift/). These subcommands read the recorded state;
they never touch the live database.

`state` is a group — run it with one of the subcommands below. On its own, `nschema state` just prints this list.

- **[`state show`](/cli/commands/state-show/)** — print the recorded schema, from the configured backend or a state file on disk.

:::note[Needs]
A state store (a `BACKEND` block) — or, for [`state show <file>`](/cli/commands/state-show/), just the path to a state
file, with no backend configured at all.
:::
