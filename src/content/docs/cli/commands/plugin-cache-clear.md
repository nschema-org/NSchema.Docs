---
title: plugin cache clear
description: Remove every plugin from the shared cache.
sidebar:
  order: 14.33
---

Remove **everything** from the shared plugin cache (`~/.nschema/plugins`) in one step. For removing a single package 
instead, see [`plugin cache remove`](/cli/commands/plugin-cache-remove/).

```sh
nschema plugin cache clear
```

```text
✓ Cleared 3 plugins from the cache.
```

Clearing is **not** prompted: the cache is only a restorable copy, so every plugin is re-fetched on its next use, or up
front with [`init`](/cli/commands/init/). The destructive "remove everything" lives in this dedicated command rather than
a bare `plugin cache remove`, so a missing argument can never wipe the cache by accident.

## Needs

Nothing — the cache is local to your machine and project-independent.
