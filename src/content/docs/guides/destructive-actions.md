---
title: Destructive-action safety
description: How NSchema guards against accidental data loss, and how to opt into destructive changes when you mean them.
sidebar:
  order: 60
---

By default, NSchema will error on destructive actions like dropping a table or column, so you can't cause data to be lost
without opting in via the `--destructive-actions` option:

| Value             | Behaviour                                                             |
|-------------------|-----------------------------------------------------------------------|
| `error` (default) | A destructive change fails the run. Nothing is applied.               |
| `warn`            | A destructive change is reported as a warning, but the run continues. |
| `allow`           | Destructive changes are applied, with an informational note.          |
| `ignore`          | The policy doesn't run at all; nothing is reported (not recommended). |

## Setting it

The destructive action policy is set by an environment variable or the command-line flag (the flag wins).

```sh
# environment variable
export NSCHEMA_DESTRUCTIVE_ACTION_POLICY=warn
```

```sh
# command-line flag (highest precedence)
nschema apply --destructive-actions allow
```

The option applies to both [`plan`](/cli/commands/plan/) and [`apply`](/cli/commands/apply/).

## Recommendations

- **Keep the default `error`** for normal development and CI, so a destructive change never slips through unnoticed.
- When you _intend_ a destructive change, make it explicit: review the plan, then re-run that specific apply with `--destructive-actions allow` (or `warn`).
- Prefer **renames over drop+recreate** where you can. A [`RENAME` directive](/nsql/grammar/#directives) tells the comparer to match the existing object instead of dropping it.

## Related: data hazards

Destructive-action safety guards changes that succeed and lose data. Its counterpart, [data-hazard
detection](/guides/data-hazards/), warns about changes that can fail on the data already in a table, like adding a
`NOT NULL` column without a default.

## Teardowns

A teardown is fully destructive, so the default `error` policy **blocks** it. Pass `--destructive-actions allow` to plan
one you intend to run.

[`nschema destroy`](/cli/commands/destroy/) sets the policy to `allow` for you — destruction is the whole point of the
command, so its guard is the confirmation prompt (or `--auto-approve`) rather than the policy.
