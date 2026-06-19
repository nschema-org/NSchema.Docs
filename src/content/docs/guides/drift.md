---
title: Detecting drift
description: Use nschema drift to find out whether the live database has diverged from the recorded state.
---

**Drift** is when the live database no longer matches what NSchema recorded — someone ran a
manual `ALTER`, a hotfix added an index, or a column was dropped out of band.
[`nschema drift`](/cli/commands/drift/) reports it.

## How it works

`drift` compares the **recorded state** against the **live database** and prints the difference
as a diff (recorded → live):

- an out-of-band **addition** appears as an add;
- a manual **drop** appears as a remove.

It's a pure observation — no transformers or policies run, so it never fails on a policy
violation. It just tells you what's different.

```sh
nschema drift
```

:::note[Needs]
A live database **and** a [state store](/guides/state/) to compare against. If you don't have a
state store yet, see [Offline planning & state](/guides/state/).
:::

## Gating a monitor on drift

For a scheduled monitoring job, add `--detailed-exitcode` so the command's exit status carries
the answer — `0` for no drift, `2` for drift (errors stay `1`):

```sh
nschema drift --detailed-exitcode
```

A simple cron/CI check:

```sh
if nschema drift --detailed-exitcode; then
  echo "In sync."
else
  case $? in
    2) echo "Drift detected!" ;;   # alert
    *) echo "drift check failed" ;;
  esac
fi
```

## Reconciling drift

Once you've reviewed the drift, you have two ways to reconcile:

- **Adopt the live changes** — capture the current database into the store with
  [`refresh`](/cli/commands/refresh/), then update your `.sql` files to match so future plans
  stay clean.
- **Revert to your schema** — run [`plan`](/cli/commands/plan/) / [`apply`](/cli/commands/apply/)
  to bring the database back in line with your declared desired state.
