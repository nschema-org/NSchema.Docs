---
title: import
description: Read the live database schema and write it out as desired-schema source files.
sidebar:
  order: 8
---

Read the live database schema and write it out as desired-schema source files. Use this to adopt an existing database 
into NSchema: import it, then check the generated files into source control and manage further changes with [`plan`](/cli/commands/plan/) /
[`apply`](/cli/commands/apply/).

```sh
nschema import --out-dir ./schemas
```

## Options

- **`-o`, `--out-dir <path>`** — directory to write the imported files into. Defaults to the current directory.
- **`-s`, `--scope <address>`** — limit the import to a schema (`app`) or a single object (`app.orders`). May be repeated.
- **`-f`, `--force`** — overwrite existing project files in the output directory. Without it, `import` refuses to run against a
  directory that already contains them, so a re-import can't silently clobber hand-edited schema (the same guard
  [`new`](/cli/commands/new/) applies to a non-empty directory).

## What it writes

One file per major object, grouped by type under a directory per schema — `app/schema.nsql` for the schema's own
declarations, `app/tables/orders.nsql`, `app/views/…`, `app/routines/…`, and a top-level `extensions.nsql` for the
database-global extensions.

A re-import merges into the files that are already there rather than replacing them, and a file it merges into **keeps
the name it has**: a project imported before the [`.nsql` extension](/nsql/defining-schemas/#where-the-files-live)
existed stays in its `.sql` files, so nothing ends up declared twice.

See [Adopting an existing database](/guides/adopting-a-database/) for the full workflow.
