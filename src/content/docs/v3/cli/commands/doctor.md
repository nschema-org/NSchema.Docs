---
title: nschema doctor
description: Check that the configured database and state store are reachable and healthy.
sidebar:
  label: doctor
  order: 11
slug: v3/cli/commands/doctor
---

Run read-only health checks against the infrastructure your project declares, and report the outcome of each. It's a quick
way to diagnose issues if you're having problems, or just as a peace of mind check before running migrations.

```sh
nschema doctor
```

It checks:

* **Database connectivity** — opens the `PROVIDER` connection and introspects the live schema.
* **State store** — reads the `BACKEND` store and confirms the recorded snapshot still deserializes.
* **State lock** — reads the lock, reporting whether it is free or who currently holds it.

Sample output:

```text
Running diagnostics...
✔ Database: connected (3 schemas visible).
✔ State store: reachable, recorded state is valid.
✔ State lock: free.
✔ All checks passed.
```

:::note[Needs]
At least one of a live database (a `PROVIDER` block) or a state store (a `BACKEND file` / `BACKEND s3` block). A project
that declares neither has nothing to check and is rejected.
:::

## Exit code

`doctor` exits `0` when every configured check passes and `1` when any check fails (an unreachable database, an
unreachable or corrupt state store), so CI can gate on it: `nschema doctor && nschema apply`. A lock that is currently
**held** is reported but does **not** fail the check — it is a state, not a misconfiguration. See the
[exit-code contract](/v3/cli/exit-codes/).
