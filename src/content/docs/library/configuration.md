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

Call `builder.Build()` to get an `NSchemaApplication`. It is not a long-running host, but it is reusable — run as many 
operations through one instance as you like, then dispose it. Operations live on `app.Operations`; each is awaitable and 
returns a `Result<T>`, so an *expected* failure (a policy violation, lock contention, a bad configuration) comes back as 
`result.IsFailure` with diagnostics rather than throwing. (See [Errors and exceptions](#errors-and-exceptions).)

## Operations

Each operation is a method on `app.Operations`, taking an arguments object (`PlanArguments`, `ApplyArguments`, …) and 
returning a `Result<T>`:

- **`Plan(PlanArguments)`** computes the plan — the structured diff, the migration plan, and the SQL — without writing to 
  the database. `PlanArguments.Target` selects what it plans against: a preview of recorded state (`Recorded`, the default), 
  the live database (`Live`, what an apply uses), or a teardown of the managed schema (`Teardown`). Set `OutFile` to also 
  save the plan to a file. (See [Saved plan files](#saved-plan-files).)
- **`Apply(ApplyArguments)`** executes a plan's SQL against the database, then captures the resulting schema to the 
  [state store](#backend-state-store) if one is configured. The SQL comes from `ApplyArguments.Sql` — a `PlanResult.Sql`, 
  or a [saved plan file](#saved-plan-files).
- **`Refresh(RefreshArguments)`** reads the current schema from the live database and writes it to the state store, without 
  planning or applying anything. Requires a state store.
- **`Import(ImportArguments)`** reads the live database schema and writes it to the local filesystem as desired-schema source 
  files. One `.sql` file is written per major object under `ImportArguments.OutputDirectory`. Useful for bootstrapping a 
  project from an existing database.
- **`Validate(ValidateArguments)`** loads the desired schema and validates it against the configured schema policies, without planning or applying.
- **`Drift(DriftArguments)`** compares the recorded state against the live database and reports how the live database has drifted from it. Requires a state store.
- **`Doctor(DoctorArguments)`** runs read-only health checks against the configured infrastructure (connectivity, the state store, the lock) and reports the outcome of each.

A teardown is just a `Plan` with `Target = PlanTarget.Teardown`, applied like any other plan. Reading recorded state or a 
saved plan for display is done through `app.CurrentSchema` / `app.PlanFile`, and inspecting or releasing the state lock 
through `app.Locks` — not through an operation.

```csharp
var app = builder.Build();

// Plan against the live database, then apply the resulting SQL.
var plan = await app.Operations.Plan(new PlanArguments { Target = PlanTarget.Live });
if (plan.IsSuccess)
    await app.Operations.Apply(new ApplyArguments { Sql = plan.Value!.Sql! });
```

## Saved plan files

An `Apply` executes whatever SQL you hand it, so you can save the plan from one run and apply that exact file later. This 
guarantees that what was reviewed is exactly what is applied, which is useful when planning and applying happen in separate 
steps (for example, plan in a pull request, apply after approval in CI).

Save a plan as it is computed with `PlanArguments.OutFile`. Later, read it back with `app.PlanFile.Read(...)` and apply its SQL:

```csharp
// Step 1: compute and save the plan (requires a registered SQL generator):
await app.Operations.Plan(new PlanArguments { Target = PlanTarget.Live, OutFile = "migration.nplan" });

// Step 2: later, read the saved plan and apply exactly its SQL, without recomputing:
var envelope = await app.PlanFile.Read("migration.nplan", cancellationToken);
await app.Operations.Apply(new ApplyArguments { Sql = envelope.Sql });
```

The file records the structured diff, the migration plan, and the generated SQL (a `PlanFileEnvelope`). Applying from it 
does not re-read the database or re-plan — it executes the saved SQL directly, and the envelope's `Diff`/`Plan` are there 
if you want to present the same view a normal run would.

A teardown plan works the same way: save it with `Target = PlanTarget.Teardown`, then read and apply it identically — a 
saved teardown is just a saved plan.

Saving a plan requires a registered SQL generator (to produce the SQL stored in the file). Plan files are written to the 
local filesystem; they are not routed through the [state store](#backend-state-store).

## Backend state store

By default, NSchema generates plans against the current live state of the database. This is simple and works well for 
many scenarios, but you can't always guarantee that you'll have access to the database at plan time. Sometimes it's 
desirable to generate a plan against the last applied state instead, like generating migration scripts in a CI pipeline 
with no database connection.

NSchema supports an optional backend state store that persists a snapshot of the schema. After a successful apply, NSchema 
captures the resulting schema to the store, so a later plan can be generated against that snapshot. You can also capture 
the current schema without applying by running a [`Refresh`](#operations) operation; handy for recording drift that happened 
between applies.

Register a state store from a provider package like `NSchema.Aws`, or use the built-in `UseFileStateStore(path)` for a file-backed store:

```csharp
builder.UseFileStateStore("schema_state.json");
```

When a state store is registered, a preview `Plan` (`Target = PlanTarget.Recorded`) uses the snapshot as its current-state 
source (offline planning), while planning for an apply (`Target = PlanTarget.Live`) reads the live database. No additional 
configuration is needed.

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

await app.Operations.Plan(new PlanArguments { Schemas = ["app"] });   // only "app" is read, validated, and diffed
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

## Output and progress

An operation returns its structured output in the `Result<T>` you `await` — the diff, migration plan, and SQL on 
`PlanResult`, the applied SQL on `ApplyResult`, and so on. Render or serialize that yourself (for example to emit JSON for 
a CI pipeline); the engine writes nothing on its own, so there is no output reporter to replace.

For the transient progress a long run emits, register an `IProgress<OperationProgress>` with `UseProgressReporter`:

```csharp
builder.UseProgressReporter<MyProgressSink>();   // receives each OperationProgress as the run narrates
```

The default progress reporter is a no-op. Only one is active; the last registration wins.

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

## Errors and exceptions

Expected, recoverable failures — a policy violation, lock contention, an invalid configuration — are not exceptions. They 
come back as a failed `Result<T>`, which carries the diagnostics explaining what went wrong:

```csharp
var result = await app.Operations.Apply(new ApplyArguments { Sql = plan.Value!.Sql! });
if (result.IsFailure)
{
    foreach (var diagnostic in result.Diagnostics)
        Console.Error.WriteLine(diagnostic.Message);
    return 1;
}
```

A genuine exception (a dropped connection, a bug) still throws and propagates out of the operation call, so you can catch 
it at your entry point and set a process exit code. Either way the engine prints nothing itself — presenting results and 
exceptions is the caller's job.
