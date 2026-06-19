---
title: Quickstart
description: From an empty directory to an applied schema in about five minutes.
sidebar:
  order: 3
---

import { Steps } from "@astrojs/starlight/components";

This walks you from an empty directory to a schema applied to a live PostgreSQL database.
It assumes you've [installed the `nschema` tool](/start/installation/) and have a database
you can connect to.

<Steps>

1. **Scaffold a project.**

   ```sh
   nschema init
   ```

   This writes two files:

   - `config.sql` — the project's `PROVIDER` / `BACKEND` configuration blocks (which database
     to connect to, and where state lives).
   - `schemas/example.sql` — a sample desired-schema file.

   Edit the sample to describe the schema you want, written in
   [NSchema DDL](/ddl/defining-schemas/):

   ```sql
   -- schemas/example.sql
   CREATE SCHEMA app;

   CREATE TABLE app.widgets (
     id   bigint NOT NULL,
     name text,
     CONSTRAINT widgets_pkey PRIMARY KEY (id)
   );
   ```

2. **Point at your database.**

   The connection string is a secret, so supply it through the environment rather than
   committing it:

   ```sh
   export NSCHEMA_POSTGRES_CONNECTION_STRING="Host=localhost;Database=app;Username=postgres;Password=postgres"
   ```

   See [Configuration blocks](/cli/configuration/) for setting the provider and backend, and
   [Environment variables](/cli/environment-variables/) for the full list of overrides.

3. **Check the schema files are well-formed** (optional, but a fast pre-flight):

   ```sh
   nschema validate
   ```

4. **Preview the migration.**

   ```sh
   nschema plan
   ```

   This computes the changes and prints them, without touching the database.

5. **Apply it.**

   ```sh
   nschema apply
   ```

   `apply` shows the same plan, then prompts for confirmation before making any changes.
   Answer `yes` to proceed.

</Steps>

That's the core loop: **edit the `.sql` files → `plan` → `apply`**. Everything else builds on
it.

## What next?

- **Already have a database?** Use [`import`](/cli/commands/import/) to write its schema out
  as DDL and adopt it into NSchema — see [Adopting an existing database](/guides/adopting-a-database/).
- **Learn the schema language.** [Defining schemas](/ddl/defining-schemas/) is a practical
  introduction; the [grammar reference](/ddl/grammar/) is the complete spec.
- **Understand the workflow.** [The plan / apply workflow](/guides/workflow/) covers saved
  plans, scoping, and the day-to-day loop.
- **Automate it.** [Running in CI](/guides/ci/) covers `--auto-approve`, detailed exit
  codes, and offline planning.
