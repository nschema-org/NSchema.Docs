---
title: plugin update
description: Re-resolve declared version ranges to their highest available version and rewrite the lockfile.
sidebar:
  order: 14.3
---

If you're using plugin ranges, the `plugin update` command re-resolves the version ranges your `PLUGIN` statements declare
and updates the [lockfile](/cli/configuration/#the-lockfile) with the new matching versions.

If you're not using plugin ranges, you can just update the `version` attribute in your `PLUGIN` statement and run [`init`](/cli/commands/init/)
again (you might need to pass `--environment` if the plugin is only used in a given environment).

```sh
nschema plugin update            # every plugin declared with a range
nschema plugin update postgres   # just this one, by its PLUGIN label
```

Each updated plugin is reported with what changed, and the new pins are restored so the project stays usable:

```text
✔ NSchema.Postgres 5.0.0 → 5.1.0
  NSchema.Aws 5.0.0 (already up to date)
```

## Arguments

- **`plugin`** *(optional)* — the label of the plugin to update, as named by its `PLUGIN` statement. Omitting a plugin name
  defaults to every plugin.
