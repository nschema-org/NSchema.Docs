---
title: plugin show
description: Show the detail of one of the project's plugins, including its cache status.
sidebar:
  order: 14.2
---

Show the detail of a single [plugin](/cli/configuration/#plugins-and-versions) your project uses, named by the label from
its `PROVIDER` / `BACKEND` block (`postgres`, `s3`, …): its package, pinned version, and whether it exists in the cache.

```sh
nschema plugin show postgres
```

```text
postgres (provider)
  Package: NSchema.Postgres
  Version: 4.0.0
  Restored: yes
  Cache path: /home/you/.nschema/plugins/NSchema.Postgres/4.0.0
```

If the label isn't one your project configures, the command lists the labels that are. Use
[`plugin list`](/cli/commands/plugin-list/) to see them all.

## Options

- **`--json`** — emit a single structured object instead of text:

  ```json
  { "role": "provider", "label": "postgres", "packageId": "NSchema.Postgres", "version": "4.0.0", "restored": true, "cachePath": "/home/you/.nschema/plugins/NSchema.Postgres/4.0.0" }
  ```

  `cachePath` is omitted when the plugin is not restored.

## Needs

Nothing beyond the project's config; like [`plugin list`](/cli/commands/plugin-list/) it reads only the config blocks and
the local cache.
