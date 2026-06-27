---
title: Extension points
description: Every interface in the NSchema pipeline you can swap or extend, and
  how to register it.
slug: 3/library/extension-points
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

| Interface            | Purpose                                                                                      | Registered via                                                                      |
|----------------------|----------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------|
| `IDiffRenderer`      | Customize how the migration diff is rendered to text (e.g. JSON instead of Terraform-style). | `UseTerraformRenderer(...)` / `UseDiffRenderer<TRenderer>()`                        |
| `ISqlPlanRenderer`   | Customize how the SQL preview is rendered to text (e.g. JSON for CI).                        | `UseSqlPlanRenderer<TRenderer>()`                                                   |
| `ISchemaRenderer`    | Customize how a schema is rendered to text (used by `Show`/`Import`-style output).           | `UseSchemaRenderer<TRenderer>()`                                                    |
| `IOperationReporter` | Customize run output (e.g. JSON instead of human-readable).                                  | `UseReporter<T>()` / `UseReporter(instance)` (replaces the default; last call wins) |
