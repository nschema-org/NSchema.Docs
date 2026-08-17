---
title: The plan / apply workflow
description: "The core NSchema development workflow: editing the schema, previewing the plan, and applying it."
sidebar:
  order: 10
---

The core of working with NSchema is a short loop, the same shape as Terraform's and other declarative management tools:

1. **Edit.** Declare your desired schema in `*.nsql` files under your project.
2. **Plan.** Use `nschema plan` to see exactly what would change, and what SQL would be executed.
3. **Apply.** Use `nschema apply` to execute the changes against the target database.

```sh
# edit schemas/*.nsql ...
nschema plan
nschema apply
```

**Note:** You will still see the plan if you just run `apply`. A plan is always computed against the recorded
[state](/guides/state/), so it never depends on reading the live database first.

## Scoping a run

Monolithic databases are very common, so NSchema supports multiple projects deploying to the same database. By default, 
NSchema will only look at objects inside your referenced schemas: if your SQL files only reference a `customers` schema, 
changes in the `orders` schema will be ignored. This allows for smaller, partitioned deployments, but it does also make 
it possible to deploy things out of order. If you try to delete a table from `customers` that `orders` was depending on, 
you're not going to have a good time.

Even within a single project/slice, sometimes you only want to do a partial deploy. The `--scope` argument narrows the scope
of a run to specific objects or schemas:

```sh
nschema plan --scope app                            # a whole schema
nschema apply --scope app.orders                    # one table
nschema apply --scope app --scope billing.invoices  # mix and match
```

A scope covers the addressed object and everything beneath it, so `--scope app` covers every object in `app`, and
`--scope app.orders` covers that table's columns, constraints, and indexes. Addresses follow the [NSQL identifier rules](/nsql/grammar/#identifiers), 
so a name that needs quoting in your schema needs quoting on the command line too:

```sh
nschema plan --scope '"my.schema"."Order Details"'
```

Things can get tricky when planning scoped changes. Dependencies can exist in the form of foreign keys, views, types, etc. 
and the "safe" way to react to those dependencies changes depending on whether you're creating or destroying an object. 
The two rules that guide how those different scenarios are handled are:  

1. **The plan should always be runnable.**
   A plan that can't be run isn't helpful to anyone. If I wanted invalid SQL, I could just make my dog write it. If I had a dog.
   Users are hopefully smart enough to know what they want, so a plan should tell them what it'll take to get there, and
   the consequences of doing so. That way the user can make the judgment call.

2. **Never destroy data.**
   Everyone makes mistakes. A missing foreign key is much easier to repair than a dropped column. Any action that could
   result in the destruction of data must be explicit and opt-in.

Here are two scenarios that demonstrate the outcome of those rules:

1. Creating a table with a foreign key, where the target of the foreign key does not exist, will just not create the foreign key.
2. Dropping a table that is the target of a foreign key will also drop the foreign key.

If a plan ever produces something that doesn't line up, or something that can't work, like dropping a domain without dropping
the columns that use it, you'll see a warning or an error in the output, so you'll never be taken by surprise.

## Saved plans: review now, apply later

Running `plan` and `apply` separately creates a race condition where changes to the database between the two can cause 
the plan to change. While this can usually be mitigated through process and convention, sometimes more rigorous control
is needed. You can instead save the plan to a file, and apply it directly without recomputing. This makes it possible to
keep the plan as an artifact for auditing and traceability. Here's an example:

```sh
nschema plan --out tonight.nplan          # compute and save
# ... review tonight.nplan, get approval ...
nschema apply --plan-file tonight.nplan   # apply exactly that, no re-plan
```

A plan file must remain entirely self-contained, so it cannot be re-scoped. [Policies](/guides/destructive-actions/) are still enforced when 
applying from a saved plan, so an older plan is still held to the latest policy standards. 

## Previewing changes in CI

The `plan` command reads the recorded [state](/guides/state/), not the live database, so a CI runner needs only access to
the state store. While the state file itself only needs readonly access, the runner will also need write access to the 
state lockfile, unless you run with `--no-lock` (not recommended).

Combine it with `--detailed-exitcode` to gate CI on whether a change would occur:

```sh
nschema plan --detailed-exitcode    # exit 2 if the schema would change, 0 if not
```

See [Running in CI](/guides/ci/) for the full pipeline pattern.

## Tearing down

To preview or execute a teardown of the managed schema, see [`plan --destroy`](/cli/commands/plan/#previewing-a-teardown) and
[`destroy`](/cli/commands/destroy/).
