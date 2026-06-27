---
title: Roadmap
description: The direction NSchema is heading.
sidebar:
  order: 2
slug: 3/project/roadmap
---

This page describes the direction of the project, my intent and ideas. This project is worked on in my spare time, and
nothing here is a commitment to ship anything. If something here matters to you, the best way to influence it is by
[opening an issue or discussion](/v3/project/support/).

## Where things stand

The core engine, the `nschema` CLI, and three database providers: PostgreSQL, SQL Server, and SQLite, are built, published,
and usable today. The declarative workflow (`plan` / `apply` / `destroy`), saved plan files, drift detection, state
backends, and the embeddable `NSchema.Core` library are all in place, and there are no major functionality gaps when
compared with analogous tools like Terraform.

## Active

In the meantime, though, NSchema is very fresh, and would benefit from some solid battle-testing, so I can be confident
that it runs in real environments as well as it does across hundreds of integration tests. To that end, I'm currently
focusing on fixes and improvements, until I'm sure I've found all the sharp edges, and tightened any loose bolts.

## Planned

As I see it, the biggest gap is in backend and provider support, and that's where the next feature push should be:

* **More providers.** Broadening database support to include: Oracle, MySql, Snowflake.
* **More state backends.** Additional remote backends including: Azure Blob Storage and whatever thing Google Cloud has.
* **Deeper PostgreSQL fidelity.** Coverage of more advanced objects and options (e.g. index operator classes, row-level security, partitioning).

## Launched

Shipped changes are recorded per package in the [Changelog](/v3/changelog/cli/). For day-to-day progress and discussion,
watch the repositories listed on the [Contributing](/v3/project/contributing/) page.
