---
title: Installation
description: Install the nschema .NET global tool.
sidebar:
  order: 2
---

NSchema is deployed as a **[.NET tool](https://learn.microsoft.com/en-us/dotnet/core/tools/global-tools)** named `nschema`.

## Prerequisites

- **.NET SDK 10.0 or later.** The tool targets `net10.0`. Check with `dotnet --version`; install from [dotnet.microsoft.com](https://dotnet.microsoft.com/download) if needed.
- **A database.** This tool is for managing database schemas after all. See [Providers](../providers/overview.md) for supported databases.

## Install

These instructions assume you want to install `nschema` globally just for the sake of simplicity. 
If you just want to install it locally, you can do that too. 

```sh
dotnet tool install --global nschema
```

This installs the `nschema` command onto your `PATH`. You can verify it using:

```sh
nschema --version
```

## Providers are plugins

Database providers and remote state backends aren't bundled with the CLI: each ships as its own NuGet package. You name 
and pin one in your project config (e.g. `PROVIDER postgres ( version = '4.0.0' )`) and `nschema` restores it on first use. 
The local-file state backend is the one exception — it's built in.

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
nschema completion bash --install-autocomplete
```

Swap `bash` for `zsh`, `fish`, or `pwsh`. See the [`completion` command](/cli/commands/completion/)
for manual installation and the `--uninstall-autocomplete` flag.

## Next steps

With the tool installed, head to the [Quickstart](/start/quickstart/) to scaffold a project and apply your first schema.
