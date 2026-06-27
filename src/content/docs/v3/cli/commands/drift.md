---
title: nschema drift
description: Check whether the live database has drifted from the recorded state.
sidebar:
  label: drift
  order: 10
slug: v3/cli/commands/drift
---

Check whether the live database has drifted from the recorded state, reporting the difference as a diff that answers
"what has been done to this database outside of NSchema?".

```sh
nschema drift
nschema drift --detailed-exitcode   # CI/monitoring: exit 2 if the database has drifted
```

:::note[Needs]
A live database (a `PROVIDER postgres` block) **and** a state store to compare against (a `BACKEND file` or `BACKEND s3` block).
:::

## Options

* **`-s`, `--scope <name>`** — limit the check to specific namespaces. May be repeated.
* **`--detailed-exitcode`** — return a [detailed exit code](/v3/cli/exit-codes/): `0` when there is no drift, `2` when the live database
* has drifted (errors stay `1`), so a monitoring job can gate on it. Without it, `drift` exits `0` and you read the diff it prints.

See [Detecting drift](/v3/guides/drift/) for how to use this in monitoring.
