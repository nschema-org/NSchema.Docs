---
title: The plan / apply workflow
description: "The core NSchema development workflow: editing the schema, previewing the plan, and applying it."
sidebar:
  order: 10
---

The core of working with NSchema is a short loop, the same shape as Terraform's and other declarative management tools:

1. **Edit.** Declare your desired schema in `*.sql` files under your project.
2. **Plan.** Use `nschema plan` to see exactly what would change, and what SQL would be executed.
3. **Apply.** Use `nschema apply` to execute the changes against the target database.

```sh
# edit schemas/*.sql ...
nschema plan
nschema apply
```

**Note:** You will still see the plan if you just run `apply`, but `plan` can run offline by planning against a snapshot
of your database instead of the live schema.

## Scoping a run

Monolithic databases are very common, so NSchema allows you to scope your deployments. By default, NSchema will only 
look at objects inside your referenced schemas: if your SQL files only reference a `customers` schema, changes in the 
`orders` schema will be ignored. This allows for smaller, partitioned deployments, but it does also make it possible to
deploy things out of order. If you try to delete a table from `customers` that `orders` was depending on, 
you're not going to have a good time.

You can limit a run to specific database schemas (namespaces) with the `--scope` argument:

```sh
nschema plan --scope app
nschema apply --scope app --scope billing
```

Declarations and drops for schemas outside the scope are ignored, so unmanaged schemas are never touched.

## Saved plans: review now, apply later

Running `plan` and `apply` separately creates a race condition where changes to the database between the two can cause 
the plan to change. While this can usually be mitigated through process and convention, sometimes more rigorous control
is needed. You can instead save the plan to a file, and apply it directly without recomputing. This makes it possible to
keep a verified audit trail of database changes. Here's an example:

```sh
nschema plan --out tonight.nplan          # compute and save
# ... review tonight.nplan, get approval ...
nschema apply --plan-file tonight.nplan   # apply exactly that, no re-plan
```

The saved plan fixes its own scope, desired schema, and destructive-action policy, so those inputs are ignored on apply.

## Previewing changes in CI without a database

If you've configured a [state store](/guides/state/), the `plan` command will run **offline** against the last recorded 
snapshot without needing a database connection. Combine that with `--detailed-exitcode` to gate CI on whether a change 
would occur:

```sh
nschema plan --detailed-exitcode    # exit 2 if the schema would change, 0 if not
```

See [Running in CI](/guides/ci/) for the full pipeline pattern.

## Tearing down

To preview or execute a teardown of the managed schema, see [`plan --destroy`](/cli/commands/plan/#previewing-a-teardown) and
[`destroy`](/cli/commands/destroy/).
