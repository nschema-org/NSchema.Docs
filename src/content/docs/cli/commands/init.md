---
title: nschema init
description: Scaffold a new NSchema project in the current directory.
sidebar:
  label: init
  order: 1
---

Scaffold a simple project in the current directory, to get a new project going. It connects to nothing.

```sh
nschema init
```

This writes:

- `config.sql` — the project's provider/state configuration, as `PROVIDER` / `BACKEND` [config blocks](/cli/configuration/).
- `schemas/example.sql` — a starter [desired-schema](/ddl/defining-schemas/) file.

Edit those to point at your database and describe the schema you want, then
[`plan`](/cli/commands/plan/) and [`apply`](/cli/commands/apply/).

## Options

- **`-f`, `--force`** — initialize even if the directory is not empty. Without it, `init` refuses to run in a non-empty directory so it can't clobber existing files.
- **`--provider <postgres|sqlite|sqlserver>`** — the database [provider](/providers/overview/) to scaffold for. Defaults to `postgres`.
- **`--backend <file|s3>`** — the state [backend](/backends/overview/) to scaffold for. Defaults to `file`.

## Needs

Nothing. `init` only writes files.
