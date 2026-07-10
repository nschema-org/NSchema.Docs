---
title: script
description: Inspect and manage the run-once script executions recorded in the state.
sidebar:
  order: 10.53
---

Top-level group for commands that manage the [run-once script](/guides/deployment-scripts/#run-conditions) executions
recorded in the [state store](/guides/state/). A `RUN ONCE` script is recorded on a successful apply and skipped by
later plans; these subcommands are how you inspect and correct that ledger, forcing a script to run again, or marking
one as run without running it.

`script` is a group — run it with one of the subcommands below. On its own, `nschema script` just prints this list.

- **[`script list`](/cli/commands/script-list/)** — show the recorded executions.
- **[`script hash`](/cli/commands/script-hash/)** — compute the body hash of the project's run-once declarations.
- **[`script taint`](/cli/commands/script-taint/)** — remove a recorded execution, so the script runs again.
- **[`script untaint`](/cli/commands/script-untaint/)** — record a script as executed without running it.

:::note[Needs]
A state store (a `BACKEND` block); the ledger lives in it. The live database is never contacted.
:::
