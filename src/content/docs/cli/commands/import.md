---
title: nschema import
description: Read the live database schema and write it out as desired-schema source files.
sidebar:
  label: import
  order: 8
---

Read the live database schema and write it out as desired-schema source files. Use this to adopt an existing database 
into NSchema: import it, then check the generated files into source control and manage further changes with [`plan`](/cli/commands/plan/) /
[`apply`](/cli/commands/apply/).

```sh
nschema import --out-dir ./schemas
```

:::note[Needs]
A live database (a `PROVIDER postgres` block).
:::

## Options

- **`-o`, `--out-dir <path>`** — directory to write the imported SQL files into. Defaults to the current directory.
- **`-s`, `--scope <name>`** — limit the import to specific database schemas (namespaces). May be repeated.
- **`-f`, `--force`** — overwrite existing `.sql` files in the output directory. Without it,`import` refuses to run against a 
  directory that already contains `.sql` files, so a re-import can't silently clobber hand-edited schema (the same guard
  [`scaffold`](/cli/commands/scaffold/) applies to a non-empty directory).

See [Adopting an existing database](/guides/adopting-a-database/) for the full workflow.
