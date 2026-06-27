---
title: plugin list
description: List the provider and backend plugins this project uses, and whether each is restored.
sidebar:
  order: 14.1
---

List the [plugins](/cli/configuration/#plugins-and-versions) your project pins — the `PROVIDER` block and any non-`file`
`BACKEND` block — with the package, the pinned version, and whether each is currently restored in the cache.

```sh
nschema plugin list
```

```text
╭──────────┬──────────┬──────────────────┬───────────────┬──────────╮
│ Role     │ Plugin   │ Package          │ Version       │ Restored │
├──────────┼──────────┼──────────────────┼───────────────┼──────────┤
│ provider │ postgres │ NSchema.Postgres │ 4.0.0         │ yes      │
│ backend  │ s3       │ NSchema.Aws      │ 4.0.0         │ no       │
╰──────────┴──────────┴──────────────────┴───────────────┴──────────╯
```

A plugin shown as **not restored** is fetched on its next use, or up front with [`init`](/cli/commands/init/). The
built-in `file` backend is not a plugin, so it never appears here.

## Options

- **`--json`** — emit the list as a structured array instead of a table, for scripting:

  ```json
  [{ "role": "provider", "label": "postgres", "packageId": "NSchema.Postgres", "version": "4.0.0", "restored": true, "cachePath": "/home/you/.nschema/plugins/NSchema.Postgres/4.0.0" }]
  ```

## Needs

Nothing beyond the project's config — `plugin list` reads the `PROVIDER` / `BACKEND` blocks and the local cache. It
contacts no database or state store.
