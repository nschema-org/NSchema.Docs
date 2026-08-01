---
title: plugin list
description: List the plugins this project uses, and whether each is restored.
sidebar:
  order: 14.1
---

List the [plugins](/cli/configuration/#plugins) your project uses, with the package, the locked version, and whether each is currently restored in
the cache.

```sh
nschema plugin list
```

```text
╭──────────┬──────────┬──────────────────┬───────────────┬──────────╮
│ Role     │ Plugin   │ Package          │ Version       │ Restored │
├──────────┼──────────┼──────────────────┼───────────────┼──────────┤
│ database │ postgres │ NSchema.Postgres │ 5.0.0         │ yes      │
│ state    │ s3       │ NSchema.Aws      │ 5.0.0         │ no       │
╰──────────┴──────────┴──────────────────┴───────────────┴──────────╯
```

The version shown is the one pinned in the [lockfile](/cli/configuration/#the-lockfile). A plugin 
shown as **not restored** is fetched on its next use, or up front with [`init`](/cli/commands/init/). 

- This command is environment-aware, so if you're not seeing what you expect, you might be missing an `--environment` arg.
- The built-in `file` state store is not a plugin, so it never appears here.

## Options

- **`--json`** — emit the list as a structured array instead of a table, for scripting:

  ```json
  [{ "role": "database", "label": "postgres", "packageId": "NSchema.Postgres", "version": "5.0.0", "restored": true, "cachePath": "/home/you/.nschema/plugins/NSchema.Postgres/5.0.0" }]
  ```
