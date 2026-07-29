---
title: Versioning & compatibility
description: How NSchema's packages are versioned and which versions work together.
sidebar:
  order: 3
---

NSchema ships as several independently versioned NuGet packages rather than one monolith. This page explains what the 
version numbers mean and how the pieces fit together.

## The packages

| Package             | Role                                  |
|---------------------|---------------------------------------|
| `NSchema`           | The `nschema` CLI / .NET global tool. |
| `NSchema.Core`      | The provider-agnostic engine.         |
| `NSchema.Postgres`  | PostgreSQL provider.                  |
| `NSchema.SqlServer` | SQL Server provider.                  |
| `NSchema.Sqlite`    | SQLite provider.                      |
| `NSchema.Aws`       | S3-backed state store.                |

Everything depends on `NSchema.Core`; the providers and state stores plug into it, and the CLI loads the ones your
project declares.

## Versioning policy

NSchema follows [Semantic Versioning](https://semver.org/): given `MAJOR.MINOR.PATCH`,

- **PATCH** releases are backwards-compatible bug fixes.
- **MINOR** releases add functionality in a backwards-compatible way.
- **MAJOR** releases may contain breaking changes.

## Which versions work together

Any packages with the same `MAJOR` version number should be compatible. `NSchema.Core` follows strict semantic versioning,
while all the other packages keep their major version in sync, so a `5.x` CLI runs `5.x` plugins.

Pinning is handled by your `PLUGIN` declarations and [`nschema.lock`](/cli/configuration/#the-lockfile). See [Installation](/start/installation/).

## The state format

The recorded [state](/guides/state/) payload has its own compatibility rules, which are part of this contract: within a
major version the format only changes additively, and a payload from a newer major is refused rather than misread. See
[State format and compatibility](/guides/state/#state-format-and-compatibility).
