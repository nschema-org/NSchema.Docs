---
title: Extension points
description: Every interface in the NSchema pipeline you can swap or extend, and how to register it.
---

Everything in the pipeline is registered through DI. You can replace defaults or add to the enumerable extension points.

| Interface                          | Purpose                                                                     | Registered via                                                                                        |
|------------------------------------|-----------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| SQL DDL files (desired)            | The desired schema and any inline `PRE/POST DEPLOYMENT` scripts.            | `AddDdlSchemas(...)` (may be called more than once; sources aggregate)                                |
| `ISchemaProvider` (online current) | Read the current live database schema.                                      | `UseCurrentSchema<T>()` (or via a provider package, e.g. `UseCurrentSchemaPostgres(...)`)             |
| `ISchemaPolicy`                    | Validate the merged desired schema.                                         | `AddSchemaPolicy<T>()`                                                                                |
| `IDiffPolicy`                      | Validate the structured diff (e.g. the built-in destructive-action policy). | `AddDiffPolicy<T>()`                                                                                  |
| `ISqlGenerator`                    | Generate the SQL for a migration plan. Add support for another database.    | `UseSqlGenerator<T>()` (usually wired up by a provider package, e.g. `UseCurrentSchemaPostgres(...)`) |
| `ISchemaStateStore`                | Optional backend state store for tracking the last applied schema.          | `UseStateStore<T>()` / `UseStateStore(instance)` / `UseFileStateStore(path)`                          |
| `IStateLock`                       | Optional lock guarding concurrent writes to the state store.                | `UseStateLock<T>()` / `UseStateLock(instance)` / `UseFileStateLock(path)`                             |

## Less commonly used extension points

These extension points are less commonly used, but still available for advanced scenarios.

| Interface                      | Purpose                                                                                                          | Registered via                                               |
|--------------------------------|------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------|
| `IProgress<OperationProgress>` | Receive an operation's live progress narration while it runs (e.g. forward it to a logger or a structured sink). | `UseProgressReporter<T>()`                                   |
