---
title: Configuration
description: Declare the engine version, the plugins, the database, and the state store in SQL-shaped configuration statements.
---

Project configuration lives in your `.sql` files, in SQL-statement-shaped blocks. They declare the engine version the
project needs, the plugins it depends on, which database to connect to, and where to keep state.

[`nschema new`](/cli/commands/new/) puts these in a `config.sql`.

## The four statements

```nsql
-- the engine version this project needs
ENGINE (
  version = '[5.0,6.0)'
);

-- the plugins the project depends on, and the versions it pins them to
PLUGIN postgres (
  source  = 'NSchema.Postgres',
  version = '[5.0,6.0)'
);

-- which database to connect to (the connection string is best supplied via the environment)
DATABASE postgres (
  connection_string = '',
  command_timeout = 30
);

-- where to keep state
STATE file (
  path = './nschema.state.json'
);
```

| Statement          | Purpose                                                                     |
|--------------------|-----------------------------------------------------------------------------|
| `ENGINE`           | Asserts the engine (and optionally host-tool) version the project requires. |
| `PLUGIN <label>`   | Declares a plugin dependency: a package and version, or a path to a build.  |
| `DATABASE <label>` | The live database. See [Databases](/databases/).                            |
| `STATE <label>`    | The state store. See [State](/state/).                                      |

`ENGINE`, `DATABASE`, and `STATE` may each appear at most once; `PLUGIN` may appear as often as you have plugins.

## Plugins

Every plugin the project uses is declared explicitly by a `PLUGIN` statement, which pairs a **label** (your local name
for it) with the package it comes from:

```nsql
PLUGIN pg (
  source  = 'NSchema.Postgres',
  version = '[5.0,6.0)'
);

PLUGIN s3 (
  source  = 'NSchema.Aws',
  version = '[5.0,6.0)'
);
```

`DATABASE` and `STATE` then reference a label:

```nsql
DATABASE pg ( connection_string = '' );

STATE s3 (
  bucket = 'my-bucket',
  key    = 'env/state.json'
);
```

The label is just an identifier, and has no bearing on the plugin. The one exception is `STATE file`, the local-file 
store built into the engine, which needs no matching `PLUGIN`.

A `version` is either an exact pin (`'5.0.0'`) or a NuGet-style range (`'[5.0,6.0)'`).

To see which plugins a project declares and whether each is restored, use [`plugin list`](/cli/commands/plugin-list/);
the shared on-disk cache is inspected and pruned with the [`plugin cache`](/cli/commands/plugin-cache/) commands.

### Loading a plugin from a path

A plugin can name a built .NET assembly instead of a package, which skips the package resolution and the shared cache
entirely:

```nsql
PLUGIN pg (
  path = './artifacts/NSchema.Postgres.dll'
);
```

This is for working on a plugin, and for build pipelines that want to test what they have just built rather than what
they last published. Relative paths resolve against the project root, not the working directory.

The assembly needs its dependency closure beside it, that is, a `.deps.json` and the packages it references, which is
what a provider project produces when it sets:

```xml
<CopyLocalLockFileAssemblies>true</CopyLocalLockFileAssemblies>
```

Without it, only the plugin's own assembly lands in `bin` and loading fails.

:::caution
A plugin loaded from a path is not reproducible. Nothing pins the bits behind the path, so the project no longer
describes something reliable.
:::

That is reported on every run as `plugin-from-path`, so a CI log shows when a run used a build rather than a release.
A project that loads one deliberately — a plugin's own test harness, say — can silence it in `.editorconfig`:

```ini
[*]
nschema_diagnostic.plugin-from-path.severity = none
```

## The lockfile

While the declared range indicates the acceptable plugin versions, the actually resolved version is pinned in the lockfile.
[`nschema init`](/cli/commands/init/) resolves every declaration and records the result in `nschema.lock`, beside your configuration:

```nsql
LOCK (
  source  = 'NSchema.Postgres',
  version = '5.0.0'
);
```

- A **range** resolves to the highest available version it admits, and then pinned, so that every subsequent check resolves to the same version.
- [`plugin update [<label>]`](/cli/commands/plugin-update/) re-resolves ranges and rewrites the lockfile; [`plugin outdated`](/cli/commands/plugin-outdated/) shows what an update would change without doing it.

Check `nschema.lock` in to version control: it is what makes a plan reproducible across machines and CI.

A plugin declared by [`path`](#loading-a-plugin-from-a-path) never appears in the lockfile. There is no version to
record, and writing one in would claim a reproducibility the path cannot offer. For the same reason
[`plugin update`](/cli/commands/plugin-update/) and [`plugin outdated`](/cli/commands/plugin-outdated/) skip it: there
is no range to widen and no feed to ask.

## The engine assertion

`ENGINE` states which engine a project is written against, so an incompatible tool fails immediately with a clear
message rather than mis-planning:

```nsql
ENGINE (
  version      = '[5.0,6.0)',   -- the engine (NSchema.Core)
  host_version = '[5.0,6.0)'    -- the host tool (the nschema CLI)
);
```

Both attributes are optional. `new` writes a `version` assertion pinned to the CLI's current major.

## Where configuration files live

Configuration can live in any of the `.sql` files alongside your schema, but I'd recommend keeping them separate in a 
well-known file. All of mine are stored in `config.sql`. Environment files (files named **`*.env.<name>.sql`) are only 
read when that environment is selected, so put environment-specific configuration in a file with the `.env.<name>.sql` 
suffix.

## Environments

Select an environment with [`--environment <name>`](/cli/#global-flags) (or `NSCHEMA_ENVIRONMENT`) and every
`*.env.<name>.sql` file is layered over the base:

```sh
nschema plan --environment prod    # base + *.env.prod.sql
nschema plan --environment staging # base + *.env.staging.sql
nschema plan                       # base only
```

### Configuration in an overlay

An overlay merges with any configuration in the base files, overwriting any re-declared config keys:

```nsql
-- config.sql
STATE s3 ( bucket = 'acme-state', key = 'nschema.state.json' );

-- config.env.prod.sql — the bucket carries through
STATE s3 ( key = 'prod/nschema.state.json' );
```

Restating it under a **different label** replaces it outright instead, because a different label is a different plugin
and there is nothing meaningful to merge — that is how an overlay swaps the state store for another. `PLUGIN`
declarations from both layers carry through.

### Schema in an overlay

Schema declarations can also appear in overlays, and add to the base project. It's a relatively niche use case, but it can
be useful for things like a set of test tables to run integration tests against:

```nsql
-- fixtures.env.test.sql — planned only under --environment test
CREATE TABLE test.orders_fixture (
  id INT NOT NULL
);
```

## Precedence

Settings resolve from three layers, in increasing order of precedence:

1. **Configuration statements.** The base values, plus any selected environment overlay.
2. **[Environment variables](/cli/environment-variables/).** `NSCHEMA_*`.
3. **Command-line options.** Per-run flags.

## See also

- **[Environment variables](/cli/environment-variables/)**. The full list of `NSCHEMA_*` overrides.
- **[Databases](/databases/).** The available database providers.
- **[State](/state/).** The available state stores.
- **[Configuration statements](/nsql/grammar/#configuration-statements)**. The grammar these statements parse under.
