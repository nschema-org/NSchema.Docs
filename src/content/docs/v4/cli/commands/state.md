---
title: state
description: Inspect the schema NSchema has recorded in the state store.
sidebar:
  order: 10
slug: v4/cli/commands/state
---

Top-level group for commands that inspect and manage the schema snapshot NSchema has recorded in the [state store](/v4/guides/state/).
The snapshot is used for offline planning and [drift detection](/v4/guides/drift/). These subcommands operate on the recorded state;
they never touch the live database.

`state` is a group — run it with one of the subcommands below. On its own, `nschema state` just prints this list.

* **[`state show`](/v4/cli/commands/state-show/)** — print the recorded schema, from the configured backend or a state file on disk.
* **[`state pull`](/v4/cli/commands/state-pull/)** — download the raw state payload, for inspection, backup, or hand-editing.
* **[`state push`](/v4/cli/commands/state-push/)** — upload a state payload, replacing the recorded state.

:::note[Needs]
A state store (a `BACKEND` block) — or, for [`state show <file>`](/v4/cli/commands/state-show/), just the path to a state
file, with no backend configured at all.
:::
