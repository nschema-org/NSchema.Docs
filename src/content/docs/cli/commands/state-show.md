---
title: state show
description: Print the schema NSchema has recorded in the state store.
sidebar:
  order: 10.5
---

Print the schema recorded in the [state store](/guides/state/) as human-readable text. This is a read of what
NSchema last recorded, useful for inspecting state or diffing it against [`import`](/cli/commands/import/) output.

```sh
nschema state show               # read the configured BACKEND store
nschema state show ./state.json  # read a state file directly off disk
```

Pass a path to read a state file straight from disk instead of the configured store.

:::note[Needs]
A state store (a `BACKEND` block) when no path is given. With a path, nothing — the file is read directly.
:::

## Arguments

- **`file`** *(optional)* — path to a state file on disk to read instead of the configured store.

## Options

- **`-s`, `--scope <name>`** — limit the output to specific namespaces. May be repeated.
