---
title: Backends
description: NSchema's optional state backend .
sidebar:
  order: 10
slug: 3/backends/overview
---

A backend is the optional place NSchema persists a snapshot of the last applied schema. It's declared in a `BACKEND`
[config block](/v3/cli/configuration/), and it's what enables:

* **[Offline planning](/v3/guides/state/).** Run `plan` against the recorded snapshot, with out a database connection;
* **[Drift detection](/v3/guides/drift/).** Detect out-of-band changes in your deployed database schema;
* **[The `show` command](/v3/cli/commands/show/)** To inspect the recorded schema.

A backend is optional: with no `BACKEND` block, NSchema plans against the live [provider](/v3/providers/) every time.
See [Offline planning & state](/v3/guides/state/) for when you want one.

## Available backends

| Backend    | Page                          |
|------------|-------------------------------|
| Local file | [Local file](/v3/backends/file/) |
| Amazon S3  | [Amazon S3](/v3/backends/s3/)    |

## Locking

NSchema locks the backend during write operations ([`apply`](/v3/cli/commands/apply/), [`destroy`](/v3/cli/commands/destroy/), [`refresh`](/v3/cli/commands/refresh/))
so concurrent runs can't corrupt the recorded state. If a run is interrupted and leaves a stale lock behind, clear it
with [`force-unlock`](/v3/cli/commands/force-unlock/) once you're sure no operation is still running.

This applies to every backend; the lock lives alongside the state it protects.
