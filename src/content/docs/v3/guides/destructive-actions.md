---
title: Destructive-action safety
description: How NSchema guards against accidental data loss, and how to opt
  into destructive changes when you mean them.
sidebar:
  order: 60
slug: v3/guides/destructive-actions
---

By default, NSchema will error on destructive actions like dropping a table or column, so you can't cause data to be lost
without opting in via the `--destructive-actions` option. It has three settings:

| Value             | Behaviour                                                             |
|-------------------|-----------------------------------------------------------------------|
| `error` (default) | A destructive change fails the run. Nothing is applied.               |
| `warn`            | A destructive change is reported as a warning, but the run continues. |
| `allow`           | Destructive changes are applied without warning.                      |

## Setting it

The destructive action policy can be set in any of the three [configuration layers](/v3/cli/configuration/#precedence):

```sql
-- in a config block (lowest precedence)
NSCHEMA (
  destructive_action = 'error'
);
```

```sh
# environment variable
export NSCHEMA_DESTRUCTIVE_ACTION_POLICY=warn
```

```sh
# command-line flag (highest precedence)
nschema apply --destructive-actions allow
```

The option applies to both [`plan`](/v3/cli/commands/plan/) and [`apply`](/v3/cli/commands/apply/).

## Recommendations

* **Keep the default `error`** for normal development and CI, so a destructive change never slips through unnoticed.
* When you *intend* a destructive change, make it explicit: review the plan, then re-run that specific apply with `--destructive-actions allow` (or `warn`).
* Prefer **renames over drop+recreate** where you can. Using `RENAMED FROM` tells the comparer to match the existing object instead of dropping it. See the [grammar reference](/v3/ddl/grammar/).

## `destroy` is exempt

[`nschema destroy`](/v3/cli/commands/destroy/) is destructive by design and is **not** protected by this policy, although it does still require
the `--auto-approve` flag.
