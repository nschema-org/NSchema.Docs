---
title: apply
description: Compute the plan and apply it to the target database.
sidebar:
  order: 6
---

Compute the plan and apply it to the target database. Prompts for confirmation before making changes unless `--auto-approve` is given.

```sh
nschema apply
nschema apply --plan-file tonight.nplan   # apply exactly what plan --out saved
```

:::caution[A declined apply fails loudly]
Answering anything but `yes`, or running without a terminal to prompt on (CI, a container) and without `--auto-approve`, 
makes no changes and exits non-zero (`1`). This is deliberate: an automated apply that forgets `--auto-approve` fails 
the step rather than silently doing nothing and reporting success. Always pass `--auto-approve` for unattended runs.
:::

## Options

`apply` accepts every [`plan`](/cli/commands/plan/#options) option except `--out`, `--destroy`, and
`--detailed-exitcode`, plus:

- **`-y`, `--auto-approve`** — skip the confirmation prompt and apply immediately. Required for non-interactive runs (CI, ECS tasks).
- **`-p`, `--plan-file <path>`** — replay a plan saved by [`plan --out`](/cli/commands/plan/), executing exactly that plan instead of computing 
  a fresh one (Terraform's `apply <planfile>`). The saved plan already fixes its scope and project, so those inputs are
  ignored. A live database to write to is still required, and you're still prompted for confirmation unless
  `--auto-approve` is given.
- **`--no-lock`** — skip taking the state-store lock for this run. Use it only when you've coordinated access by other 
  means (for example you already hold the lock via [`nschema lock acquire`](/cli/commands/lock-acquire/)).
- **`--ephemeral`** — run against an in-memory state store discarded when the command exits, instead of a configured
  `STATE` store. See [Ephemeral state](/guides/state/#ephemeral-state).

## Policies are re-run at apply

The [destructive-action](/guides/destructive-actions/) and [data-hazard](/guides/data-hazards/) policies are checked
again immediately before execution — including for `--plan-file`, so a saved plan cannot smuggle a blocked change past
them. The policy flags therefore still apply to a replayed plan.

## After a successful apply

The resulting schema is captured to the [state store](/guides/state/), along with the identities NSchema now
[manages](/guides/state/#the-managed-set) and any [run-once scripts](/guides/deployment-scripts/#run-conditions) that
ran.

[Deployment scripts](/guides/deployment-scripts/) (`SCRIPT … ON PRE|POST DEPLOYMENT` statements) run before and after the
migration respectively; change-event scripts run at the change they attach to.
