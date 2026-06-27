---
title: Upgrading to v4
description: What changed between NSchema v3 and v4, and how to update your project.
sidebar:
  order: 1
---

NSchema v4 changes the provider/backend model to be plugin-based rather than compiling dependencies directly into the CLI.
This gives you more control about what provider versions you use, and also allows you to use your own providers with the 
CLI. Here's what changed and what you need to do.

## Providers and backends are now plugins

In v3 every provider shipped inside the CLI. In v4 they're separate NuGet packages, fetched on demand. Name and pin providers
in your config and `nschema` restores it on first use:

```sql
PROVIDER postgres (
  version = '4.0.0',   -- new: required
  connection_string = ''
);
```

- **`version` is required** on every `PROVIDER` block and every non-`file` `BACKEND` block to pin the plugin package version.
- First-party plugins (`postgres`, `sqlite`, `sqlserver`, `s3`) resolves to their packages automatically; use a `source`
  attribute to directly name a package that contains a third party plugin.
- The **local-file backend stays built in** — no version, no plugin.
- The .NET SDK must be on your `PATH` (the CLI shells out to it to restore plugins). Standard NuGet configuration is respected.

## A `PROVIDER` block is now required

In v3, setting `NSCHEMA_POSTGRES_CONNECTION_STRING` alone was enough to select Postgres. In v4 the connection-string
environment variable no longer self-identifies a provider; instead, you must declare a `PROVIDER` block (with its `version`).
The env var still overrides the connection string set in the block.

## The `NSCHEMA` config block is gone

The `NSCHEMA ( … )` block has been removed entirely:

- `destructive_action` moved out of config — set it with the `--destructive-actions` flag or the
  `NSCHEMA_DESTRUCTIVE_ACTION_POLICY` environment variable. See [Destructive-action safety](/guides/destructive-actions/).
- `dialect` / `transaction_mode` were never wired in and are gone too.

An `NSCHEMA` block now errors as an unknown configuration block.

## Configuration is just `PROVIDER` + `BACKEND`

That is the whole of config-in-SQL now. See [Configuration blocks](/cli/configuration/).
