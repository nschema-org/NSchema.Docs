---
title: CLI Reference
description: Every nschema command, the global flags they share, and how
  configuration is resolved.
slug: v4/cli
---

The `nschema` CLI resolves your project's configuration and runs one operation per invocation. This section documents
every command in detail; the pages below cover the cross-cutting pieces they all share.

## Commands at a glance

| Command                                       | What it does                                               |
|-----------------------------------------------|------------------------------------------------------------|
| [`scaffold`](/v4/cli/commands/scaffold/)         | Scaffold a new project in the current directory.           |
| [`init`](/v4/cli/commands/init/)                 | Restore the provider/backend plugins pinned in the config. |
| [`validate`](/v4/cli/commands/validate/)         | Check that the desired-schema files are well-formed.       |
| [`fmt`](/v4/cli/commands/fmt/)                   | Reformat `.sql` files to a canonical layout.               |
| [`plan`](/v4/cli/commands/plan/)                 | Compute and show the migration plan, changing nothing.     |
| [`apply`](/v4/cli/commands/apply/)               | Compute the plan and apply it to the database.             |
| [`refresh`](/v4/cli/commands/refresh/)           | Read the live schema and write it to the state store.      |
| [`import`](/v4/cli/commands/import/)             | Write the live schema out as desired-schema files.         |
| [`destroy`](/v4/cli/commands/destroy/)           | Drop all managed schema objects from the database.         |
| [`state`](/v4/cli/commands/state/)               | Inspect the schema recorded in the state store.            |
| [`db`](/v4/cli/commands/db/)                     | Inspect the live database schema directly.                 |
| [`drift`](/v4/cli/commands/drift/)               | Report how the live database differs from recorded state.  |
| [`doctor`](/v4/cli/commands/doctor/)             | Check the database and state store are reachable.          |
| [`lock`](/v4/cli/commands/lock/)                 | Inspect, hold, or release the state-store lock.            |
| [`plugin`](/v4/cli/commands/plugin/)             | Inspect the project's plugins and manage the plugin cache. |
| [`completion`](/v4/cli/commands/completion/)     | Output a shell tab-completion script.                      |

## Global flags

Every command accepts these:

* **`-C`, `--directory <dir>`** Sets the current working directory for `nschema`.
* **`-e`, `--environment <name>`** Sets the target environment. Layers the matching `*.env.<name>.sql` overlay files over the base configuration. *(env `NSCHEMA_ENVIRONMENT`)* See [Environments](/v4/cli/configuration/#environments).
* **`--no-color`** Disables colored output. *(env `NO_COLOR`)*
* **`--no-init`** Skips the implicit plugin restore and requires the pinned plugins to be cached already. See [`init`](/v4/cli/commands/init/#skipping-the-implicit-restore).
* **`--format <text|json|markdown>`** Selects the output format. `text` (the default) is the formatted console output; `json` is machine-readable NDJSON; `markdown` renders the result for a PR comment or CI job summary. See [Output formats](#output-formats).
* **`--json`** Shorthand for `--format json`. (Passing both `--json` and a conflicting `--format` is an error.)
* **`-v`, `--verbose`** / **`-q`, `--quiet`** Raises or lowers output verbosity.
* **`-h`, `--help`** Shows contextual help for the command.

## Output formats

`--format` chooses how a command's structured result (a plan diff, the SQL to run, a schema) is rendered:

* **`text`** — colorized, human-readable console output. The default.
* **`json`** — newline-delimited JSON (one event per line) for scripting. The results go to stdout; progress narration goes to stderr.
* **`markdown`** — the plan diff (as a fenced ` ```diff ` block coloring adds, drops, and changes), the SQL (as a ` ```sql ` block), and any schema output, rendered as Markdown. Like `json`, results go to stdout and progress to stderr, so you can pipe a clean summary straight into CI:

```bash
nschema plan --format markdown >> "$GITHUB_STEP_SUMMARY"
```

## Where configuration comes from

Two kinds of setting are resolved separately:

* **Where the schema lives** — the provider and state backend — comes only from the **[`PROVIDER` / `BACKEND` config blocks](/v4/cli/configuration/)** in your `.sql` files. (A provider plugin then reads its own settings, including its `NSCHEMA_<PROVIDER>_*` environment variables.)
* **Command behavior** — the flags documented on each command page — is resolved per flag as **[environment variable](/v4/cli/environment-variables/) \< command-line option** (the flag wins).

## The exit-code contract

Every command follows the same [exit-code contract](/v4/cli/exit-codes/) so scripts and CI can branch on the result without parsing output.
