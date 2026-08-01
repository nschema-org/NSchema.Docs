---
title: refresh
description: Read the live schema and write it to the state store.
sidebar:
  order: 7
---

Read the live schema and write it to the state store. Use this to seed or repair [state](/guides/state/).

```sh
nschema refresh
```

The refresh command captures the _whole_ schema, and so takes no project or `--scope` options. This makes migrations a lot
safer, because it allow NSchema to warn about changes outside its managed set. For example, if you have an unmanaged `orders`
table that depends on a managed `customers` table, without the full schema, dropping the customers table would produce a
successful plan.

Refresh is how you record drift that happened between applies, or seed the state store with the current schema before you
start managing a database. Since [`plan`](/cli/commands/plan/) always diffs the recorded state against your project, a
refresh is also how you tell NSchema about a change someone made to the database out of band.

A capture is an *observation*, not an adoption: it records what the database contains without adding anything to the
[managed set](/guides/state/#the-managed-set), so refreshing an unmanaged object never puts it at risk of being dropped.

## Options

- **`--no-lock`** — skip taking the state-store lock for this run. Use it only when you've coordinated access by 
  other means (for example you already hold the lock via [`nschema lock acquire`](/cli/commands/lock-acquire/)).
- **`--force`** — replace an existing state payload that cannot be read, resetting the script ledger.

## Recovery

If your state becomes corrupted somehow, the refresh operation will fail rather than overwriting it. The payload can still
be [pulled for repair](/guides/state/#state-surgery), or you can pass `--force` to replace it, which resets the[run-once script ledger](/guides/state/#script-executions).
Restore the ledger afterwards with [`script untaint`](/cli/commands/script-untaint/).
