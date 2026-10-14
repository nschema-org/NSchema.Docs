---
title: Logical replication
description: Declaring publications and replica identity.
sidebar:
  order: 67
---

A publication is a named set of tables where row changes are published to subscribers.
NSchema manages the publishing side. Subscribers live elsewhere and carry connection details, so they are out of scope.
Publications are supported on [PostgreSQL](/databases/postgres/).

## Declaring a publication

```nsql
--- Order changes for the warehouse, drafts excluded.
CREATE PUBLICATION orders_feed
  FOR TABLE sales.orders (id, status, total) WHERE (status <> 'draft'), sales.order_lines
  PUBLISH (INSERT, UPDATE);

CREATE PUBLICATION audit_feed FOR TABLES IN SCHEMA audit;
```

A publication can publish:

- every table in the database, with `FOR ALL TABLES`
- whole schemas, present and future, with `TABLES IN SCHEMA`
- individual tables, each optionally narrowed to some columns and to the rows matching a `WHERE` filter.

`PUBLISH` lists the operations sent. Leave it out to publish all four: `INSERT`, `UPDATE`, `DELETE` and `TRUNCATE`. The
full syntax is in the [grammar](/nsql/grammar/#publications).

Publications are database-global, like [extensions](/nsql/grammar/#extensions). Only a publication your project declares
is [managed](/guides/state/#the-managed-set), so one created by another tool, such as a CDC connector creating its own, is
never compared or dropped.

## Replica identity

When a subscriber receives an update or a delete, it needs something to find the matching row by. That is the table's
**replica identity**:

```nsql
CREATE TABLE sales.events (
  id int NOT NULL,
  kind varchar(20) NOT NULL
) REPLICA IDENTITY FULL;
```

| Clause                            | The row is identified by                           |
|-----------------------------------|----------------------------------------------------|
| *(none)*                          | The engine's default                               |
| `REPLICA IDENTITY FULL`           | Every column                                       |
| `REPLICA IDENTITY USING INDEX ix` | A unique index on the table                        |
| `REPLICA IDENTITY NOTHING`        | Nothing, so updates and deletes can't be published |

Omitting the clause means **the engine's default**, not any particular engine's spelling of it. On PostgreSQL that is the
primary key.

## What NSchema checks

| Code                             | Severity | When                                                                                                                   |
|----------------------------------|----------|------------------------------------------------------------------------------------------------------------------------|
| `unidentified-published-table`   | warning  | A table published for updates or deletes has no primary key and no replica identity, so the engine will reject them.   |
| `filter-outside-identity`        | warning  | A row filter reads columns the row's identity doesn't include, so updates and deletes may be rejected.                |
| `publication-renamed`            | warning  | A publication is renamed. Its subscribers still use the old name and must be updated separately.                        |
| `unknown-published-column`       | error    | A column list names a column the table doesn't declare.                                                                |
| `unknown-replica-identity-index` | error    | A replica identity names an index the table doesn't declare as unique.                                                 |

Dropping a publication is a [destructive change](/guides/destructive-actions/), and so is switching one between
`FOR ALL TABLES` and a list, since that can only be done by dropping and recreating it. Either cuts off its subscribers.

## Renaming a publication

```nsql
CREATE PUBLICATION orders_feed FOR TABLE sales.orders;

RENAME PUBLICATION legacy_feed TO orders_feed;
```

A [rename](/nsql/grammar/#renames) keeps the publication rather than dropping and recreating it, but subscribers name the
publication they read from, so the plan warns that they need to be pointed at the new name.

## Changing what a filter reads

A row filter is opaque SQL, but NSchema scans it for the columns it reads. When a plan changes the type of one of those
columns, the table is taken out of the publication before the change and put back after it, because PostgreSQL won't
retype a column a publication filter depends on.
