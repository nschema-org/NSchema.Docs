---
title: Configuration blocks
description: Declare the database provider and state backend in SQL-shaped config blocks, alongside your schema.
---

Project configuration lives in your `.sql` files alongside the schema, in
SQL-statement-shaped blocks — à la Terraform's `terraform` / `provider` blocks, but written
in SQL. They describe *where* your schema lives (the database and state store) and
project-level policy; the schema itself is not configured — it's every `*.sql` file under the
project directory.

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

| Block | Purpose |
| ----- | ------- |
| `PROVIDER <label>` | The live database. `postgres` is the only label today. See the [PostgreSQL provider](/providers/postgres/). |
| `BACKEND <label>` | The state store. `file` or `s3`. See [State backends](/providers/backends/). |
| `NSCHEMA` | Project-level settings (no label). |

The `BACKEND` block may instead select S3:

```sql
BACKEND s3 (
  bucket = 'my-bucket',
  key = 'env/state.json'
);
```

## Precedence

Settings resolve from three layers, in increasing order of precedence:

1. **Config blocks** (above) — the base values.
2. **[Environment variables](/cli/environment-variables/)** — `NSCHEMA_*`.
3. **Command-line options** — the per-run flags.

An unspecified flag never clobbers a configured value; a flag is only applied when it (or its
environment variable) is actually set.

## What belongs in a block — and what doesn't

Config blocks are **static**: they're read in a lightweight bootstrap pass before the engine
is configured, so they cannot reference variables or computed values (the same reason
Terraform forbids interpolation in its `backend` block).

:::caution[No secrets in config blocks]
Connection strings and credentials should **not** be committed in a config block. Keep only
stable, non-secret settings here (backend type and path, command timeout, policy) and supply
secrets through the [environment](/cli/environment-variables/). A `connection_string` *is*
allowed in a `PROVIDER` block for a local throwaway database, but the environment variable is
preferred — and takes precedence — for real secrets.
:::

Typos surface as errors: an unknown block type, label, or attribute is rejected rather than
silently ignored.

## Environments

A project can carry **environment overlays**: files named `*.env.<name>.sql` that are layered
over the base configuration only when you select that environment with
[`--environment <name>`](/cli/#global-flags) (or `NSCHEMA_ENVIRONMENT`).

- The **base** configuration is every `*.sql` file *except* environment overlays.
- When `--environment prod` is set, every `*.env.prod.sql` file is layered on top.

This lets you keep environment-specific backends, scopes, or schema tweaks beside the base
project without them taking effect until the environment is chosen:

```sh
nschema plan --environment prod    # base + *.env.prod.sql
nschema plan --environment staging # base + *.env.staging.sql
nschema plan                       # base only
```

## See also

- [Environment variables](/cli/environment-variables/) — the full list of `NSCHEMA_*`
  overrides.
- [PostgreSQL provider](/providers/postgres/) — every `PROVIDER postgres` attribute.
- [State backends](/providers/backends/) — every `BACKEND file` / `BACKEND s3` attribute.
