---
title: plugin cache
description: Inspect and remove entries in the shared plugin cache.
sidebar:
  order: 14.3
---

Group for managing the shared plugin cache at `~/.nschema/plugins`, where `nschema` stores the restored dependency
closure of each provider/backend package, one folder per package version. The cache is shared by every project on the
machine, so it is managed here by package and version.

`plugin cache` is a group. Run it with one of the subcommands below. On its own, `nschema plugin cache` just prints this
list.

- **[`plugin cache list`](/cli/commands/plugin-cache-list/)** — list the package versions held in the cache, with sizes.
- **[`plugin cache remove`](/cli/commands/plugin-cache-remove/)** — remove one package (a single version, or all of them).
- **[`plugin cache clear`](/cli/commands/plugin-cache-clear/)** — remove everything from the cache.

Anything removed is just a restorable copy: it is re-fetched on the next use, or with [`init`](/cli/commands/init/).
