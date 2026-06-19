---
title: Embedding the engine
description: Use the NSchema.Core engine directly from a .NET application, instead of the CLI.
---

The `nschema` CLI is a thin front-end over **NSchema.Core**, the engine that does the real
work. Most people should use the CLI. Embed the library directly only when you need to build
your own harness — to drive migrations from inside an application, wire in custom policies, or
integrate with your own configuration and logging.

:::tip
If you just want to run migrations, the [CLI](/cli/) is almost certainly what you want. This
section is for building on the engine itself.
:::

## Install

Install the core package and a database provider:

```sh
dotnet add package NSchema.Core
dotnet add package NSchema.Postgres   # or another provider
```

## Declare a schema

Declare your desired schema in `.sql` files using [NSchema DDL](/ddl/defining-schemas/) —
declarative `CREATE` statements describing the *desired* shape:

```sql
CREATE SCHEMA app;

CREATE TABLE app.users
(
    id bigint NOT NULL IDENTITY,
    email text NOT NULL,
    name text NOT NULL,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    UNIQUE INDEX uc_users_email (email)
);
```

## Wire up and run

The builder will be familiar to anyone who's used ASP.NET — it's a `HostApplicationBuilder`
under the hood, so you get configuration, logging, and DI for free:

```csharp
using NSchema;
using NSchema.Diff.Policies;
using NSchema.Postgres;

var builder = NSchemaApplication.CreateBuilder(args);

builder
    .AddDdlSchemas("schemas")
    .UsePostgres(connectionString)
    .WithDestructiveActionPolicy(DestructiveActionPolicy.Warn);

var app = builder.Build();
await app.Apply();
```

On startup, NSchema introspects the database, compares it with your desired schema, and
applies the resulting plan. The built application is **single-use**: it runs one operation and
exits.

## Operations

Run an operation by calling the matching method on the built application. The common ones:

- **`Plan()`** (default) computes the plan and renders it without touching the database.
- **`Apply()`** computes the plan and applies it.
- **`Refresh()`** captures the current live schema to the state store without planning or
  applying.

See [Configuration (C#)](/library/configuration/#operations) for the full list.

## Saved plans

You can save a plan to a file and apply it later, unchanged — so what was reviewed is exactly
what runs:

```csharp
await app.Plan(new PlanArguments { OutFile = "migration.nplan" });
// ...review the saved plan, then later (e.g. in a separate CI step):
await app.Apply(new ApplyArguments { PlanFile = "migration.nplan" });
```

## Where to go next

- **[Concepts & pipeline](/library/concepts/)** — the domain model and how a run flows
  through the engine.
- **[Configuration (C#)](/library/configuration/)** — building, running, operations,
  policies, scoping, state, dialects, and output.
- **[Extension points](/library/extension-points/)** — every interface you can swap or
  extend.
