---
title: State
description: NSchema's backend state store.
slug: state
sidebar:
  order: 10
---

The State store is where NSchema persists what it knows: a snapshot of the database, the set of objects it
[manages](/guides/state/#the-managed-set), and the ledger of scripts that have been executed. It's declared with a
`STATE` [statement](/cli/configuration/) block, and it facilitates offline planning and drift detection:

- **[Planning](/guides/state/).** Every plan diffs the recorded state against your project;
- **[Drift detection](/guides/drift/).** Detect out-of-band changes to your deployed database;
- **[The `state show` command](/cli/commands/state-show/)** To inspect the recorded schema.

A state store is required to plan, apply, or destroy. For a disposable database (like a CI run against a fresh container),
you can use the [`--ephemeral`](/guides/state/#ephemeral-state) flag instead. Internally, this constructs an in-memory
store and seeds it with the targeted database schema.

## Available stores

| Backend    | Package       | Page                       |
|------------|---------------|----------------------------|
| Local file | *(built in)*  | [Local file](/state/file/) |
| Amazon S3  | `NSchema.Aws` | [Amazon S3](/state/s3/)    |

## Locking

NSchema locks the backend during write operations ([`apply`](/cli/commands/apply/), [`destroy`](/cli/commands/destroy/), [`refresh`](/cli/commands/refresh/)) 
so concurrent runs can't corrupt the recorded state. If a run is interrupted and leaves a stale lock behind, clear it 
with [`lock release`](/cli/commands/lock-release/) once you're sure no operation is still running.

This applies to every backend; the lock lives alongside the state it protects.
