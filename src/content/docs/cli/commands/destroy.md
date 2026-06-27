---
title: destroy
description: Drop all managed schema objects from the target database.
sidebar:
  order: 9
---

Drop all managed schema objects from the target database. Prompts for confirmation before making changes unless `--auto-approve` is given.

```sh
nschema destroy
```

:::danger[Purely destructive]
`destroy` is purely destructive and is **exempt** from the[destructive-action policy](/guides/destructive-actions/). To preview exactly what it 
would drop without running it, use [`plan --destroy`](/cli/commands/plan/#previewing-a-teardown).
:::

:::note[Needs]
A live database (a `PROVIDER postgres` block) the tool can write to, **and** a source for the schema to tear down, a 
configured state store (`BACKEND file` or `BACKEND s3`), or, with no store, your `*.sql` files to fall back on.
:::

When a state store is configured it is refreshed after the teardown.

## Options

- **`-s`, `--scope <name>`** — limit the teardown to specific namespaces. May be repeated.
- **`-y`, `--auto-approve`** — skip the confirmation prompt. Required for non-interactive runs.
- **`--no-lock`** — skip taking the state-store lock for this run. Use it only when you've coordinated access by 
  other means (for example you already hold the lock via [`nschema lock acquire`](/cli/commands/lock-acquire/)).

Like a declined [`apply`](/cli/commands/apply/), a declined `destroy` makes no changes and exits `1`.
