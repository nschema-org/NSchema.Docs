---
title: script taint
description: Remove a script's recorded execution, so it runs again on the next apply.
sidebar:
  order: 10.55
---

Remove a script's recorded execution from the [state store](/guides/state/), so the
[`RUN ONCE` script](/guides/deployment-scripts/#run-conditions) runs again on the next apply.

```sh
nschema script taint seed-users
```

Use it when a run-once script needs to happen again: its effect was undone out-of-band, or its body has changed and you 
want the new version to run. The next [`plan`](/cli/commands/plan/) will show the script as pending, and the next [`apply`](/cli/commands/apply/) 
will execute and re-record it. The change runs under the [state lock](/cli/commands/lock/).

:::note[Needs]
A state store (a `BACKEND` block). The live database is never contacted.
:::

## Arguments

- **`name`** *(required)* — the script's declared name, as shown by [`script list`](/cli/commands/script-list/).

## Options

- **`--no-lock`** — taint without acquiring the state lock. You take responsibility for preventing concurrent runs.
