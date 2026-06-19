---
title: Destructive-action safety
description: How NSchema guards against accidental data loss, and how to opt into destructive changes when you mean them.
---

NSchema treats **destructive changes** — dropping a table, dropping a column, and similar
data-losing operations — with care. By default, a plan that contains one is an **error**, so
you can't accidentally apply it.

## The policy

The destructive-action policy has three settings:

| Value | Behaviour |
| ----- | --------- |
| `error` (default) | A destructive change fails the run. Nothing is applied. |
| `warn` | A destructive change is reported as a warning, but the run continues. |
| `allow` | Destructive changes are applied without warning. |

## Setting it

Set the policy in any of the three [configuration layers](/cli/configuration/#precedence):

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

The flag applies to [`plan`](/cli/commands/plan/) and [`apply`](/cli/commands/apply/).

## Recommended approach

- **Keep the default `error`** for normal development and CI, so a destructive change never
  slips through unnoticed.
- When you *intend* a destructive change, make it deliberate: review the plan, then re-run that
  specific apply with `--destructive-actions allow` (or `warn`).
- Prefer **renames over drop+recreate** where you can. Using `RENAMED FROM` on a schema, table,
  or column tells the comparer to match the existing object instead of dropping it — preserving
  the data. See the [grammar reference](/ddl/grammar/).

## `destroy` is exempt

[`nschema destroy`](/cli/commands/destroy/) is purely destructive by design and is **not**
subject to this policy — it's the intended escape hatch for tearing a managed schema back down.
It still prompts for confirmation unless you pass `--auto-approve`.
