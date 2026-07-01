---
title: db show
description: Print the live database schema, read directly from the database.
sidebar:
  order: 10.7
---

Print the live database schema as human-readable text, read directly from the database through the configured
[provider](/providers/). This is the online counterpart to [`state show`](/cli/commands/state-show/): where that reads
the recorded snapshot offline, `db show` introspects the live database itself, which is useful for seeing the real current
schema, or for diffing it against [`state show`](/cli/commands/state-show/).

```sh
nschema db show
nschema db show --scope public   # limit to specific namespaces
```

:::note[Needs]
A [provider](/providers/) (a `PROVIDER` block); the live schema is read through it. No state store is involved.
:::

## Options

- **`-s`, `--scope <name>`** — limit the output to specific database schemas (namespaces). May be repeated.
