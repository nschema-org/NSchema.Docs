---
title: Templates
description: Declare a group of objects or table members once and reuse it across schemas and tables
sidebar:
  order: 45
---

Some structures repeat across a database: an identical outbox table in every subdomain schema, the same `created_at` / `updated_at` 
audit columns on every table. Templates let you declare the structure once and apply/include it wherever it's needed, and 
when the template is updated, the changes are applied out across every application.

Templates come in two granularities: schema templates hold whole objects and are `APPLY`ed to schemas, while table templates 
hold table members (columns, constraints, indexes) and are `INCLUDE`ed from within a table body.

## Schema templates

A schema template declares a named group of objects; `APPLY TEMPLATE` applies it into each listed schema:

```sql
TEMPLATE outbox
BEGIN
  CREATE ENUM outbox_status ('pending', 'sent');

  CREATE TABLE outbox (
    id      uuid NOT NULL,
    status  outbox_status NOT NULL,
    payload text NOT NULL,
    CONSTRAINT pk_outbox PRIMARY KEY (id)
  );

  CREATE INDEX ix_outbox_status ON outbox (status);

  GRANT SELECT, INSERT ON outbox TO svc;
END;

APPLY TEMPLATE outbox IN SCHEMA billing, ordering, shipping;
```

This produces an identical `outbox` table, enum, index, and grant in all three schemas, exactly as if each had been written 
separately. Adding a new schema later is one edit to the `APPLY TEMPLATE` list, or a new `APPLY TEMPLATE` statement.

Names inside the body follow one rule: an unqualified name binds to the schema the template is applied to; a qualified name 
escapes to the schema it names. Above, `outbox_status` becomes `billing.outbox_status` in the `billing` schema, while a 
reference like `public.typeid` remains pointing at `public` in every use. The same rule covers foreign keys between 
templated tables and the functions templated triggers execute.

## Table templates

A table template (`FOR TABLE`) declares reusable table members, and a table pulls them in with an `INCLUDE` member:

```sql
TEMPLATE audit_columns FOR TABLE
BEGIN
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_audit CHECK (updated_at >= created_at)
END;

CREATE TABLE billing.invoices (
  id uuid NOT NULL,
  INCLUDE audit_columns,
  total decimal(18,2) NOT NULL,
  CONSTRAINT pk_invoices PRIMARY KEY (id)
);
```

The template's columns land where the `INCLUDE` is written — `invoices` has `id`, `created_at`, `updated_at`, `total`, in that order.

The two granularities compose: a table declared inside a schema template can itself `INCLUDE` a table template, and each
instance resolves the include against its own schema.

:::caution
Index names (and the names of primary key, unique, and exclusion constraints, which are backed by indexes) are schema-scoped 
in the database. A table template carrying an index works when included by one table per schema, but two tables in the *same* 
schema including it would collide. The `validate` command will detect this, along with any other duplicate index name in a schema.
:::

## Scripts in templates

A schema template can also carry [`SCRIPT` statements](/guides/data-migrations/#migrations-in-templates) for the tables 
it declares, so a backfill travels with the template instead of being repeated for every schema.

## Renames in templates

A schema template body may also carry object-level [`RENAME` directives](/nsql/grammar/#directives), so renaming a templated table can be done in one place:

```sql
TEMPLATE outbox
BEGIN
  RENAME TABLE outbox_messages TO outbox;
  -- …the declarations…
END;
```

Only the object-level kinds belong in a template (`TABLE`, `COLUMN`, `VIEW`, `ENUM`, `DOMAIN`, `TYPE`, `SEQUENCE`,
routines). `RENAME SCHEMA` is rejected.
