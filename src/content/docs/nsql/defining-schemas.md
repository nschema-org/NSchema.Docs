---
title: Defining schemas
description: A practical introduction to declaring schemas in NSQL.
---

The desired schema is declared in **NSQL**, a dialect-neutral flavor of SQL with some extensions to support concepts like
configuration, scripts, and renames. This page is intended as a practical introduction. The complete specification can be 
found over at the  [grammar reference](/nsql/grammar/). Type support is described on the [type reference](/nsql/types/) page.

## A schema in NSQL

```nsql
--- The application schema.
CREATE SCHEMA app;

--- All registered users.
CREATE TABLE app.users
(
    id bigint NOT NULL IDENTITY,
    --- Primary contact; verified at signup.
    email varchar(255) NOT NULL,
    name text NOT NULL,
    role_id bigint NOT NULL,
    balance decimal(18, 2) DEFAULT (0),
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT fk_users_role_id FOREIGN KEY (role_id) REFERENCES app.roles (id) ON DELETE CASCADE,
    UNIQUE INDEX uc_users_email (email)
);

GRANT SELECT, INSERT ON app.users TO app_rw;
```

A few things to note, each covered in full by the [grammar reference](/nsql/grammar/):

- **Objects are always named.** Object names are how the comparer produces a stable diff, so names are required for
  constraints, indexes and keys.
- **Names are case-sensitive**, and may be [quoted](/nsql/grammar/#identifiers) when they need to carry spaces, dots, or
  a word the grammar reserves: `CREATE TABLE app."Order Details" (…)`.
- **Catalog comments are supported.** A `---` line (or `/** … */` block) immediately before a declaration becomes that 
  object's catalog comment (`COMMENT ON …`). See [Comments](/nsql/grammar/#comments).
- **You never write a drop.** Deleting a declaration is what drops the object. There is no `DROP` statement, and NSchema
  only ever drops something it [manages](/guides/state/#the-managed-set).
- **Renames are directives.** A `RENAME TABLE app.users TO accounts;` statement tells the comparer the object is the same
  one under a new name, instead of a drop and a create. See [Directives](/nsql/grammar/#directives) for more.
- **Other objects.** Other types like views (`CREATE VIEW`), enums (`CREATE ENUM`), domains, composite types, sequences, 
  functions/procedures, triggers, and extensions each have their own statements. See the [grammar reference](/nsql/grammar/).
- **Repeated structures.** The same table in several schemas, or the same columns on many tables, can be declared once
  as a [template](/guides/templates/) (`TEMPLATE … BEGIN … END`) and instantiated with `APPLY TEMPLATE` or an `INCLUDE` table member.

## Where the files live

The schema is every `*.sql` file found recursively under the project directory, including the
[environment overlays](/cli/configuration/#environments) (`*.env.<name>.sql`) for the selected environment. Split your 
schema across as many files as you like.

## Doc-comments become catalog comments

A `---` doc-comment (or a `/** … */` block) immediately before a declaration becomes that object's database comment by 
emitting a `COMMENT ON …` in the migration. Ordinary `--` comments are notes for the reader and are never persisted:

```nsql
-- internal: revisit index strategy             (stripped; it's just a note)
--- All registered users.                       (becomes the table's catalog comment)
CREATE TABLE app.users
(
    --- Primary contact; verified at signup.    (becomes the column's catalog comment)
    email text NOT NULL
);
```

Both kinds survive a [`format`](/cli/commands/format/): parsing is lossless, so the formatter rewrites layout without ever
losing a comment or changing what a statement means.

## Bootstrapping from an existing database

To adopt an existing database rather than write the schema by hand, use [`nschema import`](/cli/commands/import/), which
writes the live schema out as NSQL source files ready to check in. See
[Adopting an existing database](/guides/adopting-a-database/).

## More reading

- [Grammar reference](/nsql/grammar/). The complete specification of every statement.
- [Type reference](/nsql/types/). Every column type and its canonical spelling.
