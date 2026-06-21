---
title: What is NSchema?
description: NSchema is a declarative database schema migration tool. Describe the schema you want; NSchema computes and applies the migration to get there.
sidebar:
  order: 1
---

NSchema is a free, open-source CLI tool for declaratively managing database schemas. Instead of writing your migrations 
by hand with `ALTER` and `DROP` statements, you express your desired schema using plain `CREATE` statements, and NSchema
will work out the migration steps.

The starting design goal was "Terraform for databases", so it's built to work in CI/CD environments, 
and supports a very familiar command shape: `plan`, `apply`, `destroy`, etc.

## _Why_ is NSchema?

There are plenty of database migration tools and techniques out there already, but in my experience, they never just work.
Whether it's proprietary tooling, opaque binaries, or hand-written migrations, there's always one headache or another that
makes them not fun to deal with. Compare that with how easy it is to get started managing infrastructure with [OpenTofu](https://opentofu.org/),
and that's what we deserve for our databases.

The goal of NSchema is to provide a production-grade schema management tool, with the bells and whistles expected from
modern software, while offering a slick developer experience with the lowest-possible barrier to entry.

## Declarative, not imperative

Most migration tools are imperative: you hand-write an ordered sequence of `ALTER` steps, one file per change, 
and the tool replays them, usually either requiring the scripts to be idempotent, or keeping a history of which 
scripts have already been run. NSchema works the other way around. You maintain a single, declarative description 
of the desired schema, and NSchema's planner derives the steps to reach it:

```sql
CREATE SCHEMA app;

CREATE TABLE app.widgets (
  id   bigint NOT NULL,
  name text,
  CONSTRAINT widgets_pkey PRIMARY KEY (id)
);
```

In the example above, if you were to add a `price` column to the `app.widgets` table and run `nschema plan`, 
the planner would see the database already contains an `app.widgets` table, finds the missing `price` column and 
generates an `ALTER TABLE` statement to append it.

This is the same model tools like Terraform use for infrastructure: describe the goal, let the tool find the path. 
One key difference though, is that databases are inherently _stateful_. Most accidentally destroyed infrastructure 
can be recreated, but data lost through a dropped table can only be recovered from backups. (When did you last test those
again?) NSchema has guardrails and escape hatches for protecting against data loss, but you still need to take care when 
making destructive changes.

## How it works

Each `apply` run flows through a simple pipeline:

1. **Read the desired schema.** The SQL files in your project directory are composed into a single view of your goal schema.
2. **Validate the desired schema.** Checks are done to make sure the schema is valid: primary keys, referential integrity, etc.  
3. **Read the current schema.** The current schema is introspected from the target database's metadata tables.
4. **Diff the schemas.** The schemas are compared and output as a hierarchical diff.
5. **Validate the diff.** Checks the plan against configured policies (for example, the built-in guard against destructive changes).
6. **Linearize the diff.** The complex diff is reduced to a dependency-ordered list of actions (create table, add index, etc.).
7. **Generate SQL.** The action list is handed off to a database-specific provider to generate the required SQL.
8. **Apply.** Run the SQL against the target database if given approval.

Because the plan is computed and rendered before anything is executed, you always see a visual diff of the changes 
and the exact SQL that will be executed first. You can even [save a plan to a file](/cli/commands/plan/) and apply
that precise file later, so you can keep an audit of the executed SQL, and guarantee that the reviewed plan is what runs.

## What it manages

NSchema covers most major structures supported by relational databases, including: schemas, tables, columns, primary and 
foreign keys, constraints, indexes, views, functions, procedures, triggers, sequences, extensions, grants, enums, 
domains and composite types. For anything more niche, NSchema also supports arbitrary [pre-deployment and post-deployment scripts](/guides/deployment-scripts).

It's important to note that while your NSchema scripts might _look_ like SQL, it's actually a provider-neutral DSL meant
to feel familiar to SQL authors. That's how it supports features like deployment scripts and provider configuration. It
also means that unsupported objects fail the parsing check before they ever get near a database, meaning you can't accidentally
write SQL for an object that isn't supported.

## CLI or library

There are two ways to use NSchema. The first, and most strongly recommended, is via the CLI. NSchema is a .NET tool that
works very similar to Terraform: dump a bunch of SQL files with `CREATE` DDL in a folder and run `nschema apply`. This 
is what most people want, and what the bulk of these docs cover. Start with [Installation](/start/installation/) and the
[Quickstart Guide](/start/quickstart/).

The second way is to consume the `NSchema.Core` library directly, allowing you to build your own harness for managing migrations.
As much as possible, the CLI is kept as a thin wrapper around the Core, so embedding is kept simple and the behavior remains consistent. 
This Core package also exposes extension points for features like custom validation policies.

See [Embedding the engine](/library/embedding/).
