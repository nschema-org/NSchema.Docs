---
title: Embedding the engine
description: Use the NSchema.Core engine directly from a .NET application, instead of the CLI.
---

The `nschema` CLI is a thin front-end over the **NSchema.Core** NuGet package, which contains the engine that does the 
real work. Most people should use the CLI. Embed the library directly only when you need to build your own harness, 
to drive migrations from inside an application, wire in custom policies, or integrate with your own configuration and logging.

:::tip
This is an _advanced_ use case. If you just want to run migrations, the [CLI](/cli/) is almost certainly what you want. This section is for building on the engine itself.
:::

## Install

Install the core package and a database provider:

```sh
dotnet add package NSchema.Core
dotnet add package NSchema.Postgres   # or another provider
```

## Declare a schema

Declare your desired schema in `.sql` files using [NSchema DDL](/ddl/defining-schemas/):

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

The builder will be familiar to anyone who's used ASP.NET. It's a `HostApplicationBuilder` under the hood, so you get 
configuration, logging, and DI for free:

```csharp
using NSchema;
using NSchema.Diff.Policies;
using NSchema.Operations.Apply;
using NSchema.Operations.Plan;
using NSchema.Postgres;

var builder = NSchemaApplication.CreateBuilder(args);

builder
    .AddDdlSchemas("schemas")
    .UseCurrentSchemaPostgres(connectionString)
    .WithDestructiveActionPolicy(DestructiveActionPolicy.Warn);

using var app = builder.Build();

// Plan against the live database, then apply the resulting SQL.
var plan = await app.Operations.Plan(new PlanArguments { Target = PlanTarget.Live });
await app.Operations.Apply(new ApplyArguments { Sql = plan.Value!.Sql! });
```

Each operation lives on `app.Operations` and returns a `Result<T>`: a `Plan` introspects the database and computes the 
diff and SQL, and an `Apply` executes a plan's SQL. One application instance is reusable — drive as many operations 
through it as you like, then dispose it.

## Operations

Run an operation by calling the matching method on `app.Operations`. The common ones:

- **`Plan()`** computes the plan, the diff, and SQL, without touching the database in write. Scope it to recorded state, the live database, or a teardown with `PlanArguments.Target`.
- **`Apply()`** executes a plan's SQL (`ApplyArguments.Sql`), captured from a `Plan` or read from a saved plan file.
- **`Refresh()`** captures the current live schema to the state store without planning or applying.

See [Configuration (C#)](/library/configuration/#operations) for the full list.

## Saved plans

You can save a plan to a file and apply it later, unchanged, so what was reviewed is exactly what runs:

```csharp
// Save the plan as it is computed:
await app.Operations.Plan(new PlanArguments { Target = PlanTarget.Live, OutFile = "migration.nplan" });

// ...review the saved plan, then later (e.g. in a separate CI step) read it back and apply exactly its SQL:
var envelope = await app.PlanFile.Read("migration.nplan", cancellationToken);
await app.Operations.Apply(new ApplyArguments { Sql = envelope.Sql });
```

## Where to go next

- **[Concepts & pipeline](/library/concepts/)** — the domain model and how a run flows through the engine.
- **[Configuration (C#)](/library/configuration/)** — building, running, operations, policies, scoping, state, dialects, and output.
- **[Extension points](/library/extension-points/)** — every interface you can swap or extend.
