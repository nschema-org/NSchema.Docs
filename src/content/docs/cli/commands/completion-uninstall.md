---
title: completion uninstall
description: Remove the nschema shell-completion block from your shell's startup file.
sidebar:
  order: 15.2
---

Remove the managed completion block that [`completion install`](/cli/commands/completion-install/) added to the
shell's startup file (`~/.bashrc`, `~/.zshrc`, fish's `config.fish`, or the PowerShell `$PROFILE`).

```sh
nschema completion uninstall <shell>
```

Supported shells: `bash`, `zsh`, `fish`, `pwsh`.

It removes exactly the block delimited by the `# >>> nschema completion >>>` markers — content you added yourself
is left untouched. If no managed block is present, the command does nothing. Open a new shell (or re-source the
startup file) for the change to take effect.

## Arguments

- **`shell`** — the shell to remove completion from: `bash`, `zsh`, `fish`, or `pwsh`.

## Needs

Nothing. It edits your shell's startup file.
