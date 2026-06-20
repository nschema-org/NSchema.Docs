---
title: Local file backend
draft: true
description: Persist NSchema state to a JSON file on the local filesystem.
---

The **local file** backend persists state to a JSON file on the local filesystem. It's the
simplest option — good for a single operator, or for checking state into source control.

Declare it with a `BACKEND file` [config block](/cli/configuration/):

```sql
BACKEND file (
  path = './nschema.state.json'
);
```

## Attributes

| Attribute | Type   | Description                                                                                                         |
|-----------|--------|---------------------------------------------------------------------------------------------------------------------|
| `path`    | string | Path to the state file. Relative paths resolve against the project directory ([`--directory`](/cli/#global-flags)). |

Any attribute not listed here is rejected — a typo surfaces as an error rather than being
silently ignored.

## When to use it

A file backend is ideal when a single machine or person owns the state — local development, or
a setup where the state file is committed to the repository. For a team or CI where many
runners need one shared source of truth, prefer the [Amazon S3 backend](/backends/s3/).

## Locking

NSchema locks the state file during write operations so concurrent runs can't corrupt it. See
[Locking](/backends/#locking).
