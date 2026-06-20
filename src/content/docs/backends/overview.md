---
title: Backends
draft: true
description: NSchema's optional state backend — what it's for, the backends available, and how it's configured.
---

A **backend** is the optional place NSchema persists a snapshot of the last applied schema. It's
declared in a `BACKEND` [config block](/cli/configuration/), and it's what enables:

- [**Offline planning**](/guides/state/) — `plan` against the recorded snapshot, with no
  database connection;
- [**Drift detection**](/guides/drift/) — comparing the live database against what was recorded;
- [**`show`**](/cli/commands/show/) — inspecting the recorded schema.

A backend is optional: with no `BACKEND` block, NSchema plans against the live
[provider](/providers/) every time. See [Offline planning & state](/guides/state/) for when you
want one.

## Available backends

| Backend    | Page                          |
|------------|-------------------------------|
| Local file | [Local file](/backends/file/) |
| Amazon S3  | [Amazon S3](/backends/s3/)    |

## On the roadmap

Additional backends (Azure Blob Storage) are planned — see the [roadmap](/reference/roadmap/).

## Locking

NSchema locks the backend during write operations ([`apply`](/cli/commands/apply/),
[`destroy`](/cli/commands/destroy/), [`refresh`](/cli/commands/refresh/)) so concurrent runs
can't corrupt the recorded state. If a run is interrupted and leaves a stale lock behind, clear
it with [`force-unlock`](/cli/commands/force-unlock/) — once you're sure no operation is still
running.

This applies to every backend; the lock lives alongside the state it protects.
