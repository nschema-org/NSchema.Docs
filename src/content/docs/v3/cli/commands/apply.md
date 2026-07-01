---
title: nschema apply
description: Compute the plan and apply it to the target database.
sidebar:
  label: apply
  order: 5
slug: v3/cli/commands/apply
---

Compute the plan and apply it to the target database. Prompts for confirmation before making changes unless `--auto-approve` is given.

```sh
nschema apply
nschema apply --plan-file tonight.nplan   # apply exactly what plan --out saved
```

:::note[Needs]
The same inputs as [`plan`](/v3/cli/commands/plan/), against a live database the tool can write to.
:::

:::caution[A declined apply fails loudly]
Answering anything but `yes`, or running without a terminal to prompt on (CI, a container) and without `--auto-approve`,
makes no changes and exits non-zero (`1`). This is deliberate: an automated apply that forgets `--auto-approve` fails
the step rather than silently doing nothing and reporting success. Always pass `--auto-approve` for unattended runs.
:::

## Options

`apply` accepts every [`plan`](/v3/cli/commands/plan/#options) option, plus:

* **`-y`, `--auto-approve`** — skip the confirmation prompt and apply immediately. Required for non-interactive runs (CI, ECS tasks).
* **`-p`, `--plan-file <path>`** — replay a plan saved by [`plan --out`](/v3/cli/commands/plan/), executing exactly that plan instead of computing
  a fresh one (Terraform's `apply <planfile>`). The saved plan already fixes its scope, desired schema, and destructive-action
  policy, so those inputs are ignored. A live database to write to is still required, and you're still prompted for
  confirmation unless `--auto-approve` is given.

## After a successful apply

If a [state store](/v3/guides/state/) is configured, the resulting schema is captured to it after a successful apply, so later offline
plans can run against that snapshot.

[Deployment scripts](/v3/guides/deployment-scripts/) (inline `PRE`/`POST DEPLOYMENT` blocks) run on every apply, before and after the migration respectively.
