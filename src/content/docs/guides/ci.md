---
title: Running in CI
draft: true
description: Patterns for running NSchema in continuous integration — non-interactive applies, exit-code gating, and offline planning.
---

NSchema is built to run unattended. A few things make it CI-friendly: a strict
[exit-code contract](/cli/exit-codes/), opt-in "did anything change?" signals, and
[offline planning](/guides/state/) that needs no database at plan time.

## Always pass `--auto-approve` for applies

[`apply`](/cli/commands/apply/) and [`destroy`](/cli/commands/destroy/) prompt for confirmation
by default. With no interactive terminal — as in CI — a run **without** `--auto-approve` makes
no changes and exits `1`, so a forgotten flag fails the step loudly rather than silently doing
nothing:

```sh
nschema apply --auto-approve
```

## Supply secrets through the environment

Put the connection string (and, if your platform splits them out, credentials) in CI secrets,
not in committed config:

```sh
export NSCHEMA_POSTGRES_CONNECTION_STRING="$DB_CONNECTION_STRING"
# optionally, credentials out of band:
export NSCHEMA_POSTGRES_USERNAME="$DB_USER"
export NSCHEMA_POSTGRES_PASSWORD="$DB_PASSWORD"
```

See [Environment variables](/cli/environment-variables/).

## Gate a pull request on "would this change the schema?"

`plan` exits `0` by default even when there are changes. Add `--detailed-exitcode` to get the
`2`-means-changes signal, so a check can fail (or comment) when a PR alters the schema:

```sh
nschema plan --detailed-exitcode    # 0 = no changes, 2 = changes, 1 = error
```

Pair it with a state store so this runs **without a database connection** — see
[Offline planning & state](/guides/state/).

## Enforce formatting

Fail the build if any `.sql` file isn't canonically formatted:

```sh
nschema fmt --check    # exits 2 if files need formatting, 1 on error
```

## Validate schema files fast

A quick, database-free correctness check, good as an early CI step:

```sh
nschema validate
```

## Review now, apply later

The safest pipeline splits planning from applying: compute and **save** a plan during review,
then apply that **exact** file after approval — so what was reviewed is what runs.

```sh
# in the PR pipeline:
nschema plan --out migration.nplan
# upload migration.nplan as a build artifact, review it...

# in the deploy pipeline, after approval:
nschema apply --plan-file migration.nplan --auto-approve
```

The saved plan fixes its own scope, schema, and destructive-action policy, so the deploy step
doesn't even need the `.sql` files — only a live database to write to.

## Monitor for drift on a schedule

A scheduled job can alert when the live database diverges from recorded state:

```sh
nschema drift --detailed-exitcode    # 2 = drift detected
```

See [Detecting drift](/guides/drift/).

## Exit codes, summarised

| Code | Meaning |
| ---- | ------- |
| `0` | Success / no changes. |
| `1` | Error, or a declined `apply`/`destroy`. |
| `2` | Changes present — only from `--detailed-exitcode` and `fmt --check`. |
| `130` | Cancelled (Ctrl-C). |

See the [full exit-code contract](/cli/exit-codes/).
