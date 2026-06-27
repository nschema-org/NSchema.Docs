---
title: Contributing
description: How NSchema is organised across repositories and how to contribute
  code, docs, or ideas.
sidebar:
  order: 4
slug: 3/project/contributing
---

Contributions are welcome, whether it's a bug report, documentation fix, new provider, or just an idea, I'll be happy to
hear about it.

## The repositories

NSchema is split across several repositories under the [`nschema-org`](https://github.com/nschema-org) organisation.
Knowing which repo owns what saves everyone time when filing issues or opening pull requests:

| Repository                                                              | Role                                                                                       |
|-------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|
| [`NSchema`](https://github.com/nschema-org/NSchema)                     | The `nschema` CLI / .NET global tool; a thin front-end over the core.                      |
| [`NSchema.Core`](https://github.com/nschema-org/NSchema.Core)           | The engine and library: schema model, DDL parser, diff, planner, state. Provider-agnostic. |
| [`NSchema.Postgres`](https://github.com/nschema-org/NSchema.Postgres)   | PostgreSQL provider.                                                                       |
| [`NSchema.SqlServer`](https://github.com/nschema-org/NSchema.SqlServer) | SQL Server provider.                                                                       |
| [`NSchema.Sqlite`](https://github.com/nschema-org/NSchema.Sqlite)       | SQLite provider.                                                                           |
| [`NSchema.Aws`](https://github.com/nschema-org/NSchema.Aws)             | S3-backed state backend.                                                                   |
| [`NSchema.Build`](https://github.com/nschema-org/NSchema.Build)         | The build/release pipeline that versions and publishes the packages.                       |
| [`NSchema.Docs`](https://github.com/nschema-org/NSchema.Docs)           | This documentation site.                                                                   |

The dependency direction is one-way: providers, backends, and the CLI depend on `NSchema.Core`; Core depends on none of
them. A change to engine behavior usually means a change in `NSchema.Core` first.

## Where to put a change

* **Found a bug or want a feature?** Open an issue in the most relevant repo above (see [Getting help & reporting issues](/v3/project/support/)).
  If you're not sure which repo, the CLI repo is fine too, and we can just move it later.
* **Fixing or improving the docs?** Every page has an "Edit page" link at the bottom that takes you straight to the source
  in [`NSchema.Docs`](https://github.com/nschema-org/NSchema.Docs).
* **Writing code?** For anything non-trivial, please get in touch with me or open an issue first, so we can agree on an
  approach before you do any work on it.

## Working with the code

Each repository's `README.md` describe how to build and test that specific package. A few conventions
hold across all of them:

* **.NET 10.0** All projects target `net10.0`\*\*, with warnings treated as errors.
* **Central package management.** Dependency versions live in each repo's `Directory.Packages.props`.
* **Shouldly.** Used for assertions.
* **NSubstitute.** Used for mocks.
* **Validate.** Used for snapshot testing.
* **Testcontainers.** Used for integration tests.
