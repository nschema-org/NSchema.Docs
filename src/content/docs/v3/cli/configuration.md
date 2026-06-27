---
title: Configuration blocks
description: Declare the database provider and state backend in SQL-shaped
  config blocks, alongside your schema.
slug: v3/cli/configuration
---

Project configuration lives in your `.sql` files alongside the schema, in SQL-statement-shaped blocks. They describe the
provider database connection, the backend store that holds your schema snapshot, and the project-level policy.

`nschema init` puts these in a dedicated `config.sql`, but they can live in any `.sql` file.

## The three blocks

```sql
-- which database to connect to (the connection string is best supplied via the environment)
PROVIDER postgres (
  connection_string = '',
  command_timeout = 30
);

-- where to keep state
BACKEND file (
  path = './nschema.state.json'
);

-- optional project settings
NSCHEMA (
  destructive_action = 'error'
);
```

| Block              | Purpose                                              |
|--------------------|------------------------------------------------------|
| `PROVIDER <label>` | The live database. See the [Providers](/v3/providers/). |
| `BACKEND <label>`  | The state backend. See [Backends](/v3/backends/).       |
| `NSCHEMA`          | Project-level settings (no label).                   |

The `BACKEND` block may instead select S3:

```sql
BACKEND s3 (
  bucket = 'my-bucket',
  key = 'env/state.json'
);
```

## Precedence

Settings resolve from three layers, in increasing order of precedence:

1. **Config blocks.** The base values.
2. **[Environment variables](/v3/cli/environment-variables/).** `NSCHEMA_*`.
3. **Command-line options.** Per-run flags.

## Environments

A project can carry **environment overlays**: files named `*.env.<name>.sql` that are layered over the base configuration
only when you select that environment with [`--environment <name>`](/v3/cli/#global-flags) (or `NSCHEMA_ENVIRONMENT`).

* The **base** configuration is every `*.sql` file *except* environment overlays.
* When `--environment prod` is set, every `*.env.prod.sql` file is layered on top.

This lets you keep environment-specific backends, scopes, or schema tweaks beside the base project without them taking
effect until the environment is chosen:

```sh
nschema plan --environment prod    # base + *.env.prod.sql
nschema plan --environment staging # base + *.env.staging.sql
nschema plan                       # base only
```

## See also

* **[Environment variables](/v3/cli/environment-variables/)**. The full list of `NSCHEMA_*`overrides.
* **[Providers](/v3/providers/).** The available database providers.
* **[Backends](/v3/backends/).** The available state backends.
