---
title: Defining schemas
description: A practical introduction to declaring schemas in NSchema DDL.
slug: 3/ddl/defining-schemas
---

The desired schema is declared using a dialect-neutral flavor of SQL with some extensions to support concepts like
config, deployment scripts, renames, etc. This page is intended as a practical introduction. The [grammar reference](/v3/ddl/grammar/)
is the complete specification, and the [type reference](/v3/ddl/types/) lists supported column types.

## A schema in DDL

```sql
--- The application schema.
CREATE PARTIAL SCHEMA app;

--- All registered users.
CREATE TABLE app.users
(
    id bigint NOT NULL IDENTITY,
    --- Primary contact; verified at signup.
    email varchar(255) NOT NULL,
    name text NOT NULL,
    role_id bigint NOT NULL RENAMED FROM roleid,
    balance decimal(18, 2) DEFAULT (0),
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT fk_users_role_id FOREIGN KEY (role_id) REFERENCES app.roles (id) ON DELETE CASCADE,
    UNIQUE INDEX uc_users_email (email)
);

GRANT SELECT, INSERT ON app.users TO app_rw;
```

A few things to note, each covered in full by the [grammar reference](/v3/ddl/grammar/):

* **Objects are always named.** Object names are how the comparer produces a stable diff, so names are required for
  constraints, indexes and keys.
* **Catalog comments are supported.** A `---` line (or `/** … */` block) immediately before a declaration becomes that
  object's catalog comment (`COMMENT ON …`). See [Comments](/v3/ddl/grammar/#comments).
* **Renames** use `RENAMED FROM <old_name>` on a schema, table, or column, so the comparer matches the existing object
  instead of dropping and recreating it.
  **Partial schemas** (`CREATE PARTIAL SCHEMA …`) leave undeclared tables alone rather than dropping them. This is useful
  for shared schemas or while migrating to NSchema. A `DROP TABLE app.x;` statement still records an explicit drop.
* **Other objects**. Other types like views (`CREATE VIEW`), enums (`CREATE ENUM`), domains, composite types, sequences,
  functions/procedures, triggers, and extensions each have their own statements. See the [grammar reference](/v3/ddl/grammar/).

## Where the files live

The desired schema is made up of every `*.sql` file found recursively under the project directory. Split your
schema across as many files as you like (one per schema, one per table, whatever suits). [Deployment scripts](/v3/guides/deployment-scripts/) live
inline in those same files as `PRE`/`POST DEPLOYMENT` blocks, and `*.env.<name>.sql` files can be used for environment-
specific objects and config. See [environments](/v3/cli/configuration/#environments).

## Doc-comments become catalog comments

A `---` doc-comment (or a `/** … */` block) immediately before a declaration becomes that object's database comment by
emitting a `COMMENT ON …` in the migration. Ordinary `--` comments are notes for the reader and are never persisted:

```sql
-- internal: revisit index strategy             (stripped; it's just a note)
--- All registered users.                       (becomes the table's catalog comment)
CREATE TABLE app.users
(
    --- Primary contact; verified at signup.    (becomes the column's catalog comment)
    email text NOT NULL
);
```

## Bootstrapping from an existing database

To adopt an existing database rather than write the DDL by hand, use [`nschema import`](/v3/cli/commands/import/), which writes the live
schema out as DDL source files ready to check in. See [Adopting an existing database](/v3/guides/adopting-a-database/).

## More reading

* [Grammar reference](/v3/ddl/grammar/). The complete specification of every statement.
* [Type reference](/v3/ddl/types/). Every column type and its canonical spelling.
