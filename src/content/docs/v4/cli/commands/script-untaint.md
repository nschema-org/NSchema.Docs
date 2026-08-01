---
title: script untaint
description: Record a pending run-once script as executed without running it.
sidebar:
  order: 10.56
slug: v4/cli/commands/script-untaint
---

Record a [`RUN ONCE` script](/v4/guides/deployment-scripts/#run-conditions) as executed without running it, so later plans
skip it. The recorded entry is indistinguishable from a real execution — the same name and body hash an apply would have
written, taken from the script's declaration in your `.sql` files.

```sh
nschema script untaint seed-users
```

The main use is [rebuilding lost state](/v4/guides/state/#state-surgery): [`refresh`](/v4/cli/commands/refresh/) reconstructs
the schema snapshot from the live database, but it can't know which scripts already ran. Untaint each one that has.
It's also the way to adopt a script whose effect already exists (e.g. the role it creates was made by hand).

Untainting an *already-recorded* script is refused rather than silently overwriting its record. To accept a changed body
without running it, [`taint`](/v4/cli/commands/script-taint/) first, then untaint.

The change runs under the [state lock](/v4/cli/commands/lock/).

:::note[Needs]
A state store (a `BACKEND` block) and the project's `*.sql` files — the recorded hash comes from the script's
declaration. No provider is required, and the live database is never contacted.
:::

## Arguments

* **`name`** *(required)* — the script's declared name.

## Options

* **`--no-lock`** — untaint without acquiring the state lock. You take responsibility for preventing concurrent runs.
