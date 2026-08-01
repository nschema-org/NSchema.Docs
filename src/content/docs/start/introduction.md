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
again?) NSchema has guardrails for protecting against data loss, but you still need to take care when making destructive changes.

## How it works

Each `apply` run flows through a simple pipeline:

1. **Read the project.** The files in your project directory are composed into a single view of your desired state,
   along with any scripts and directives.
2. **Validate the project.** Checks are done to make sure the schema is valid: primary keys, referential integrity, etc.  
3. **Read the current state.** The state NSchema last recorded in its [state store](/guides/state/).
4. **Diff the two.** They are compared and output as a hierarchical diff, with any directives enacted (renames, migration scripts, etc.)
5. **Linearize the diff.** The diff is reduced to a dependency-ordered list of actions (create table, add index, etc.).
6. **Render SQL.** Each action is rendered by the database-specific provider into the SQL that performs it.
7. **Check the policies.** The finished plan is checked against the configured policies (like the built-in guard against destructive changes).
8. **Apply.** Run the SQL against the target database if given approval, then record the result.

The diff is done against an offline snapshot of the state, not from a live read, so a plan is reproducible and reviewable, 
and a change someone made to the database out of band shows up as [drift](/guides/drift/) instead of going unnoticed.

Because the plan is computed and rendered before anything is executed, you always see a visual diff of the changes 
and the exact SQL that will be executed first. You can even [save a plan to a file](/cli/commands/plan/) and apply
that precise file later, so you can keep an audit of the executed SQL, and guarantee that the reviewed plan is what runs.

## What it manages

NSchema covers most major structures supported by relational databases, including: schemas, tables, columns, primary and 
foreign keys, constraints, indexes, views, functions, procedures, triggers, sequences, extensions, grants, enums, 
domains and composite types. For anything more niche, NSchema also supports arbitrary [pre-deployment and post-deployment scripts](/guides/deployment-scripts).

It's important to note that while your NSchema files might _look_ like SQL, the language is **NSQL**: a provider-neutral
DSL meant to feel familiar to SQL authors. That's how it supports features like deployment scripts and configuration. 
See [Defining schemas](/nsql/defining-schemas/).

## Getting Started

NSchema is a .NET tool that works very similar to Terraform: dump a bunch of SQL files with `CREATE` DDL in a folder and 
run `nschema apply`.Start with [Installation](/start/installation/) and the [Quickstart Guide](/start/quickstart/).

It is technically possible to consume the `NSchema.Core` library directly, allowing you to build your own harness for managing migrations.
As much as possible, the CLI is kept as a thin wrapper around the Core, so embedding is kept simple and the behavior remains consistent. 
This Core package also exposes extension points for features like custom validation policies.
