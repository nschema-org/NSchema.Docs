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

## Enabling completion

Source the script in your current shell, or install it permanently:

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

## Needs

Nothing — it only writes a script to stdout.
