---
title: plugin
description: Inspect the project's provider and backend plugins, and manage the
  plugin cache.
sidebar:
  order: 14
slug: v4/cli/commands/plugin
---

Top-level group for inspecting the [provider and backend plugins](/v4/cli/configuration/#plugins-and-versions) your project
uses, and for managing the shared on-disk cache they are restored into. Providers and backends ship as NuGet packages
that `nschema` restores on first use (or up front with [`init`](/v4/cli/commands/init/)); these commands let you see what is
pinned, what is cached, and reclaim space.

`plugin` is a group — run it with one of the subcommands below. On its own, `nschema plugin` just prints this list.

* **[`plugin list`](/v4/cli/commands/plugin-list/)** — list the plugins this project pins, and whether each is restored.
* **[`plugin show`](/v4/cli/commands/plugin-show/)** — show the detail of one of the project's plugins.
* **[`plugin cache`](/v4/cli/commands/plugin-cache/)** — inspect and remove entries in the shared plugin cache.

The cache lives at `~/.nschema/plugins` and is **shared across every project** on the machine, so it is managed
machine-wide (by package and version) rather than per-project.
