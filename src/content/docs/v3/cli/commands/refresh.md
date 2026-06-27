---
title: nschema refresh
description: Read the live schema and write it to the state store.
sidebar:
  label: refresh
  order: 6
slug: v3/cli/commands/refresh
---

Read the live schema and write it to the state store. Use this to seed or repair [state](/v3/guides/state/).

```sh
nschema refresh
```

:::note[Needs]
A live database (a `PROVIDER postgres` block) **and** a state store to write to (a `BACKEND file` or `BACKEND s3` block).
:::

It captures the **whole** schema and so takes no desired-schema or `--scope` options.

Refresh is how you record drift that happened between applies, or initialize the state store with the current schema
before you start managing a database offline.
