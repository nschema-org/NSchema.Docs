---
title: completion install
description: Install nschema shell completion into your shell's startup file.
sidebar:
  order: 15.1
---

Install completion for the given shell by adding a managed block to its startup file (`~/.bashrc`, `~/.zshrc`, fish's 
`config.fish`, or the PowerShell `$PROFILE`).

```sh
nschema completion install <shell>
```

Supported shells: `bash`, `zsh`, `fish`, `pwsh`.

This inserts a small managed block into the shell's startup file that sources the completion script on each new session:

```sh
# >>> nschema completion >>>
source <(nschema completion bash)
# <<< nschema completion <<<
```

Because the block _sources_ [`nschema completion <shell>`](/cli/commands/completion/) rather than embedding a copy
of the script, your completions always track the installed binary — there's nothing to refresh after an upgrade.
Re-running the command is safe: it replaces the existing block instead of duplicating it.

Open a new shell (or re-source the startup file) to pick up completion. To remove the block again, use
[`completion uninstall`](/cli/commands/completion-uninstall/).

## Arguments

- **`shell`** — the shell to install completion for: `bash`, `zsh`, `fish`, or `pwsh`.

## Needs

Nothing. It edits your shell's startup file.
