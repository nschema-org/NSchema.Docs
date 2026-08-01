---
title: init
description: Install the declared plugins.
sidebar:
  order: 2
---

Installs every [plugin](/cli/configuration/#plugins) your project declares (respecting the current environment), pinning
the resolved versions in the lockfile if necessary.

```sh
nschema init
```

Install follows the `version` on each `PLUGIN` statement:

- A rang (`'[5.0,6.0)'`) resolves to the highest available version, and the result is written to the [lockfile](/cli/configuration/#the-lockfile).
- An exact pin (`'5.0.0'`) doesn't need resolving, and just installs directly.

`init` **respects an existing lockfile**: a plugin already pinned there keeps its pin, unless the version in the plugin 
declaration is changed.

## Skipping the implicit restore

Restore also happens implicitly on first use. Every command accepts **`--no-init`**, which skips that restore and requires 
the locked plugins to already be available.

```sh
nschema init                 # resolve, lock, restore
nschema plan   --no-init     # require the cache, never fetch
nschema apply  --no-init
```

The built-in `file` state store has no plugin, so it never needs declaring or restoring.
