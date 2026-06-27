---
title: nschema init
description: Scaffold a new NSchema project in the current directory.
sidebar:
  label: init
  order: 1
slug: 3/cli/commands/init
---

Scaffold a simple project in the current directory, to get a new project going. It connects to nothing.

```sh
nschema init
```

This writes:

* `config.sql` — the project's provider/state configuration, as `PROVIDER` / `BACKEND` [config blocks](/v3/cli/configuration/).
* `schemas/example.sql` — a starter [desired-schema](/v3/ddl/defining-schemas/) file.

Edit those to point at your database and describe the schema you want, then
[`plan`](/v3/cli/commands/plan/) and [`apply`](/v3/cli/commands/apply/).

## Options

* **`-f`, `--force`** — initialize even if the directory is not empty. Without it, `init` refuses to run in a non-empty directory so it can't clobber existing files.
* **`--provider <postgres|sqlite|sqlserver>`** — the database [provider](/v3/providers/overview/) to scaffold for. Defaults to `postgres`.
* **`--backend <file|s3>`** — the state [backend](/v3/backends/overview/) to scaffold for. Defaults to `file`.

## Needs

Nothing. `init` only writes files.
