---
title: Getting help & reporting issues
description: Where to ask questions, report bugs, request features, and disclose
  security issues.
sidebar:
  order: 5
slug: v3/project/support
---

NSchema is an open-source project. The best place to get help or report a problem is the relevant GitHub repository. See
the [repository map](/v3/project/contributing/#the-repositories).

## Asking a question

If something in the docs doesn't make sense, or something is outright missing, please open an issue on the repo and I'll
see about pointing you in the right direction, or fixing it.

## Reporting a bug

I'd love to hear about your bugs! They'll make the project better. Please try and include as much info as you can. A
working reproduction would be ideal, but I know that's not always possible. Just let me know:

* **What you did.** The command you ran, or a minimal snippet of the DDL / configuration involved.
* **What you expected.** What did you think would happen, and what *actually* happened? (error messages, the plan output, exit code).
* **Your environment.** Let me know the NSchema CLI version (`nschema --version`), the database engine and version, and your operating system.

For unexpected plans or migrations, the output of `nschema plan` (and a saved [plan file](/v3/cli/commands/plan/) where relevant) is especially helpful.

## Requesting a feature

Feature requests are welcome: open an issue describing the problem you're trying to solve, and we can work on a solution together.
Context about the underlying need often leads to a better outcome. It's also worth checking the [Roadmap](/v3/project/roadmap/)
first to see if it's already on the radar.
