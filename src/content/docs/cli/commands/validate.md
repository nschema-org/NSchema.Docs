---
title: validate
description: Check that your desired-schema files are well-formed and internally consistent.
sidebar:
  order: 3
---

Check that your desired-schema files are well-formed and internally consistent, without contacting a database or state 
store. Useful as a fast pre-flight check in CI. It exits non-zero if it finds an error and zero otherwise; warnings are 
reported but do not fail the command.

As well as ensuring every file is syntactically correct, it also runs any configured project policies, meaning it checks
structural/lint rules like:

- Primary keys, indexes, and foreign keys reference columns that exist.
- Foreign keys match that table's primary key or a unique index.
- All tables have a primary key.
- Primary-key columns are declared `NOT NULL`.

```sh
nschema validate
nschema validate --directory ./my-project
```

## Exit codes

Errors exit `1`; a clean validation exits `0`. Warnings never fail the command. See the full [exit-code contract](/cli/exit-codes/).
