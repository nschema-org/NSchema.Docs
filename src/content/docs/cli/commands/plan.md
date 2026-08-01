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

## Options

- **`-s`, `--scope <address>`** — limit the plan to a schema (`app`) or object (`app.orders`). May be repeated.
- **`--destructive-actions <error|warn|allow|ignore>`** — policy for destructive changes. Defaults to `error`.
  *(env `NSCHEMA_DESTRUCTIVE_ACTION_POLICY`)* See [Destructive-action safety](/guides/destructive-actions/).
- **`--data-hazards <error|warn|allow|ignore>`** — policy for changes that can fail on the data already in a table. 
  Defaults to `warn`. *(env `NSCHEMA_DATA_HAZARD_POLICY`)* See [Data hazards](/guides/data-hazards/).
- **`--destroy`** — preview the plan that [`destroy`](/cli/commands/destroy/) would run to tear the managed schema down.
- **`-o`, `--out <path>`** — write the computed plan to a file so it can be replayed later by [`apply --plan-file`](/cli/commands/apply/). 
  Works with `--destroy` too, saving the teardown plan.
- **`--detailed-exitcode`** — return a [detailed exit code](/cli/exit-codes/): `0` when there are no changes, `2` when the plan has 
  changes (errors stay `1`), so CI can gate on "does this change the schema?" without parsing output. Without it, `plan` exits `0` even when there are changes.
- **`--ephemeral`** — plan against an in-memory state store that is discarded when the command exits, instead of a
  configured `STATE` store. For CI runs against a disposable database. See [Ephemeral state](/guides/state/#ephemeral-state).

## Scoping to an object

`--scope` takes an **address**: a schema, an object, or several of either.

```sh
nschema plan --scope app                               # the whole app schema
nschema plan --scope app.orders                        # one table
nschema plan --scope app.orders --scope app.customers  # use them in combination
nschema plan --scope '"my.schema"."Order Details"'     # quoted segments may carry dots and spaces
```

Addresses are read under the [NSQL identifier rules](/nsql/grammar/#identifiers). A scoped plan covers the addressed 
objects and everything beneath them.

## Planning is always offline

A plan compares the **recorded state** against your project. If the database has changed underneath you, that shows up as
[drift](/guides/drift/). You can run [`refresh`](/cli/commands/refresh/) to capture the live schema into state first, 
or [`drift`](/cli/commands/drift/) to see it.

The database is still required, because the plan's SQL is rendered by that provider's dialect.

## Saving a plan

Write the computed plan to a file and apply that exact file later, so what was reviewed is exactly what runs. Useful when 
planning and applying happen in separate steps (plan in a pull request, apply after approval):

```sh
nschema plan --out tonight.nplan
nschema apply --plan-file tonight.nplan
```

To render a saved plan back to the terminal before applying it, see [`plan show`](/cli/commands/plan-show/). See
[The plan / apply workflow](/guides/workflow/) for the full pattern.

## Previewing a teardown

With `--destroy` the command plans towards an empty schema rather than towards your project.

```sh
nschema plan --destroy
nschema plan --destroy --scope app.orders    # what tearing down one table would do
```

A teardown is fully destructive, so the default destructive-action policy **blocks** it. Pass `--destructive-actions allow` 
to see it unblocked. (`destroy` itself sets that policy to `allow` — its guard is the confirmation prompt.)
