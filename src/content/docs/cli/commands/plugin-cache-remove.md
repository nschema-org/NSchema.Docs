---
title: plugin cache remove
description: Remove a plugin package from the shared cache, by package id and optional version.
sidebar:
  order: 14.32
---

Remove a plugin package from the shared cache (`~/.nschema/plugins`), naming it by package id. Give a version to remove
just that one; omit it to remove **every** cached version of the package.

```sh
nschema plugin cache remove NSchema.Postgres 4.0.0   # one version
nschema plugin cache remove NSchema.Postgres         # all versions of the package
```

Use the package ids and versions shown by [`plugin cache list`](/cli/commands/plugin-cache-list/). If nothing matches,
the command says so and changes nothing. Removal is **not** prompted: the cache is a restorable copy, so anything removed
is re-fetched on its next use or with [`init`](/cli/commands/init/).

To wipe the cache entirely, use [`plugin cache clear`](/cli/commands/plugin-cache-clear/) instead of naming every package.

## Arguments

- **`<package>`** *(required)* — the plugin package id, e.g. `NSchema.Postgres`.
- **`[version]`** *(optional)* — a specific version to remove. When omitted, all cached versions of the package go.

## Needs

Nothing — the cache is local and project-independent.
