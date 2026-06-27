---
title: plan
description: Compute and show the migration plan, without changing anything.
sidebar:
  order: 5
---

Compute and show the migration plan, without changing anything.

```sh
nschema plan
nschema plan --out tonight.nplan       # save it to apply later
nschema plan --detailed-exitcode       # CI: exit 2 if the schema would change
```

:::note[Needs]
A desired schema (your `*.sql` files) **and** a current-state source: either a live database (a `PROVIDER postgres` block) 
or, for offline planning, a state store (a `BACKEND` block).

See [Configuration blocks](/cli/configuration/).
:::

## Options

- **`-s`, `--scope <name>`** — limit the migration to specific database schemas (namespaces). May be repeated.
- **`--destructive-actions <error|warn|allow>`** — policy for destructive changes. Defaults to `error`. *(NSCHEMA 
  env `NSCHEMA_DESTRUCTIVE_ACTION_POLICY`)* See [Destructive-action safety](/guides/destructive-actions/).
- **`--destroy`** — preview the SQL that [`destroy`](/cli/commands/destroy/) would run to tear the managed schema down.
- **`-o`, `--out <path>`** — write the computed plan to a file so it can be replayed later by [`apply --plan-file`](/cli/commands/apply/). 
  Works with `--destroy` too, saving the teardown plan.
- **`--detailed-exitcode`** — return a [detailed exit code](/cli/exit-codes/): `0` when there are no changes, `2` when the plan has 
  changes (errors stay `1`), so CI can gate on "does this change the schema?" without parsing output. Without it, `plan` exits `0` even when there are changes.

## Saving a plan

Write the computed plan to a file and apply that exact file later, so what was reviewed is exactly what runs. Useful when 
planning and applying happen in separate steps (plan in a pull request, apply after approval):

```sh
nschema plan --out tonight.nplan
nschema apply --plan-file tonight.nplan
```

To render a saved plan back to the terminal before applying it, see [`plan show`](/cli/commands/plan/show/). See
[The plan / apply workflow](/guides/workflow/) for the full pattern.

## Previewing a teardown

With `--destroy` the command previews a teardown rather than a forward migration. It takes the same inputs as [`destroy`](/cli/commands/destroy/):
a live database the teardown SQL is rendered against, and a managed-schema source (a configured state store, or a desired 
schema to fall back on), but only shows the SQL. `--scope` and `--destructive-actions` don't apply to a teardown and are
ignored.

```sh
nschema plan --destroy
```
