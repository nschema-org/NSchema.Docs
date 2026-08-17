---
title: Running in CI
description: Patterns for running NSchema in a continuous integration environment.
sidebar:
  order: 70
---

NSchema is built to run unattended and be easy to automate. A few things facilitate this: 
- a strict [exit-code contract](/cli/exit-codes/),
- opt-in "did anything change?" signals, 
- planning against [recorded state](/guides/state/),
- built-in linting, validation and drift guardrails,
- and multiple output formats depending on whether the audience is a human or a machine.

## Always pass `--auto-approve` for applies

Write actions like [`apply`](/cli/commands/apply/) and [`destroy`](/cli/commands/destroy/) will prompt for confirmation
by default. When running in a non-interactive terminal, like in a build pipeline, `nschema` will exit `1` and make no changes, unless the `--auto-approve` flag is specified,
this helps protect against executing changes unintentionally:

```sh
nschema apply --auto-approve
```

## Supply secrets through the environment

While the `DATABASE` statement supports setting the connection string and password directly, it is _strongly_ recommended to
provide them via environment variables instead. Connection strings don't belong in source control:

```sh
export NSCHEMA_DATABASE_CONNECTION_STRING="$DB_CONNECTION_STRING"
# optionally, credentials out of band:
export NSCHEMA_DATABASE_USERNAME="$DB_USER"
export NSCHEMA_DATABASE_PASSWORD="$DB_PASSWORD"
```

See [Environment variables](/cli/environment-variables/).

## Commit the lockfile

Database providers and state stores are [plugins](/cli/configuration/#plugins), resolved from the versions your `PLUGIN` statements declare and 
pinned in `nschema.lock`. In CI that means:

- **Check `nschema.lock` in.** It's what makes `nschema init` resolve consistently between runs.
- The agent needs the .NET SDK and network access to your NuGet feed (the restore shells out to `dotnet`).
- Run `nschema init` up front to fail fast, then pass `--no-init` to later commands to skip the restore.

## Gate a pull request on changes

The `plan` command always exits `0` by default unless there was an error. If you opt in with`--detailed-exitcode`, 
NSchema will return `2` when there are changes, so a check can fail (or comment) when a PR alters the schema:

```sh
nschema plan --detailed-exitcode    # 0 = no changes, 2 = changes, 1 = error
```

The plan is computed from recorded [state](/guides/state/), so the runner needs the state store, but never reads the
live database.

## Enforce formatting

Fail the build if any project file isn't canonically formatted:

```sh
nschema format --check    # exits 2 if files need formatting, 1 on error
```

## Validate schema files fast

A quick, database-free correctness check, checks syntax and some basic structural checks like missing references or 
empty tables:

```sh
nschema validate
```

## Plan now, apply later

The safest pipeline splits planning from applying: by saving the plan output, you can `apply` that file at a later time, so you guarantee what runs.

```sh
# in the PR pipeline:
nschema plan --out migration.nplan
# upload migration.nplan as a build artifact, review it...

# in the deploy pipeline, after approval:
nschema apply --plan-file migration.nplan --auto-approve
```

## Disposable databases

Although a state store is required, there will be occasions where you need to spin up and deploy a schema to a temporary
database, like during integration tests. For these, you can use [`--ephemeral`](/guides/state/#ephemeral-state) flag 
instead of configuring a `STATE` store:

```sh
nschema apply --ephemeral --auto-approve
```

## Monitor for drift on a schedule

A scheduled job can alert when the live database diverges from recorded state:

```sh
nschema drift --detailed-exitcode    # 2 = drift detected
```

See [Detecting drift](/guides/drift/).

## Exit codes, summarized

| Code  | Meaning                                                           |
|-------|-------------------------------------------------------------------|
| `0`   | Success / no changes.                                             |
| `1`   | Error, or a declined `apply`/`destroy`.                           |
| `2`   | Changes present, from `--detailed-exitcode` and `format --check`. |
| `130` | Cancelled (Ctrl-C).                                               |

See the [full exit-code contract](/cli/exit-codes/).
