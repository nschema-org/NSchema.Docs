---
title: Defining schemas
description: A practical introduction to declaring schemas in NSchema DDL — a declarative, dialect-agnostic schema language.
---

The desired schema is declared in **SQL DDL files** using a declarative, dialect-agnostic
schema language that borrows SQL's `CREATE TABLE` shape. You describe the *desired state* —
the final shape of the schema — and NSchema diffs it against the database and works out the
changes.

This page is a practical introduction. The [grammar reference](/ddl/grammar/) is the complete
specification, and the [type reference](/ddl/types/) lists every column type.

## A schema in DDL

```sql
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

A few things to note, each covered in full by the [grammar reference](/ddl/grammar/):

- **It describes desired state, not migrations.** There is no `ALTER` — you write the final
  shape, and the planner derives the change. Type names (`bigint`, `varchar(255)`,
  `decimal(18,2)`) are canonical and dialect-agnostic; the provider maps them to the target
  database's spelling on output.
- **Constraints are always named** (`CONSTRAINT <name> …`) — the name is the comparer's match
  key, so changes diff stably. Indexes are written **inline** in the table body.
- **Comments are doc-comments.** A `---` line (or `/** … */` block) immediately above a
  declaration becomes that object's catalog comment (`COMMENT ON …`); a plain `--` comment is
  stripped. See [Comments](/ddl/grammar/#comments).
- **Renames** use `RENAMED FROM <old>` on a schema, table, or column, so the comparer matches
  the existing object instead of dropping and recreating it.
- **Partial schemas** (`CREATE PARTIAL SCHEMA …`) leave undeclared tables alone rather than
  dropping them — useful for shared schemas. A `DROP TABLE app.x;` statement records an
  explicit drop.
- **Other objects** — views (`CREATE VIEW`), enums (`CREATE ENUM`), domains, composite types,
  sequences, functions/procedures, triggers, and extensions — each have their own statements.
  See the [grammar reference](/ddl/grammar/).

## Where the files live

With the **CLI**, the desired schema is every `*.sql` file found recursively under the project
directory (the [`--directory`](/cli/#global-flags) root). There is no format, directory, or
glob to configure — split your schema across as many files as you like (one per schema, one
per table, whatever suits). Files named `*.pre.sql` / `*.post.sql` are
[deployment scripts](/guides/deployment-scripts/), not desired schema, and
`*.env.<name>.sql` files are [environment overlays](/cli/configuration/#environments).

With the **library**, files are registered explicitly with `AddDdlSchemas` — see
[Configuration (C#)](/library/configuration/#configuring-desired-schemas).

## Doc-comments become catalog comments

A `---` doc-comment (or a `/** … */` block) immediately before a declaration becomes that
object's database comment — it emits a `COMMENT ON …` in the migration. Ordinary `--`
comments are notes for the reader and are never persisted:

```sql
-- internal: revisit index strategy           (stripped — just a note)
--- All registered users.                       (becomes the table's catalog comment)
CREATE TABLE app.users
(
    --- Primary contact; verified at signup.      (becomes the column's catalog comment)
    email text NOT NULL
);
```

## Bootstrapping from an existing database

To adopt an existing database rather than write the DDL by hand, use
[`nschema import`](/cli/commands/import/), which writes the live schema out as DDL source
files ready to check in. See [Adopting an existing database](/guides/adopting-a-database/).

## Next

- [Grammar reference](/ddl/grammar/) — the complete specification of every statement.
- [Type reference](/ddl/types/) — every column type and its canonical spelling.
