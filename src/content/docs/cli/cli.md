---
title: CLI Reference
description: Every nschema command, the global flags they share, and how configuration is resolved.
---

The `nschema` CLI resolves your project's configuration and runs **one operation per
invocation**. This section documents every command in detail; the pages below cover the
cross-cutting pieces they all share.

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

- **`--directory <dir>`** — the project directory to run in. The `.sql` files and any
  relative paths declared in them resolve against it, like `terraform -chdir`. Defaults to
  the current directory.
- **`--environment <name>`** — target environment. Layers the matching `*.env.<name>.sql`
  overlay files over the base configuration. *(env `NSCHEMA_ENVIRONMENT`)* See
  [Environments](/cli/configuration/#environments).
- **`--no-color`** — disable colored output. *(env `NO_COLOR`)*
- **`--json`** — emit machine-readable NDJSON output instead of formatted text.
- **`--verbose`** / **`--quiet`** — raise or lower output verbosity.
- **`--help`** — show contextual help for the command.

## Where configuration comes from

Settings are resolved from three layers, in increasing order of precedence:

1. **[Configuration blocks](/cli/configuration/)** in your `.sql` files — `NSCHEMA`,
   `PROVIDER`, and `BACKEND`.
2. **[Environment variables](/cli/environment-variables/)** — `NSCHEMA_*` and `NO_COLOR`.
3. **Command-line options** — the flags documented on each command page.

The *where* of your project (which database, which state store) lives in config blocks; the
*what* (your schema) lives in the `.sql` files; and CLI flags are the per-run workflow knobs.

## The exit-code contract

Every command follows the same [exit-code contract](/cli/exit-codes/) so scripts and CI can
branch on the result without parsing output.
