---
title: Detecting drift
description: Use nschema drift to find out whether the live database has
  diverged from the recorded state.
sidebar:
  order: 40
slug: 3/guides/drift
---

Drift is when the live database no longer matches NSchema's latest snapshot in the state store. This happens when people
make manual schema changes outside of NSchema, and it can cause data loss if not handled carefully. The [`nschema drift`](/v3/cli/commands/drift/)
command helps detect it.

## How it works

`drift` compares the latest backend state snapshot against the **live database** and outputs the difference. The diff
answers "what has been changed outside of NSchema?":

* an out-of-band **addition** appears as an add;
* a manual **drop** appears as a remove.

```sh
nschema drift
```

:::note[Needs]
A live database **and** a [state store](/v3/guides/state/) to compare against. If you don't have one configured, see [Offline planning & state](/v3/guides/state/).
:::

## Gating a monitor on drift

For a scheduled monitoring job, add `--detailed-exitcode` so the command's exit code becomes `0` for no drift, `2` for drift (errors stay `1`):

```sh
nschema drift --detailed-exitcode
```

## Reconciling drift

Once you've reviewed the drift, you can choose to either adopt the drift using [`refresh`](/v3/cli/commands/refresh/), then
updating your `.sql` files to match, or you can revert the drift using [`apply`](/v3/cli/commands/apply/) to bring the
database back in line with your declared desired state.
