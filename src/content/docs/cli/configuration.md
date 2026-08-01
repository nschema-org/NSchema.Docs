---
title: Configuration
description: Declare the engine version, the plugins, the database, and the state store in SQL-shaped configuration statements.
---

Project configuration lives in your `.sql` files, in SQL-statement-shaped blocks. They declare the engine version the
project needs, the plugins it depends on, which database to connect to, and where to keep state.

[`nschema new`](/cli/commands/new/) puts these in a `config.sql`.

## The four statements

```sql
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
| `PLUGIN <label>`   | Declares a plugin dependency and pins its package version.                  |
| `DATABASE <label>` | The live database. See [Databases](/databases/).                            |
| `STATE <label>`    | The state store. See [State](/state/).                                      |

`ENGINE`, `DATABASE`, and `STATE` may each appear at most once; `PLUGIN` may appear as often as you have plugins.

## Plugins

Every plugin the project uses is declared explicitly by a `PLUGIN` statement, which pairs a **label** (your local name
for it) with the package it comes from:

```sql
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

```sql
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

## The lockfile

While the declared range indicates the acceptable plugin versions, the actually resolved version is pinned in the lockfile.
[`nschema init`](/cli/commands/init/) resolves every declaration and records the result in `nschema.lock`, beside your configuration:

```sql
LOCK (
  source  = 'NSchema.Postgres',
  version = '5.0.0'
);
```

- A **range** resolves to the highest available version it admits, and then pinned, so that every subsequent check resolves to the same version.
- [`plugin update [<label>]`](/cli/commands/plugin-update/) re-resolves ranges and rewrites the lockfile; [`plugin outdated`](/cli/commands/plugin-outdated/) shows what an update would change without doing it.

Check `nschema.lock` in to version control: it is what makes a plan reproducible across machines and CI.

## The engine assertion

`ENGINE` states which engine a project is written against, so an incompatible tool fails immediately with a clear
message rather than mis-planning:

```sql
ENGINE (
  version      = '[5.0,6.0)',   -- the engine (NSchema.Core)
  host_version = '[5.0,6.0)'    -- the host tool (the nschema CLI)
);
```

Both attributes are optional. `new` writes a `version` assertion pinned to the CLI's current major.

## Where configuration files live

Configuration statements go in `.sql` files alongside your schema. Two rules:

- A file named **`*.env.<name>.sql` is an environment overlay** — read only when that environment is selected, and never
  read as schema.
- **Every other `.sql` file is the base**: its schema declarations build the project, and its configuration statements
  build the configuration. By convention (and what `new` writes) configuration goes in `config.sql`.

## Environments

Select an environment with [`--environment <name>`](/cli/#global-flags) (or `NSCHEMA_ENVIRONMENT`) and every
`*.env.<name>.sql` file is layered over the base configuration:

```sh
nschema plan --environment prod    # base + *.env.prod.sql
nschema plan --environment staging # base + *.env.staging.sql
nschema plan                       # base only
```

An overlay **refines** the statement it restates, setting by setting, so it carries only what differs:

```sql
-- config.sql
STATE s3 ( bucket = 'acme-state', key = 'nschema.state.json' );

-- config.env.prod.sql — the bucket carries through
STATE s3 ( key = 'prod/nschema.state.json' );
```

Restating it under a **different label** replaces it outright instead, because a different label is a different plugin
and there is nothing meaningful to merge — that is how an overlay swaps the state store for another. `PLUGIN`
declarations from both layers carry through.

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
