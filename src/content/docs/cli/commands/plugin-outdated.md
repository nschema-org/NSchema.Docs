---
title: plugin outdated
description: Show each plugin's pinned version against the newest its range allows and the newest available.
sidebar:
  order: 14.4
---

Show, for each plugin the project uses, the version it is pinned to, against what is available.

```sh
nschema plugin outdated
```

```text
╭──────────┬──────────┬──────────────────┬─────────┬────────┬────────╮
│ Role     │ Plugin   │ Package          │ Current │ Wanted │ Latest │
├──────────┼──────────┼──────────────────┼─────────┼────────┼────────┤
│ database │ postgres │ NSchema.Postgres │ 5.0.0   │ 5.1.0  │ 5.1.0  │
│ state    │ s3       │ NSchema.Aws      │ 5.0.0   │ 5.0.0  │ 5.0.0  │
╰──────────┴──────────┴──────────────────┴─────────┴────────┴────────╯
1 outdated. Widen the range or run: nschema plugin update
```

- **Current** — the version the [lockfile](/cli/configuration/#the-lockfile) pins.
- **Wanted** — what the declared range resolves to now; this is what [`plugin update`](/cli/commands/plugin-update/) would install.
- **Latest** — the newest version available for this engine version.
