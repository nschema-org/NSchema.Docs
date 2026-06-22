---
title: Concepts & pipeline
description: The NSchema domain model, the pipeline a run flows through, and how the pieces fit together.
---

This page goes over the core concepts in NSchema in more detail.

## Domain model

NSchema works around a simple domain model of schemas, tables, columns, indexes, constraints, and views. The model is 
designed to be flexible enough to represent the features of any relational database, while still being simple and
intuitive to work with.

These models are used to represent both the desired state (what you want) and the current state (what the database has), 
so they can be compared symmetrically and transformed as needed.

Because they're just .NET objects, the schema can be constructed in any way you like. The usual source is a SQL DDL file 
(see [Defining schemas](/ddl/defining-schemas/)), but you could just as easily generate it from code or use an existing provider to pull it 
from the database itself.

## Pipeline

This section goes over the high-level pipeline steps that every NSchema application flows through. Most stages have an 
interface you can swap or extend; these are covered in more detail below and in [Extension points](/library/extension-points/).

### Planning

This section of the pipeline is where the migration plan is generated. It runs on every execution, even for an `Apply`, 
so that stale plans aren't accidentally applied.

1. **Read the desired schema.** The SQL files in your project directory are composed into a single view of your goal schema.
2. **Validate the desired schema.** Checks are done to make sure the schema is valid: primary keys, referential integrity, etc.
3. **Read the current schema.** The current schema is introspected from the target database's metadata tables.
4. **Diff the schemas.** The schemas are compared and output as a hierarchical diff.
5. **Validate the diff.** Checks the plan against configured policies (for example, the built-in guard against destructive changes).
6. **Linearize the diff.** The complex diff is reduced to a dependency-ordered list of actions (create table, add index, etc.).
7. **Generate SQL.** The action list is handed off to a database-specific provider to generate the required SQL.

### Applying

This section runs only for an `Apply` operation. It takes the compiled plan and executes it against the database.

1. **Execute the migration.** Takes the compiled migration from the Planning phase, and executes it against the target.
2. **State capture.** After a successful apply, the resulting schema is captured to the state store (if configured) so 
   that future plans can be generated against it.

### Refresh

The `Refresh` operation captures the current live schema to the state store without doing any planning or applying. This
is useful for recording drift that happened between applies, or for initializing the state store with the current schema.

## Schemas: desired and current

The **desired** schema comes from the SQL DDL files registered with `AddDdlSchemas(...)`. That method may be called more 
than once (for example a base set plus an environment overlay) and the sources are aggregated into a single schema before 
planning, so you can freely split a schema across many files and directories.

The **current** schema has two possible sources, selected automatically per operation:

- **Online.** The live database, read through an `ISchemaProvider` registered via `UseCurrentSchema<T>()` or a provider package like `UseCurrentSchemaPostgres(...)`.
- **Offline.** A persisted snapshot, available when an `ISchemaStateStore` is registered via `UseStateStore<T>()` / `UseFileStateStore(...)`.

`Plan` operations prefer the offline snapshot when one is available (so planning works without a database connection); `Apply` always reads from the live database.

### Schema scope

By default, a run's scope is the full set of schemas declared in your desired DDL. You can narrow it per run with the 
`Schemas` argument on the operation (e.g. `app.Plan(new PlanArguments { Schemas = ["app"] })`). The live `ISchemaProvider` 
is then asked only for those schemas. `GetSchema(...)` takes the names to read and returns everything it describes when 
none are given.

## Schema policies

Schema policies are used to validate the desired schema before any comparison or planning is done. This is where you can 
enforce naming conventions, required columns, banned types, or any other rules you want to apply to your schema.

Schema policies are implemented using `ISchemaPolicy` and are registered with `AddSchemaPolicy<T>()`. If the policy 
returns any errors, execution will halt, preventing bad schemas from being applied.

## Diff policies

Diff policies validate the structured diff between the current and desired schema before a plan is built. This is where 
you enforce rules about what kinds of changes are allowed, for example preventing destructive actions like dropping 
tables or columns (the built-in destructive-action policy lives here).

Diff policies are implemented using `IDiffPolicy` and registered with `AddDiffPolicy<T>()`. If any policy returns errors, 
execution will halt, preventing bad changes from being applied.

## SQL generation and execution

Once the plan is validated, NSchema turns it into SQL and, for an apply, runs it. These are two separate steps, so a plan 
can be previewed without a live connection:

- `ISqlGenerator` turns the plan into a `SqlPlan`. This is pure string-building, so the SQL preview works offline; it's 
  supplied by a database provider like `NSchema.Postgres` and registered with `UseSqlGenerator<T>()` (a provider package's 
  `UseCurrentSchemaPostgres(...)` wires it up for you). Only one generator is registered at a time; with none set, plans
  are still computed and reported, just without a SQL preview.
- `ISqlExecutor` runs the `SqlPlan` against the database, applying the configured transaction mode. It is internal, and the only online step.

The rendered preview is produced by `ISqlPlanRenderer` (default `DefaultSqlPlanRenderer`). Register a custom one with 
`UseSqlPlanRenderer<T>()` to change the preview format, mirroring how `IDiffRenderer` controls the diff output.
