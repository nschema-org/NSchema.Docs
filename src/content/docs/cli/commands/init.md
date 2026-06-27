---
title: nschema init
description: Restore the provider and backend plugins pinned in the project configuration.
sidebar:
  label: init
  order: 2
---

Restore the provider and backend [plugins](/cli/configuration/#plugins-and-versions) pinned by your project, so a later command doesn't have to.

```sh
nschema init
```

Plugins are restored implicitly on first use, so `init` is optional, it just does the restore up front. Run it to:

- Warm the cache before a timed step, so the first real command isn't slowed by a download.
- Fail fast on a bad version pin or an unreachable feed, at a predictable point rather than mid-operation.

To create a *new* project's files, use [`scaffold`](/cli/commands/scaffold/) instead — `init` only restores plugins for an existing project. 
Pairs with the [`--no-init`](#skipping-the-implicit-restore) flag below.

## Skipping the implicit restore

Every operation accepts **`--no-init`** (analogous to `dotnet --no-restore`). It skips the implicit restore and requires
the pinned plugins to already be cached, failing fast with guidance if one is missing. The pattern in CI is to restore
once up front and require the cache thereafter:

```sh
nschema init                 # restore once
nschema plan   --no-init     # require the cache, never fetch
nschema apply  --no-init
```

The built-in `file` backend has no plugin, so it never needs restoring.

## Needs

The **.NET SDK and network access** to your NuGet feed (the restore shells out to `dotnet`). A project with only the
built-in `file` backend and no provider has nothing to restore.
