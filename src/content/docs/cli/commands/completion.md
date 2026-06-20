---
title: nschema completion
draft: true
description: Output a shell tab-completion script for nschema.
sidebar:
  label: completion
  order: 12
---

Output a shell tab-completion script for `nschema`. NSchema is its own completion provider,
so no external tool (such as `dotnet-suggest`) is required.

```sh
nschema completion <shell>
```

Supported shells: `bash`, `zsh`, `fish`, `pwsh`.

## Installing automatically

The quickest way to enable completion permanently is `--install-autocomplete`, which wires it
into your shell's startup file for you:

```sh
nschema completion bash --install-autocomplete
```

This inserts a small managed block into the shell's startup file — `~/.bashrc`, `~/.zshrc`,
`~/.config/fish/config.fish`, or the PowerShell `$PROFILE` — that sources the completion script
on each new session:

```sh
# >>> nschema completion >>>
source <(nschema completion bash)
# <<< nschema completion <<<
```

Because the block _sources_ `nschema completion <shell>` rather than embedding a copy of the
script, your completions always track the installed binary — there's nothing to refresh after an
upgrade. Re-running the command is safe: it replaces the existing block instead of duplicating it.

Open a new shell (or re-source the startup file) to pick up completion. To remove the block again:

```sh
nschema completion bash --uninstall-autocomplete
```

## Installing manually

Prefer to manage it yourself? Source the script in your current shell, or write it to your shell's
completion directory:

import { Tabs, TabItem } from "@astrojs/starlight/components";

<Tabs>
  <TabItem label="bash">
    ```sh
    # current shell
    source <(nschema completion bash)
    # install permanently
    nschema completion bash > /etc/bash_completion.d/nschema
    ```
  </TabItem>
  <TabItem label="zsh">
    ```sh
    # current shell
    source <(nschema completion zsh)
    # install permanently
    nschema completion zsh > "${fpath[1]}/_nschema"
    ```
  </TabItem>
  <TabItem label="fish">
    ```sh
    # current shell
    nschema completion fish | source
    # install permanently
    nschema completion fish > ~/.config/fish/completions/nschema.fish
    ```
  </TabItem>
  <TabItem label="pwsh">
    ```powershell
    # current session
    nschema completion pwsh | Out-String | Invoke-Expression
    # install permanently: add that line to your $PROFILE
    ```
  </TabItem>
</Tabs>

## Options

- **`--install-autocomplete`** — instead of printing the script, install completion for the given
  shell by adding a managed block to its startup file.
- **`--uninstall-autocomplete`** — remove the managed block that `--install-autocomplete` added.

## Needs

Nothing — it writes a completion script to stdout, or (with the install flags) edits your shell's
startup file.
