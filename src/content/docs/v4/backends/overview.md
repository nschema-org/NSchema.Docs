---
title: Backends
description: NSchema's optional state backend .
slug: v4/backends
sidebar:
  order: 10
---

A backend is the optional place NSchema persists a snapshot of the last applied schema. It's declared in a `BACKEND`
[config block](/v4/cli/configuration/), and it's what enables:

* **[Offline planning](/v4/guides/state/).** Run `plan` against the recorded snapshot, with out a database connection;
* **[Drift detection](/v4/guides/drift/).** Detect out-of-band changes in your deployed database schema;
* **[The `state show` command](/v4/cli/commands/state-show/)** To inspect the recorded schema.

A backend is optional: with no `BACKEND` block, NSchema plans against the live [provider](/v4/providers/) every time.
See [Offline planning & state](/v4/guides/state/) for when you want one.

## Available backends

| Backend    | Page                          |
|------------|-------------------------------|
| Local file | [Local file](/v4/backends/file/) |
| Amazon S3  | [Amazon S3](/v4/backends/s3/)    |

## Locking

NSchema locks the backend during write operations ([`apply`](/v4/cli/commands/apply/), [`destroy`](/v4/cli/commands/destroy/), [`refresh`](/v4/cli/commands/refresh/))
so concurrent runs can't corrupt the recorded state. If a run is interrupted and leaves a stale lock behind, clear it
with [`lock release`](/v4/cli/commands/lock-release/) once you're sure no operation is still running.

This applies to every backend; the lock lives alongside the state it protects.
