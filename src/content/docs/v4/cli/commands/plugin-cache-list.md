---
title: plugin cache list
description: List the plugin packages restored in the shared cache, across all projects.
sidebar:
  order: 14.31
slug: v4/cli/commands/plugin-cache-list
---

List every package version held in the shared plugin cache (`~/.nschema/plugins`), with the size each takes on disk.
Unlike [`plugin list`](/v4/cli/commands/plugin-list/), which is scoped to the current project, this shows the whole
machine-wide cache.

```sh
nschema plugin cache list
```

```text
Plugin cache: /home/you/.nschema/plugins
╭──────────────────┬─────────┬─────────╮
│ Package          │ Version │    Size │
├──────────────────┼─────────┼─────────┤
│ NSchema.Postgres │ 4.0.0   │ 9.0 MiB │
╰──────────────────┴─────────┴─────────╯
  1 cached, 9.0 MiB total. Remove with: nschema plugin cache remove <package> [version]
```

## Options

* **`--json`** — emit the cache contents as a structured object:

  ```json
  { "cacheRoot": "/home/you/.nschema/plugins", "plugins": [{ "packageId": "NSchema.Postgres", "version": "4.0.0", "path": "/home/you/.nschema/plugins/NSchema.Postgres/4.0.0", "sizeBytes": 9437184 }] }
  ```

## Needs

Nothing — the cache is local to your machine and project-independent, so this command reads no project config and
contacts no infrastructure.
