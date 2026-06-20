---
title: nschema fmt
draft: true
description: Reformat your .sql DDL files to a canonical layout — the analogue of terraform fmt.
sidebar:
  label: fmt
  order: 3
---

Reformat your `.sql` DDL files to a canonical layout — the analogue of `terraform fmt`.

Formatting is **gentle**: it normalises layout (one blank line between statements, one
member per line indented two spaces inside `CREATE TABLE` and config blocks, canonical
`(`/`)` placement) while preserving your content verbatim — keyword casing, member order,
expression spelling, multi-line view/routine/script bodies, and every comment. It is
idempotent, and deliberately does *not* rewrite content the way [`import`](/cli/commands/import/)
canonicalises it.

```sh
nschema fmt                       # format every .sql file under the current directory
nschema fmt ./schemas/users.sql   # format a single file
nschema fmt --check               # CI: fail if anything is unformatted
cat users.sql | nschema fmt -     # format stdin to stdout
```

`nschema fmt [path]` rewrites a single `.sql` file, or every `.sql` file found recursively
under a directory, in place, and lists the files it changed. `path` defaults to the current
directory.

## Options

- **`--check`** — write nothing; list the files that need formatting and exit `2` if any do
  (errors exit `1`). For CI.
- **`nschema fmt -`** — read DDL from stdin and write the formatted result to stdout, for
  editor integration.

## Needs

Nothing — it only reads and writes files.
