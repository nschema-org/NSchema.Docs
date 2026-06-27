---
title: Configuration blocks
description: Declare the database provider and state backend in SQL-shaped config blocks, alongside your schema.
---

Project configuration lives in your `.sql` files alongside the schema, in SQL-statement-shaped blocks. They describe the
provider database to connect to and the backend store that holds your schema snapshot.

[`nschema scaffold`](/cli/commands/scaffold/) puts these in a dedicated `config.sql`, but they can live in any `.sql` file.

## The two blocks

```sql
-- which database to connect to. The provider is a plugin, so pin its version (the connection string itself is best supplied via the environment).
PROVIDER postgres (
  version = '4.0.0',
  connection_string = '',
  command_timeout = 30
);

-- where to keep state
BACKEND file (
  path = './nschema.state.json'
);
```

| Block              | Purpose                                              |
|--------------------|------------------------------------------------------|
| `PROVIDER <label>` | The live database. See the [Providers](/providers/). |
| `BACKEND <label>`  | The state backend. See [Backends](/backends/).       |

## Plugins and versions

Every `PROVIDER` or `BACKEND` block (other than the built-in `file` backend) names a [plugin](/providers/) and pins its package 
`version`. A first-party label (`postgres`, `sqlite`, `sqlserver`, `s3`) resolves to its NuGet package automatically; a 
`source` attribute points at any other package:

```sql
PROVIDER oracle (
  source  = 'Acme.NSchema.Oracle',
  version = '1.2.0',
  connection_string = ''
);
```

`nschema` restores the pinned plugin on first use. The `BACKEND` block may instead select S3 (also versioned):

```sql
BACKEND s3 (
  version = '4.0.0',
  bucket  = 'my-bucket',
  key     = 'env/state.json'
);
```

## Precedence

Settings resolve from three layers, in increasing order of precedence:

1. **Config blocks.** The base values.
2. **[Environment variables](/cli/environment-variables/).** `NSCHEMA_*`.
3. **Command-line options.** Per-run flags.

## Environments

A project can carry **environment overlays**: files named `*.env.<name>.sql` that are layered over the base configuration
only when you select that environment with [`--environment <name>`](/cli/#global-flags) (or `NSCHEMA_ENVIRONMENT`).

- The **base** configuration is every `*.sql` file *except* environment overlays.
- When `--environment prod` is set, every `*.env.prod.sql` file is layered on top.

This lets you keep environment-specific backends, scopes, or schema tweaks beside the base project without them taking 
effect until the environment is chosen:

```sh
nschema plan --environment prod    # base + *.env.prod.sql
nschema plan --environment staging # base + *.env.staging.sql
nschema plan                       # base only
```

## See also

- **[Environment variables](/cli/environment-variables/)**. The full list of `NSCHEMA_*`overrides.
- **[Providers](/providers/).** The available database providers.
- **[Backends](/backends/).** The available state backends.
