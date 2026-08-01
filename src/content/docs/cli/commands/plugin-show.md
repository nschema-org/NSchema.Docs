---
title: plugin show
description: Show the detail of one of the project's plugins, including its cache status.
sidebar:
  order: 14.2
---

Show the detail of a single [plugin](/cli/configuration/#plugins) your project uses, named by the label its `DATABASE` /
`STATE` statement references: its package, resolved version, and whether it exists in the cache.

```sh
nschema plugin show postgres
```

```text
postgres (database)
  Package: NSchema.Postgres
  Version: 5.0.0
  Restored: yes
  Cache path: /home/you/.nschema/plugins/NSchema.Postgres/5.0.0
```

If the label isn't one your project configures, the command lists the labels that are. Use
[`plugin list`](/cli/commands/plugin-list/) to see them all.

## Options

- **`--json`** — emit a single structured object instead of text:

  ```json
  { "role": "database", "label": "postgres", "packageId": "NSchema.Postgres", "version": "5.0.0", "restored": true, "cachePath": "/home/you/.nschema/plugins/NSchema.Postgres/5.0.0" }
  ```

  `cachePath` is omitted when the plugin is not restored.
