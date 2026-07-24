---
title: script hash
description: Compute the body hash of the project's run-once scripts.
sidebar:
  order: 10.545
slug: v4/cli/commands/script-hash
---

Compute the body hash of the project's [scripts](/v4/guides/deployment-scripts/#run-conditions).
Useful when [hand-editing pulled state](/v4/guides/state/#state-surgery): the hash you write into a ledger entry must match
the declaration, and this is where it comes from.

```sh
nschema script hash               # every run-once declaration, with its hash
nschema script hash seed-users    # one script's hash, bare on stdout
```

With a name the hash is printed bare, so it drops straight into a script or an edited state file:

```sh
nschema script hash seed-users
# 895666410f2dae0764a54855639726ec844db1c9cc31393c8abc72366d04f235
```

Without a name, every run-once declaration is listed with its hash (`--json` emits a single array of`{name, hash}` objects).
The hashes are computed from the declarations in your `.sql` files — template-expanded, exactly as an apply would record them.

:::note[Needs]
Only the project's `*.sql` files. No state store or provider is required, and the live database is never contacted.
:::

## Arguments

* **`name`** *(optional)* — a run-once script's declared name; omit to list all run-once declarations.
