---
title: Exit codes
description: The exit-code contract every nschema command follows.
slug: v4/cli/exit-codes
---

Every command follows the same contract, so scripts and CI can branch on the result without parsing output:

| Code  | Meaning                                                                                                                                                                                                                                                                                             |
|-------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `0`   | **Success.** The command did what it set out to do.                                                                                                                                                                                                                                                 |
| `1`   | **Error.** Something failed: a bad config, a connection failure, a policy violation, or a *declined* [`apply`](/v4/cli/commands/apply/) / [`destroy`](/v4/cli/commands/destroy/) / [`lock release`](/v4/cli/commands/lock-release/).                                                                         |
| `2`   | **Positive signal.** Only from the *opt-in* checks: [`plan`](/v4/cli/commands/plan/) / [`drift`](/v4/cli/commands/drift/) / [`lock status`](/v4/cli/commands/lock-status/) with `--detailed-exitcode` (changes / drift / locked), and [`fmt --check`](/v4/cli/commands/fmt/). Never returned without opting in. |
| `130` | **Cancelled** with Ctrl-C (`SIGINT`).                                                                                                                                                                                                                                                               |

## `plan` and `drift` exit `0` by default, even when there are changes

The `2` exit code is **opt-in** via `--detailed-exitcode`, so `nschema plan && nschema apply` and pipelines that fail on
any non-zero code work as expected. Add the flag only where you want to gate on changes:

```sh
nschema plan --detailed-exitcode    # exit 2 if the schema would change
nschema drift --detailed-exitcode   # exit 2 if the database has drifted
```

### A declined `apply` / `destroy` exits `1`, not `0`

Answering anything but `yes`, or running with no interactive terminal (CI, a container) and without `--auto-approve`,
makes no changes and exits non-zero, so a forgotten `--auto-approve` fails the step instead of looking like a successful
no-op. Always pass `--auto-approve` for unattended runs.

See [Running in CI](/v4/guides/ci/) for putting these to work.
