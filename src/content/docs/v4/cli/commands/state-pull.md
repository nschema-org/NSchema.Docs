---
title: state pull
description: Download the raw recorded state payload from the configured store.
sidebar:
  order: 10.51
slug: v4/cli/commands/state-pull
---

Download the raw state payload from the configured [state store](/v4/guides/state/), exactly as stored. Where
[`state show`](/v4/cli/commands/state-show/) renders the recorded *schema* for reading, `pull` downloads the payload for
backup, inspection with your own tools, or hand-editing before a [`state push`](/v4/cli/commands/state-push/).

```sh
nschema state pull                 # write the payload to stdout
nschema state pull ./backup.json   # write the payload to a file
```

Without a file argument the payload is written to standard output with no other narration:

```sh
nschema state pull > backup.json
```

Pull never interprets the payload, so state that has become unreadable (a corrupt or truncated payload) can still be
pulled for repair; fix it by hand, and [`push`](/v4/cli/commands/state-push/) it back.

:::note[Needs]
A state store (a `BACKEND` block). The live database is never contacted.
:::

## Arguments

* **`file`** *(optional)* — write the payload to this file instead of standard output.
