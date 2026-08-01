---
title: database show
description: Print the live database schema, read directly from the database.
sidebar:
  order: 10.7
---

Print the live database schema as human-readable text, read directly from the database through the configured
[provider](/databases/). This is the online counterpart to [`state show`](/cli/commands/state-show/): where that reads
the recorded snapshot offline, `database show` introspects the live database itself, which is useful for seeing the real current
schema, or for diffing it against [`state show`](/cli/commands/state-show/).

```sh
nschema database show
nschema database show --scope app      # limit to a schema or an object
```

## Options

- **`-s`, `--scope <address>`** — limit the output to a schema (`app`) or a single object (`app.orders`). May be repeated.
