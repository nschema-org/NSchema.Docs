---
title: destroy
description: Drop all managed schema objects from the target database.
sidebar:
  order: 9
---

Drop everything NSchema manages from the target database. Prompts for confirmation before making changes unless `--auto-approve` is given.

```sh
nschema destroy
```

:::danger[Purely destructive]
A teardown is destructive by design, so `destroy` sets the [destructive-action policy](/guides/destructive-actions/) to`allow`. 
To preview exactly what it would drop without running it, use [`plan --destroy`](/cli/commands/plan/#previewing-a-teardown).
:::

Destroy only removes objects from the managed schema, meaning anything in the database outside the scope of the project 
will be left untouched. The state store is refreshed after the teardown.

## Options

- **`-y`, `--auto-approve`** — skip the confirmation prompt. Required for non-interactive runs.
- **`--no-lock`** — skip taking the state-store lock for this run. Use it only when you've coordinated access by 
  other means (for example you already hold the lock via [`nschema lock acquire`](/cli/commands/lock-acquire/)).
- **`--ephemeral`** — run against an in-memory state store discarded when the command exits. See
  [Ephemeral state](/guides/state/#ephemeral-state).

To tear down part of a project rather than all of it, remove the declarations and [`apply`](/cli/commands/apply/), or 
preview a partial teardown with [`plan --destroy --scope`](/cli/commands/plan/#previewing-a-teardown).

Like a declined [`apply`](/cli/commands/apply/), a declined `destroy` makes no changes and exits `1`.
