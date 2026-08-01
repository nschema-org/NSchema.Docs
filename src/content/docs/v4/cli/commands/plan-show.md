---
title: plan show
description: Render a saved plan file back to the terminal, without a database
  or any config.
sidebar:
  order: 5.5
slug: v4/cli/commands/plan-show
---

`plan show <file>` renders a plan file saved by [`plan --out`](/v4/cli/commands/plan/) back to the terminal, including its
diff, the ordered plan, and the SQL it would run,  without a database or any config. Use it to review a saved plan before
handing it to [`apply --plan-file`](/v4/cli/commands/apply/), or in a PR where the plan was produced on another runner.

```sh
nschema plan --out tonight.nplan
nschema plan show tonight.nplan
```

:::note[Needs]
Nothing — `plan show` reads the file directly and contacts neither the database nor the state store.
:::

See [The plan / apply workflow](/v4/guides/workflow/) for the full plan-then-apply pattern.
