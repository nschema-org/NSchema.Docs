---
title: State backends
description: Configure where NSchema persists its state snapshot — a local file or Amazon S3.
---

A **backend** is the optional state store where NSchema persists a snapshot of the last
applied schema. It's what enables [offline planning](/guides/state/) (planning without a
database connection), [drift detection](/guides/drift/), and [`show`](/cli/commands/show/).
Declare it with a `BACKEND` [config block](/cli/configuration/).

A backend is optional: with no `BACKEND` block, NSchema plans against the live database every
time. See [Offline planning & state](/guides/state/) for when you want one.

## Local file

Persists state to a JSON file on the local filesystem. Good for a single operator or for
checking state into source control.

```sql
BACKEND file (
  path = './nschema.state.json'
);
```

| Attribute | Type | Description |
| --------- | ---- | ----------- |
| `path` | string | Path to the state file. Relative paths resolve against the project directory ([`--directory`](/cli/#global-flags)). |

## Amazon S3

Persists state to an object in an S3 bucket — the shared backend for a team or CI, where many
runners need a single source of truth.

```sql
BACKEND s3 (
  bucket = 'my-bucket',
  key = 'env/state.json'
);
```

| Attribute | Type | Description |
| --------- | ---- | ----------- |
| `bucket` | string | The S3 bucket that holds the state object. |
| `key` | string | The S3 object key for the state file within the bucket. |

AWS credentials and region are resolved through the standard AWS SDK chain (environment
variables, shared config/credentials files, instance/role profiles), so they're not part of
the block.

Any attribute not listed for a backend is rejected — a typo surfaces as an error.

## State locking

NSchema locks the state during write operations ([`apply`](/cli/commands/apply/),
[`destroy`](/cli/commands/destroy/), [`refresh`](/cli/commands/refresh/)) so concurrent runs
can't corrupt it. If a run is interrupted and leaves a stale lock behind, clear it with
[`force-unlock`](/cli/commands/force-unlock/) — once you're sure no operation is still
running.
