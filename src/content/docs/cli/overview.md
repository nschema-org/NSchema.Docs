---
title: CLI Reference
description: Every nschema command, the global flags they share, and how configuration is resolved.
---

The `nschema` CLI resolves your project's configuration and runs one operation per invocation. This section documents 
every command in detail; the pages below cover the cross-cutting pieces they all share.

## Commands at a glance

| Command                                       | What it does                                              |
|-----------------------------------------------|-----------------------------------------------------------|
| [`init`](/cli/commands/init/)                 | Scaffold a new project in the current directory.          |
| [`validate`](/cli/commands/validate/)         | Check that the desired-schema files are well-formed.      |
| [`fmt`](/cli/commands/fmt/)                   | Reformat `.sql` files to a canonical layout.              |
| [`plan`](/cli/commands/plan/)                 | Compute and show the migration plan, changing nothing.    |
| [`apply`](/cli/commands/apply/)               | Compute the plan and apply it to the database.            |
| [`refresh`](/cli/commands/refresh/)           | Read the live schema and write it to the state store.     |
| [`import`](/cli/commands/import/)             | Write the live schema out as desired-schema files.        |
| [`destroy`](/cli/commands/destroy/)           | Drop all managed schema objects from the database.        |
| [`show`](/cli/commands/show/)                 | Print the schema recorded in the state store.             |
| [`drift`](/cli/commands/drift/)               | Report how the live database differs from recorded state. |
| [`force-unlock`](/cli/commands/force-unlock/) | Forcibly release a stale state-store lock.                |
| [`completion`](/cli/commands/completion/)     | Output a shell tab-completion script.                     |

## Global flags

Every command accepts these:

- **`--directory <dir>`** Sets the current working directory for `nschema`.
- **`--environment <name>`** Sets the target environment. Layers the matching `*.env.<name>.sql` overlay files over the base configuration. *(env `NSCHEMA_ENVIRONMENT`)* See [Environments](/cli/configuration/#environments).
- **`--no-color`** Disables colored output. *(env `NO_COLOR`)*
- **`--json`** Emits machine-readable NDJSON output instead of formatted text.
- **`--verbose`** / **`--quiet`** Raises or lowers output verbosity.
- **`--help`** Shows contextual help for the command.

## Where configuration comes from

Settings are resolved from three layers, in increasing order of precedence:

1. **[Configuration blocks](/cli/configuration/).** Config in your `.sql` files; `NSCHEMA`, `PROVIDER`, and `BACKEND` blocks.
2. **[Environment variables](/cli/environment-variables/).** `NSCHEMA_*` and `NO_COLOR`.
3. **Command-line options.** The flags documented on each command page.

## The exit-code contract

Every command follows the same [exit-code contract](/cli/exit-codes/) so scripts and CI can branch on the result without parsing output.
