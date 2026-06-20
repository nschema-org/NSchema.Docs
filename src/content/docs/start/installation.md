---
title: Installation
draft: true
description: Install the nschema .NET global tool.
sidebar:
  order: 2
---

NSchema ships as a **[.NET tool](https://learn.microsoft.com/en-us/dotnet/core/tools/global-tools)** named `nschema`.

## Prerequisites

- **.NET SDK 10.0 or later.** The tool targets `net10.0`. Check with `dotnet --version`; install from [dotnet.microsoft.com](https://dotnet.microsoft.com/download) if needed.
- **A database.** This tool is for managing database schemas after all. See [Providers](../providers/providers.md) for supported databases.

## Install

```sh
dotnet tool install --global nschema
```

This installs the `nschema` command onto your `PATH`. Verify it:

```sh
nschema --version
```

## Update

```sh
dotnet tool update --global nschema
```

## Uninstall

```sh
dotnet tool uninstall --global nschema
```

## Shell completion

NSchema can emit a completion script for your shell — see the
[`completion` command](/cli/commands/completion/).

## Next steps

With the tool installed, head to the [Quickstart](/start/quickstart/) to scaffold a project
and apply your first schema.
