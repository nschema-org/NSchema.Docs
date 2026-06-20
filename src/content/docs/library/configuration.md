---
title: Configuration (C#)
description: How to build, run, and configure an NSchema application from .NET code.
---

How to build, run, and configure an NSchema application from code. New to NSchema? Start with the [Embedding the engine](/library/embedding/) 
walkthrough, then come back here.

## Building and running

The builder should be familiar to any developer who's used ASP.NET. `NSchemaApplication.CreateBuilder(...)` produces a 
builder that you can configure with your target schema, database provider, configuration, logging, metrics, or any other
.NET packages that we've come to rely on. It uses a `HostApplicationBuilder` internally purely to compose those.

Call `builder.Build()` to get an `NSchemaApplication`. It is not a long-running host; it's a single-use object that runs 
one operation and exits. Run an operation by calling the matching method on it (`Plan()`, `Apply()`, etc.). The operation 
`await`s directly, so exceptions surface to you at the call site, and the application can only be run once.

## Operations

Each run performs one of the following operations, selected by the method you call on the built application:

- **`Plan()`** computes and renders the plan, without touching the database. Can also write the plan to a file to apply 
  later. (See [Saved plan files](#saved-plan-files).)
- **`Apply()`** computes the plan and applies it to the database. After a successful apply, the resulting schema is captured 
  to the [state store](#backend-state-store) if one is configured. Can also apply a previously [saved plan file](#saved-plan-files) instead of recomputing.
- **`PlanDestroy()`** computes and renders the teardown plan (the plan to drop the managed schema)without applying it. 
  Can also write it to a file. (See [Saved plan files](#saved-plan-files)).
- **`Refresh()`** reads the current schema from the live database and writes it to the state store, without planning or 
  applying anything. Requires a state store.
- **`Import()`** reads the live database schema and writes it to the local filesystem as desired-schema source files. 
  One `.sql` file is written per major object under `ImportArguments.OutputDirectory`. Useful for bootstrapping a project 
  from an existing database.
- **`Validate()`** loads the desired schema and validates it against the configured schema policies, without planning or applying.
- **`Show()`** reads the recorded state from the state store and renders it. Requires a state store.
- **`Drift()`** compares the recorded state against the live database and reports how the live database has drifted from it. Requires a state store.
- **`Destroy()`** drops the managed schema objects from the database.
- **`ForceUnlock()`** forcibly removes the state lock, for recovering from a stale lock.

Every operation takes an arguments object (`PlanArguments`, `ApplyArguments`, …); pass a fresh one when you have nothing to configure:

```csharp
var app = builder.Build();
await app.Apply(new ApplyArguments()); // Runs the apply.
```

## Saved plan files

By default `Apply` recomputes the plan when it runs. You can instead save the plan from one run and apply that exact 
file later. This guarantees that what was reviewed is exactly what is applied, which is useful when planning and applying 
happen in separate steps (for example, plan in a pull request, apply after approval in CI).

Write a plan to a file with `PlanArguments.OutFile`, then apply it with `ApplyArguments.PlanFile`:

```csharp
// Step 1 — compute and save the plan (requires a registered SQL generator):
await app.Plan(new PlanArguments { OutFile = "migration.nplan" });

// Step 2 — later, apply exactly that plan without recomputing:
await app.Apply(new ApplyArguments { PlanFile = "migration.nplan" });
```

The file records the structured diff, the migration plan, and the generated SQL. Applying from it reports the same 
diff/plan/SQL view a normal run would, then executes the saved SQL. It does not re-read the database or re-plan. When 
`PlanFile` is set, `ApplyArguments.Schemas` is ignored, since the saved plan already fixes its scope.

A teardown plan works the same way: save it with `PlanDestroyArguments.OutFile`, then apply it through `Apply` (a saved teardown is just a saved plan):

```csharp
await app.PlanDestroy(new PlanDestroyArguments { OutFile = "teardown.nplan" });
await app.Apply(new ApplyArguments { PlanFile = "teardown.nplan" });
```

Saving a plan requires a registered SQL generator (to produce the SQL stored in the file). Plan files are written to the 
local filesystem; they are not routed through the [state store](#backend-state-store).

## Backend state store

By default, NSchema generates plans against the current live state of the database. This is simple and works well for 
many scenarios, but you can't always guarantee that you'll have access to the database at plan time. Sometimes it's 
desirable to generate a plan against the last applied state instead, like generating migration scripts in a CI pipeline 
with no database connection.

NSchema supports an optional backend state store that persists a snapshot of the schema. After a successful apply, NSchema 
captures the resulting schema to the store, so a later plan can be generated against that snapshot. You can also capture 
the current schema without applying by running a [`Refresh`](#operations) operation — handy for recording drift that happened 
between applies.

Register a state store from a provider package like `NSchema.Aws`, or use the built-in `UseFileStateStore(path)` for a file-backed store:

```csharp
builder.UseFileStateStore("schema_state.json");
```

When a state store is registered, `Plan` operations automatically use it as the current-state source (offline planning), 
and `Apply` operations always read from the live database. No additional configuration is needed.

## Destructive action policy

By default, NSchema will error on any destructive actions (e.g. dropping tables or columns) to prevent accidental data loss. 
You can change this behavior by configuring the `DestructiveActionPolicy`:

```csharp
builder.WithDestructiveActionPolicy(DestructiveActionPolicy.Warn); // log a warning, but continue
builder.WithDestructiveActionPolicy(DestructiveActionPolicy.Allow); // allow without warning
```

If you need more advanced control, you can implement your own `IDiffPolicy` and register it with `AddDiffPolicy<T>()`.

## Scoping to specific schemas

Pass a `Schemas` filter on the operation arguments to scope a run to a subset of schemas. Useful for deploying schemas 
independently of one another:

```csharp
var app = builder
    .AddDdlSchemas("schemas")
    .UseCurrentSchemaPostgres(connectionString)
    .Build();

await app.Plan(new PlanArguments { Schemas = ["app"] });   // only "app" is read, validated, and diffed
```

Scope is a per-invocation argument (`PlanArguments` / `ApplyArguments` / `ValidateArguments` / `DestroyArguments`), not 
ambient configuration. Declarations or drops for schemas outside the scope are ignored, so unmanaged schemas in the 
database are never touched.

## Configuring desired schemas

The desired schema is declared in SQL DDL files (see [Defining schemas](/ddl/defining-schemas/) and the [grammar reference](/ddl/grammar/)), loaded 
with `AddDdlSchemas`, which takes a base directory and a glob pattern relative to it (the pattern defaults to `**/*.sql`):

```csharp
builder.AddDdlSchemas("schemas");
```

`AddDdlSchemas` may be called more than once and the sources are aggregated before planning, so you can split a schema 
across many files (and directories) freely. Deployment scripts declared inline in those files (`PRE/POST DEPLOYMENT`) 
are loaded at the same time. For finer control, pass a configured `Microsoft.Extensions.FileSystemGlobbing.Matcher`, 
which supports excludes as well as includes:

```csharp
var matcher = new Matcher();
matcher.AddInclude("**/*.sql");
matcher.AddExclude("**/*.env.*.sql");   // e.g. environment-overlay files, layered in separately
builder.AddDdlSchemas("schemas", matcher);
```

## Configuring the current schema

The current schema is configured by registering a provider that can read the live state of the database. This is typically 
done via a provider package like `NSchema.Postgres`:

```csharp
// Using a provider package:
builder.UseCurrentSchemaPostgres(connectionString);

// Or register your own ISchemaProvider directly:
builder.UseCurrentSchema<MyCustomSchemaProvider>();
```

See [Backend state store](#backend-state-store) for how to configure offline planning against a persisted snapshot.

## Transaction mode

By default, NSchema runs the entire migration inside a single transaction to ensure that either all changes are applied 
successfully or none at all. However, some databases don't support DDL statements inside transactions, or you may have 
specific statements that need to run outside of a transaction.

```csharp
builder.WithTransactionMode(TransactionMode.Single); // entire migration in one transaction (default)
builder.WithTransactionMode(TransactionMode.None);   // all statements outside transactions
```

## Output format

Run output is produced by an `IOperationReporter`. The built-in default reporter writes human-readable output to the 
terminal. Replace it with your own, for example to emit JSON for a CI pipeline, using `UseReporter`:

```csharp
builder.UseReporter<JsonReporter>();   // or UseReporter(new JsonReporter())
```

Only one reporter is active; the last registration wins.

## SQL generation

SQL is produced by an `ISqlGenerator`, supplied by a database provider. Registering a provider's current-schema reader 
also registers its generator, so you normally don't wire this up by hand:

```csharp
builder.UseCurrentSchemaPostgres(connectionString);   // also registers the Postgres SQL generator
```

To register a generator on its own (or swap in a custom one), use `UseSqlGenerator`:

```csharp
builder.UseSqlGenerator<PostgresSqlGenerator>();
```

Only one generator is registered at a time; the last registration wins. With none registered, plans are still computed 
and reported, just without a SQL preview.

## Schema policies

Schema policies validate the desired schema before any comparison or planning is done:

```csharp
builder.AddSchemaPolicy<TableNamesMustBePluralPolicy>();
```

## Diff policies

Diff policies validate the structured diff between the current and desired schema before a plan is built. This is where 
the built-in destructive-action policy runs. Register your own to enforce additional rules:

```csharp
builder.AddDiffPolicy<NoDropTablesPolicy>();   // your own IDiffPolicy implementation
```

## Exception behavior

By default, NSchema will report any exceptions using `IOperationReporter` and then rethrow them. You can change this 
behavior through `NSchemaApplicationOptions`, passed when you create the builder:

```csharp
// report and rethrow exceptions (default)
var app = NSchemaApplication.CreateBuilder(new NSchemaApplicationOptions
{
    ExceptionBehavior = ExceptionBehavior.ReportAndThrow,
});

// rethrow exceptions without reporting
var app = NSchemaApplication.CreateBuilder(new NSchemaApplicationOptions
{
    ExceptionBehavior = ExceptionBehavior.Throw,
});
```

Either way the exception propagates out of the operation call (e.g. `await app.Apply()`), so you can handle it and set 
a process exit code in your entry point.
