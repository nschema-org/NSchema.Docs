---
title: Versioning & compatibility
description: How NSchema's packages are versioned and which versions work together.
sidebar:
  order: 3
---

NSchema ships as several independently versioned NuGet packages rather than one monolith. This page explains what the 
version numbers mean and how the pieces fit together.

## The packages

| Package             | Role                                             |
|---------------------|--------------------------------------------------|
| `NSchema`           | The `nschema` CLI / .NET global tool.            |
| `NSchema.Core`      | The provider-agnostic engine (also the library). |
| `NSchema.Postgres`  | PostgreSQL provider.                             |
| `NSchema.SqlServer` | SQL Server provider.                             |
| `NSchema.Sqlite`    | SQLite provider.                                 |
| `NSchema.Aws`       | S3-backed state backend.                         |

Everything depends on `NSchema.Core`; the providers and backends plug into it, and the CLI bundles a compatible set together.

## Versioning policy

NSchema follows [Semantic Versioning](https://semver.org/): given `MAJOR.MINOR.PATCH`,

- **PATCH** releases are backwards-compatible bug fixes.
- **MINOR** releases add functionality in a backwards-compatible way.
- **MAJOR** releases may contain breaking changes.

## Which versions work together

Any packages with the same `MAJOR` version number should be compatible. `NSchema.Core` follows strict semantic versioning,
while all the other packages keep their major version in sync. If you're using the CLI, you don't have to worry about this.
See [Installation](/start/installation/). If you're embedding the engine directly, see [embedding](/library/embedding/).
