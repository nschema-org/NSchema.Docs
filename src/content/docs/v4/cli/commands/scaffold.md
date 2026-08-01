---
title: scaffold
description: Scaffold a new NSchema project in the current directory.
sidebar:
  order: 1
slug: v4/cli/commands/scaffold
---

Scaffold a simple project in the current directory, to get a new project going.

```sh
nschema scaffold
```

This writes:

* `config.sql` — the project's provider/state configuration, as `PROVIDER` / `BACKEND` [config blocks](/v4/cli/configuration/).
* `config.env.prod.sql` — a starter [environment overlay](/v4/cli/configuration/#environments).
* `schemas/example.sql` — a starter [desired-schema](/v4/ddl/defining-schemas/) file.

Edit those to point at your database and describe the schema you want, then
[`plan`](/v4/cli/commands/plan/) and [`apply`](/v4/cli/commands/apply/).

`scaffold` resolves the latest plugin version compatible with this CLI and pins it in the generated `version`attribute,
so the project is reproducible from the moment it's created.

## Options

* **`-f`, `--force`** — scaffold even if the directory is not empty. Without it, `scaffold` refuses to run in a non-empty directory so it can't clobber existing files.
* **`--provider <postgres|sqlite|sqlserver>`** — the database [provider](/v4/providers/) to scaffold for. Defaults to `postgres`.
* **`--backend <file|s3>`** — the state [backend](/v4/backends/) to scaffold for. Defaults to `file`.

## Needs

The **.NET SDK and network access** to your NuGet feed: `scaffold` resolves and restores the chosen plugin (shelling out
to `dotnet`) to read its template and pin its version. The built-in `file` backend needs no plugin.
