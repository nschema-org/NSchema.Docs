---
title: Installation
description: Install the nschema .NET global tool.
sidebar:
  order: 2
---

NSchema is deployed as a **[.NET tool](https://learn.microsoft.com/en-us/dotnet/core/tools/global-tools)** named `nschema`.

## Prerequisites

- **.NET SDK 10.0 or later.** The tool targets `net10.0`. Check with `dotnet --version`; install from [dotnet.microsoft.com](https://dotnet.microsoft.com/download) if needed.
- **A database.** This tool is for managing database schemas after all. See [Databases](/databases/) for supported databases.

## Install

These instructions assume you want to install `nschema` globally just for the sake of simplicity. 
If you just want to install it locally, you can do that too. 

```sh
dotnet tool install nschema --global
```

This installs the `nschema` command onto your `PATH`. You can verify it using:

```sh
nschema --version
```

## Providers are plugins

Database providers and remote state stores aren't bundled with the CLI: each ships as its own NuGet package. When you need
to use a plugin, declare it in a `PLUGIN` block, pinning the package source and version. NSchema will pin the selected
version in a lockfile so runs are consistent. Source accepts any NuGet package ID, so third party plugins are supported.

```sql
PLUGIN postgres (
  source  = 'NSchema.Postgres',
  version = '[5.0,6.0)'
);
```

The local `file` state store is the one exception to the plug-in system, as it's built in. 
See [Configuration](/cli/configuration/#plugins).

## Update

```sh
dotnet tool update --global nschema
```

## Uninstall

```sh
dotnet tool uninstall --global nschema
```

## Shell completion

NSchema can emit a completion script for your shell, and install it for you in one step:

```sh
nschema completion install bash
```

Swap `bash` for `zsh`, `fish`, or `pwsh`. See the [`completion` command](/cli/commands/completion/)
for manual installation and [`completion uninstall`](/cli/commands/completion-uninstall/) to remove it.

## Next steps

With the tool installed, head to the [Quickstart](/start/quickstart/) to scaffold a project and apply your first schema.
