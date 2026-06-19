---
title: The plan / apply workflow
description: The day-to-day NSchema loop — edit your schema, preview the plan, apply it — plus scoping and saved plans.
---

The core of working with NSchema is a short loop, the same shape as Terraform's:

1. **Edit** your desired schema — the `*.sql` files under your project.
2. **Plan** — `nschema plan` shows exactly what would change, without touching the database.
3. **Apply** — `nschema apply` shows the plan again, asks for confirmation, then executes it.

```sh
# edit schemas/*.sql ...
nschema plan
nschema apply
```

Because the plan is always computed and shown before anything runs — even `apply` recomputes
and displays it first — you never apply blind.

## Scoping a run

Limit a run to specific database schemas (namespaces) with `--scope`, repeatable. Useful for
deploying parts of a system independently:

```sh
nschema plan --scope app
nschema apply --scope app --scope billing
```

Declarations and drops for schemas outside the scope are ignored, so unmanaged schemas are
never touched.

## Saved plans: review now, apply later

Save the computed plan to a file and apply that exact file later, so what was reviewed is
exactly what runs. This is the pattern for separating planning from applying — for example,
plan in a pull request and apply after approval:

```sh
nschema plan --out tonight.nplan      # compute and save
# ... review tonight.nplan, get approval ...
nschema apply --plan-file tonight.nplan   # apply exactly that, no re-plan
```

The saved plan fixes its own scope, desired schema, and destructive-action policy, so those
inputs are ignored on apply — and the `*.sql` files needn't even be present. A live database
to write to is still required.

## Previewing changes in CI without a database

If you've configured a [state store](/guides/state/), `plan` can run **offline** against the
last recorded snapshot — no database connection needed. Combine that with
`--detailed-exitcode` to gate CI on whether a change would occur:

```sh
nschema plan --detailed-exitcode    # exit 2 if the schema would change, 0 if not
```

See [Running in CI](/guides/ci/) for the full pipeline pattern.

## Tearing down

To preview or execute a teardown of the managed schema, see
[`plan --destroy`](/cli/commands/plan/#previewing-a-teardown) and
[`destroy`](/cli/commands/destroy/).
