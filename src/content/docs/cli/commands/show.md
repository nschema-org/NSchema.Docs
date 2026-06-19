---
title: nschema show
description: Print the schema recorded in the state store as human-readable text.
sidebar:
  label: show
  order: 9
---

Print the schema recorded in the state store as human-readable text. The live database is
never contacted — this is a read of what NSchema last recorded, useful for inspecting state
or diffing it against [`import`](/cli/commands/import/) output.

```sh
nschema show
```

:::note[Needs]
A state store (a `BACKEND file` or `BACKEND s3` block).
:::

## Options

- **`--scope <name>`** — limit the output to specific namespaces. May be repeated.
