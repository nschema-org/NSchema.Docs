---
title: Adopting an existing database
description: Bring an existing PostgreSQL database under NSchema management with import.
---

import { Steps } from "@astrojs/starlight/components";

You don't have to start from an empty database. [`nschema import`](/cli/commands/import/) reads
a live schema and writes it out as [DDL source files](/ddl/defining-schemas/), so you can adopt
an existing database and manage it going forward.

<Steps>

1. **Point at the database.** Set the connection string and a `PROVIDER postgres` block (see
   [Configuration blocks](/cli/configuration/)):

   ```sh
   export NSCHEMA_POSTGRES_CONNECTION_STRING="Host=localhost;Database=app;Username=postgres;Password=postgres"
   ```

2. **Import the schema** into a directory:

   ```sh
   nschema import --out-dir ./schemas
   ```

   This writes the live schema out as `.sql` files. To adopt only part of the database, scope
   it:

   ```sh
   nschema import --out-dir ./schemas --scope app --scope billing
   ```

   `import` refuses to overwrite a directory that already contains `.sql` files; pass `--force`
   if you really mean to re-import over existing files.

3. **Review and commit.** Read the generated files, tidy them if you like, and check them into
   source control. This is now your desired schema.

4. **Verify a no-op plan.** A plan immediately after import should show *no changes* — proof
   that NSchema's model of the database matches reality:

   ```sh
   nschema plan
   ```

5. **Manage changes from here.** Edit the `.sql` files and use the normal
   [plan / apply workflow](/guides/workflow/) from now on.

</Steps>

## Seeding state at the same time

If you plan to use a [state store](/guides/state/) for offline planning, seed it from the live
database with [`nschema refresh`](/cli/commands/refresh/) once your `BACKEND` block is
configured:

```sh
nschema refresh
```

## Tip: diff import against recorded state

`import` output is canonicalised the same way NSchema records state, so you can compare a fresh
import against [`nschema show`](/cli/commands/show/) to spot differences between the live
database and your recorded state.
