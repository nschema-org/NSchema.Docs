---
title: script list
description: Show the run-once script executions recorded in the state.
sidebar:
  order: 10.54
slug: v4/cli/commands/script-list
---

Show the [script](/v4/guides/deployment-scripts/#run-conditions) executions recorded in the [state store](/v4/guides/state/):
each script's declared name, when it was recorded, and the hash of the body that ran.

```sh
nschema script list
```

```
╭────────────┬──────────────────────┬───────────╮
│ Script     │ Executed             │ Body hash │
├────────────┼──────────────────────┼───────────┤
│ seed-users │ 2026-07-10 09:14:02Z │ 6b86b273… │
╰────────────┴──────────────────────┴───────────╯
```

With `--json` the ledger is emitted as a single array, so a script can consume it directly:

```sh
nschema script list --json | jq '.[].name'
```

:::note[Needs]
A state store (a `BACKEND` block). The live database is never contacted.
:::
