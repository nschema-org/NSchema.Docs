---
title: state push
description: Upload a state payload to the configured store, replacing the recorded state.
sidebar:
  order: 10.52
---

Upload a state payload to the configured [state store](/guides/state/), replacing the recorded state. This is the
write half of the [pull → edit → push](/guides/state/#state-surgery) routine. NSchema validates that the payload parses
as a state snapshot, then writes it.

```sh
nschema state push ./edited.json
```

A payload that doesn't parse is rejected and nothing is written. Note that validation checks the payload's *shape*,
not your edits' meaning, so a misspelled field name isn't an error, it's simply ignored; verify the result with
[`state show`](/cli/commands/state-show/) or [`script list`](/cli/commands/script-list/) after pushing.

The push runs under the [state lock](/cli/commands/lock/).

:::caution
Pushing replaces the recorded state wholesale. The schema half can always be rebuilt from the live database with
[`refresh`](/cli/commands/refresh/), but the [run-once script ledger](/guides/state/#script-executions) cannot.
Pull a backup first if you're unsure.
:::

:::note[Needs]
A state store (a `BACKEND` block). The live database is never contacted.
:::

## Arguments

- **`file`** *(required)* — the state payload to push, e.g. a pulled state file after hand-editing.

## Options

- **`--no-lock`** — push without acquiring the state lock. You take responsibility for preventing concurrent runs.
