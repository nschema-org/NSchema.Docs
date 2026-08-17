---
title: format
description: Reformat your NSQL files to a canonical layout.
sidebar:
  order: 4
---

Reformats your NSQL files to a canonical layout.

```sh
nschema format                       # format every project file under the current directory
nschema format ./schemas/users.nsql  # format a single file
nschema format --check               # CI: fail if anything is unformatted
cat users.nsql | nschema format -    # format stdin to stdout
```

`nschema format [path]` rewrites a single project file, or every project file found recursively under a directory, in place, 
and lists the files it changed. `path` defaults to the current directory.

## Options

- **`--check`** — write nothing; list the files that need formatting and exit `2` if any do (errors exit `1`). For CI.
- **`nschema format -`** — read DDL from stdin and write the formatted result to stdout, for editor integration.
