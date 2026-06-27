---
title: nschema destroy
description: Drop all managed schema objects from the target database.
sidebar:
  label: destroy
  order: 8
slug: 3/cli/commands/destroy
---

Drop all managed schema objects from the target database. Prompts for confirmation before making changes unless `--auto-approve` is given.

```sh
nschema destroy
```

:::danger[Purely destructive]
`destroy` is purely destructive and is **exempt** from the[destructive-action policy](/v3/guides/destructive-actions/). To preview exactly what it
would drop without running it, use [`plan --destroy`](/v3/cli/commands/plan/#previewing-a-teardown).
:::

:::note[Needs]
A live database (a `PROVIDER postgres` block) the tool can write to, **and** a source for the schema to tear down, a
configured state store (`BACKEND file` or `BACKEND s3`), or, with no store, your `*.sql` files to fall back on.
:::

When a state store is configured it is refreshed after the teardown.

## Options

* **`-s`, `--scope <name>`** — limit the teardown to specific namespaces. May be repeated.
* **`-y`, `--auto-approve`** — skip the confirmation prompt. Required for non-interactive runs.

Like a declined [`apply`](/v3/cli/commands/apply/), a declined `destroy` makes no changes and exits `1`.
