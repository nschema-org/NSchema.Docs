---
title: new
description: Create a new NSchema project in the current directory.
sidebar:
  order: 1
---

Scaffold a simple project in the current directory, to get a new project going.

```sh
nschema new
```

Run without arguments, the `new` command is interactive. It asks which database and state store to use, then guides you
through configuring them. Answer everything up front and it asks nothing.

This writes:

- `config.sql` — the project's [configuration](/cli/configuration/).
- `config.env.prod.sql` — a starter [environment overlay](/cli/configuration/#environments) for `prod`.
- `schemas/example.sql` — a starter [schema](/nsql/defining-schemas/) file.

Edit those to point at your database and describe the schema you want, then [`plan`](/cli/commands/plan/) and [`apply`](/cli/commands/apply/).

`new` pins the engine to the current major (`ENGINE ( version = '[5.0,6.0)' );`), and authors the `PLUGIN` declarations.

Afterwards, it runs [`init`](/cli/commands/init/), resolving and locking those plugins so the project is ready to `plan`.

## Options

- **`-f`, `--force`** — scaffold even if the directory is not empty.
- **`--database <postgres|sqlite|sqlserver>`** — the [database](/databases/) to scaffold for. Defaults to `postgres`.
- **`--state <file|s3>`** — the [state store](/state/) to scaffold for. Defaults to `file`.
- **`--set <key>=<value>`** — answer one of the plugin's questions up front. Repeatable: `--set host=db.internal --set database=orders`.
- **`--no-init`** — skip the resolve-and-lock step, for an offline or edit-first workflow. Run [`init`](/cli/commands/init/) yourself before planning.
