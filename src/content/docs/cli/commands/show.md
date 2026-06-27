---
title: nschema show
description: Print the schema recorded in the state store as human-readable text.
sidebar:
  label: show
  order: 10
---

Print the schema recorded in the state store as human-readable text. The live database is never contacted. This is a 
read of what NSchema last recorded, useful for inspecting state or diffing it against [`import`](/cli/commands/import/) output.

```sh
nschema show
```

:::note[Needs]
A state store (a `BACKEND file` or `BACKEND s3` block).
:::

## Options

- **`-s`, `--scope <name>`** — limit the output to specific namespaces. May be repeated.
