---
title: nschema fmt
description: Reformat your .sql DDL files to a canonical layout.
sidebar:
  label: fmt
  order: 3
slug: v3/cli/commands/fmt
---

Reformats your `.sql` DDL files to a canonical layout.

Formatting is **gentle**: it normalizes layout (one blank line between statements, one member per line indented two
spaces inside `CREATE TABLE` and config blocks, canonical`(`/`)` placement) while preserving your content verbatim.
It is idempotent, and deliberately does *not* rewrite content the exact way [`import`](/v3/cli/commands/import/) canonicalizes it.

```sh
nschema fmt                       # format every .sql file under the current directory
nschema fmt ./schemas/users.sql   # format a single file
nschema fmt --check               # CI: fail if anything is unformatted
cat users.sql | nschema fmt -     # format stdin to stdout
```

`nschema fmt [path]` rewrites a single `.sql` file, or every `.sql` file found recursively under a directory, in place,
and lists the files it changed. `path` defaults to the current directory.

## Options

* **`--check`** — write nothing; list the files that need formatting and exit `2` if any do (errors exit `1`). For CI.
* **`nschema fmt -`** — read DDL from stdin and write the formatted result to stdout, for editor integration.

## Needs

Nothing. It only reads and writes files.
