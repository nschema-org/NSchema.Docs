---
title: validate
description: Check that your desired-schema files are well-formed and internally consistent.
sidebar:
  order: 3
---

Check that your desired-schema files are well-formed and internally consistent, without contacting a database or state 
store. Useful as a fast pre-flight check in CI. It exits non-zero if it finds an error and zero otherwise; warnings are 
reported but do not fail the command.

It verifies that:

- every file parses;
- primary keys, indexes, and foreign keys reference columns that exist, and foreign keys reference a table whose primary 
  key or a unique index matches the referenced columns (**errors**);
- tables have a primary key, primary-key columns aren't nullable, and no key or index lists a column twice (**warnings**).

```sh
nschema validate
nschema validate --directory ./my-project
```

The desired schema is every `*.sql` file found recursively under the project directory. Run inside the project, or point
at it with [`--directory`](/cli/#global-flags). There is nothing to configure: no format (it's always [NSchema DDL](/ddl/grammar/)) and no 
directory or glob.

## Needs

Only your `*.sql` files. No database or state store.

## Exit codes

Errors exit `1`; a clean validation exits `0`. Warnings never fail the command. See the full [exit-code contract](/cli/exit-codes/).
