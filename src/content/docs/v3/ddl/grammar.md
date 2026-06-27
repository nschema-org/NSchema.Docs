---
title: NSchema DDL grammar
description: The complete reference for the NSchema DDL.
slug: 3/ddl/grammar
---

NSchema DDL stays as true to standard SQL as possible, for maximum familiarity and compatibility. It should read instantly
to anyone who works with databases, but it is its own bounded language, **not** a SQL dialect. It describes *desired state*:
you write the final shape of the schema, never migration steps. Every construct maps 1:1 onto the `DatabaseSchema` domain
model, so the parser is a thin front-end over that model. This means that unsupported models won't parse, so you'll never
accidentally script an object that isn't covered.

It is dialect-agnostic by construction: dialect-specific spelling (type names like `serial`, expression functions like
`now()`) is considered an *output* concern owned by the provider, not the input grammar. Some places raw, possibly
dialect-flavored SQL is accepted are: views, functions, triggers, `DEFAULT`, `CHECK (…)`, and index `WHERE` expressions.
All of these are treated as opaque strings and passed verbatim.

## Design decisions

These were settled deliberately; the rationale matters for anyone extending the grammar.

1. **Declarative, not imperative.** The grammar has no `ALTER`/migration-step productions. A parse of `ALTER …` is a
   parser error directing the author to express the final state, which is why we don't use SQL directly: no worrying about
   whether statements are valid.
2. **Canonical types, dialect output.** Input types map to `SqlType`; unknown type names become `SqlType.Custom(raw)`.
   Dialect translation happens only in the generator.
3. **Fixed column-modifier order.** Modifiers appear in one canonical order (below). Order-flexibility is parser cost
   with no authoring benefit for a generated/canonical format.
4. **Constraint names are always required.** Every constraint is written `CONSTRAINT <name>…`. The name is the comparer's
   match key (its diff identity); anonymous constraints can't diff stably, so they are not allowed.
5. **Grants are statements**, not table-body items. They're cross-cutting (one role across many objects), which matches `GRANT` in real SQL.

## Lexical

```ebnf
(* ignored: ordinary source comments and whitespace *)
line-comment   = "--" , { any-char - newline } ;
block-comment  = "/*" , { any-char } , "*/" ;

(* captured: doc-comments, attached to the following declaration (see Comments) *)
doc-line       = "---" , { any-char - newline } ;
doc-block      = "/**" , { any-char } , "*/" ;

ident          = ( letter | "_" ) , { letter | digit | "_" } ;
qualified-name = ident , "." , ident ;            (* schema.table, or schema.table for FK references *)
string         = "'" , { any-char - "'" | "''" } , "'" ;   (* '' escapes a single quote *)
integer        = digit , { digit } ;
```

### Expressions

`DEFAULT`, `CHECK (…)`, and index `WHERE` hold arbitrary SQL the model stores as an opaque string.

```ebnf
paren-expr     = "(" , balanced-tokens , ")" ;     (* CHECK (…), WHERE (…): capture balanced parens *)
default-expr   = token-run-until( top-level "," | top-level ")" | "COMMENT" | "RENAMED" ) ;
```

An unparenthesized `DEFAULT` expression runs until a `,` or `)` at the enclosing list's paren depth, or a reserved
column-modifier keyword. So `DEFAULT now()` and `DEFAULT coalesce(a, b)` work (their inner commas are at depth ≥ 1).
The canonical writer always parenthesizes non-trivial defaults to stay safely inside this rule.

## Comments

Both regular commands and doc comments are supported, and work the same way as `//` and `///` do in C#'s XML docs.

| Syntax          | Meaning                                                                                                  |
|-----------------|----------------------------------------------------------------------------------------------------------|
| `--`, `/* */`   | **Source comment.** A note for whoever reads the file. Stripped; never persisted.                        |
| `---`, `/** */` | **Doc-comment.** Becomes the **catalog comment** (`COMMENT ON …`) for the immediately following element. |

A doc-comment may precede any commentable declaration: a `CREATE SCHEMA`, a `CREATE TABLE`, a column, or a constraint.

```sql
-- internal: revisit index strategy           (stripped)
--- All registered users.                       (becomes the table's catalog comment)
CREATE TABLE app.users
(
    --- Primary contact; verified at signup.      (becomes the column's catalog comment)
    email text NOT NULL,
    --- Enforced at the app tier too.             (becomes the constraint's catalog comment)
    CONSTRAINT users_age_chk CHECK (age >= 0)
);
```

## Document and statements

```ebnf
document   = { [ doc-comment ] , ( statement | config-block | deployment-script ) } ;
statement  = ( create-schema | create-table | create-view | create-enum | create-domain | create-sequence
             | create-function | create-procedure | create-extension | create-trigger | create-index
             | drop-schema | drop-table | drop-view | drop-enum | drop-domain | drop-sequence
             | drop-function | drop-extension | grant ) , ";" ;
```

A flat statement list; schema membership is by qualified name, like normal SQL. A document may also contain top-level
[configuration blocks](#configuration-blocks) and [deployment scripts](#deployment-scripts).

## Configuration blocks

Orchestration configuration (the state backend, the live-database provider, project settings) live in the DDL alongside
the schema. The blocks are SQL-statement shaped, keeping one consistent grammar in the file:

```ebnf
config-block   = ident , [ ident ] , "(" , [ config-attr , { "," , config-attr } ] , ")" , ";" ;
config-attr    = config-key , "=" , config-value ;
config-key     = ident , { "." , ident } ;
config-value   = string | [ "-" ] , integer | "true" | "false" | ident ;
```

```sql
NSCHEMA (
  dialect = 'postgres',
  transaction_mode = 'single'
);

BACKEND file (
  path = 'state/app.nsstate'
);

PROVIDER postgres (
  schema_search_path = 'app',
  connection_timeout = 1000
);
```

Notes on the shape:

* The block keyword (`NSCHEMA` / `BACKEND` / `PROVIDER`) and the optional label (`file`, `postgres`) are bare identifiers
  consistent with bare identifiers everywhere else in the DDL; double quotes are still unused. `NSCHEMA` has no label.
* String **values** are single-quoted (`'postgres'`), SQL-style. Values may also be integers (optionally negative),
  `true`/`false`, or a bare identifier (`transaction_mode = single`).
* Attributes are a flat comma-separated list. Group related settings with a dotted key (`pool.max = 10`), which is captured verbatim as a single key.

The matching forward-compatibility rule for the parser: an unrecognized top-level block keyword is captured, not an error,
so a config type a front-end adds later (e.g. `WORKSPACE`) parses correctly.

:::tip
This section describes the language shape of config blocks. For the attributes the CLI recognizes, see [Configuration blocks](/v3/cli/configuration/),
[Providers](/v3/providers/), and [Backends](/v3/backends/).
:::

## Deployment scripts

Some migration steps are imperative and can't be expressed declaratively. Backfills, data fixes, etc. These can be
declared inline as deployment scripts that run as raw SQL around the computed migration: every `PRE DEPLOYMENT` body runs
before the migration's statements, every `POST DEPLOYMENT` body runs after.

```ebnf
deployment-script = ( "PRE" | "POST" ) , "DEPLOYMENT" , string ,
                    [ "(" , [ script-option , { "," , script-option } ] , ")" ] ,
                    "AS" , dollar-body , ";" ;
script-option     = ident , "=" , config-value ;
dollar-body       = "$$" , … , "$$" | "$" , tag , "$" , … , "$" , tag , "$" ;
```

```sql
POST DEPLOYMENT 'reindex' (run_outside_transaction = true) AS $$
    CREATE INDEX CONCURRENTLY idx_widgets_name ON app.widgets (name);
$$;
```

Notes on the shape:

* The name is a single-quoted string, used in plan output and logs.
* An optional `( … )` clause carries script options. The only option today is `run_outside_transaction = true`, for
  statements the database forbids inside a transaction (e.g. `CREATE INDEX CONCURRENTLY`).
* `AS` introduces the body, exactly as for a view (`CREATE VIEW … AS …`).
* The body is a dollar-quoted block (`$$ … $$` or `$tag$ … $tag$`) using the same opaque-SQL device for function bodies.
* Dollar-quoting lets the body contain its own `;` and single quotes without escaping; the inner content is taken verbatim
* (delimiters stripped, surrounding whitespace trimmed) and is not dialect-translated.

:::note
Deployment scripts run on every apply, so they must be idempotent. See [Deployment scripts](/v3/guides/deployment-scripts/).
:::

### Schemas

```ebnf
create-schema = "CREATE" , [ "PARTIAL" ] , "SCHEMA" , ident , [ "RENAMED" , "FROM" , ident ] ;
drop-schema   = "DROP" , "SCHEMA" , ident ;                (* -> DroppedSchemas *)
```

`PARTIAL` means tables not listed are left alone rather than dropped. `RENAMED FROM` sets `OldName`.

### Tables

```ebnf
create-table = "CREATE" , "TABLE" , qualified-name , [ "RENAMED" , "FROM" , ident ] ,
               "(" , table-item , { "," , table-item } , ")" ;
drop-table   = "DROP" , "TABLE" , qualified-name ;         (* -> DroppedTables (explicit drop, partial schema) *)

table-item   = [ doc-comment ] , ( column-def | pk-def | fk-def | unique-def | check-def | exclude-def | index-def ) ;
```

### Columns

```ebnf
column-def   = ident , type ,
               [ "NOT" , "NULL" | "NULL" ] ,
               [ "IDENTITY" , [ "(" , identity-opt , { "," , identity-opt } , ")" ] ] ,
               [ "DEFAULT" , ( paren-expr | default-expr ) ] ,
               [ "GENERATED" , "ALWAYS" , "AS" , paren-expr , "STORED" ] ,
               [ "RENAMED" , "FROM" , ident ] ;

identity-opt = ( "START" | "INCREMENT" | "MINVALUE" ) , integer ;
type         = ident , [ "(" , integer , [ "," , integer ] , ")" ] ;
```

Absence of `NOT NULL` means nullable (SQL default). `type` maps to `SqlType`: known names (`int`, `bigint`, `text`, `boolean`, …),
parametrised `varchar(n)` / `char(n)` / `decimal(p,s)`, and any unknown name → `SqlType.Custom(raw)`. Common SQL spelling aliases
normalize to the canonical name (see [type reference](/v3/ddl/types/)). The modifier order above is fixed.

A **`GENERATED ALWAYS AS (expr) STORED`** column is computed from other columns and stored; its expression is opaque
(read like a `CHECK`), and `STORED` is required (the only generation kind supported). It is mutually exclusive with `DEFAULT`.

### Constraints

Names are mandatory; structural changes drop-and-recreate, but a doc-comment change alone is applied in place (`COMMENT ON CONSTRAINT`), never a recreate.

```ebnf
pk-def     = "CONSTRAINT" , ident , "PRIMARY" , "KEY" , "(" , col-list , ")" ;
fk-def     = "CONSTRAINT" , ident , "FOREIGN" , "KEY" , "(" , col-list , ")" ,
             "REFERENCES" , qualified-name , "(" , col-list , ")" ,
             [ "ON" , "DELETE" , ref-action ] , [ "ON" , "UPDATE" , ref-action ] ;
unique-def = "CONSTRAINT" , ident , "UNIQUE" , "(" , col-list , ")" ;
check-def  = "CONSTRAINT" , ident , "CHECK" , paren-expr ;
exclude-def = "CONSTRAINT" , ident , "EXCLUDE" , [ "USING" , ident ] ,
              "(" , excl-elem , { "," , excl-elem } , ")" , [ "WHERE" , paren-expr ] ;
excl-elem  = ( ident | paren-expr ) , "WITH" , operator ;

ref-action = "NO" , "ACTION" | "CASCADE" | "SET" , "NULL" | "SET" , "DEFAULT" ;
col-list   = ident , { "," , ident } ;
```

An **`EXCLUDE`** constraint guarantees that no two rows have all of the given operators returning true across the listed
elements. Each element is a column or parenthesized expression paired with an `operator` (raw text up to the `,` or `)`);
`USING method` is optional, as is a partial `WHERE`. Dropping one is a destructive change.

### Indexes (inline)

```ebnf
index-def  = [ "UNIQUE" ] , "INDEX" , ident , [ "USING" , ident ] ,
             "(" , index-key , { "," , index-key } , ")" ,
             [ "INCLUDE" , "(" , col-list , ")" ] , [ "WHERE" , paren-expr ] ;
index-key  = ( ident | paren-expr ) , [ "ASC" | "DESC" ] , [ "NULLS" , ( "FIRST" | "LAST" ) ] ;
```

`UNIQUE (…)` (a `unique-def`) is a unique constraint; `UNIQUE INDEX` is a unique index. A unique index can be partial
(`WHERE`); a unique constraint cannot.

Each `index-key` is a plain column or a parenthesized **expression** (`(lower(email))`), with optional `ASC`/`DESC` and
`NULLS FIRST`/`NULLS LAST`. `USING method` selects the access method (`gin`, `gist`, `brin`, …; omitted → B-tree), and
`INCLUDE (…)` lists covering non-key columns. Any structural change (a key, its ordering, the method, or the include set)
drops and recreates the index; a doc-comment change alone is applied in place.

### Grants

```ebnf
grant      = "GRANT" , ( table-priv , { "," , table-priv } , "ON" , qualified-name
                       | "USAGE" , "ON" , "SCHEMA" , ident ) ,
             "TO" , ident ;
table-priv = "SELECT" | "INSERT" | "UPDATE" | "DELETE" ;
```

`GRANT … ON <table>` → `TableGrant`; `GRANT USAGE ON SCHEMA <schema>` → `SchemaGrant`.

### Views

```ebnf
create-view = "CREATE" , [ "MATERIALIZED" ] , "VIEW" , qualified-name , [ "RENAMED" , "FROM" , ident ] ,
              "AS" , view-body ;                            (* view-body: opaque text up to the top-level ';' *)
drop-view   = "DROP" , [ "MATERIALIZED" ] , "VIEW" , qualified-name ; (* -> DroppedViews (explicit drop, partial schema) *)
create-index = "CREATE" , [ "UNIQUE" ] , "INDEX" , ident , "ON" , qualified-name , [ "USING" , ident ] ,
               "(" , index-key , { "," , index-key } , ")" ,
               [ "INCLUDE" , "(" , col-list , ")" ] , [ "WHERE" , paren-expr ] ;
```

The `view-body` is everything after `AS` up to the terminating top-level `;`, captured **verbatim** and never interpreted,
exactly like a `CHECK` expression. Parentheses are balanced and string literals/comments are skipped, so a `;` inside them
does not end the definition.

NSchema does scan the body for the objects the view reads, the targets of its `FROM` and `JOIN` clauses, at any nesting
depth, minus names bound by a `WITH` CTE. These drive ordering: a view is created after the tables and views it reads and
dropped before them, with views ordered amongst themselves by their dependency  graph (a cycle is rejected). The scan is
deliberately shallow; it over-collects rather than under-collects.

A materialized view (`CREATE MATERIALIZED VIEW`) stores its result set and is the same model type as a plain view,
distinguished by a flag. Because there is no `CREATE OR REPLACE MATERIALIZED VIEW`, a body change to a materialized view,
or converting a view to/from materialized, is planned as a drop + recreate, whereas a plain view's body change is an
in-place `CREATE OR REPLACE`.

A standalone `CREATE [UNIQUE] INDEX … ON s.relation` statement attaches an index to its relation when the document is
built (like a `GRANT`): a table equivalent to declaring the index inline in the table body or a materialized view.
A plain view cannot be indexed, and targeting an unknown relation is an error. A materialized view's indexes *must*
be standalone (its body is opaque, so there is nowhere inline to put them); a table's may be written either way.
There is no `DROP INDEX`: an index absent from its relation's declaration is dropped.

```sql
CREATE MATERIALIZED VIEW app.daily_totals AS SELECT date, sum(amount) FROM app.sales GROUP BY date;
CREATE UNIQUE INDEX daily_totals_date_ix ON app.daily_totals (date);
```

### Enums

```ebnf
create-enum = "CREATE" , "ENUM" , qualified-name , [ "RENAMED" , "FROM" , ident ] ,
              "(" , [ string , { "," , string } ] , ")" ;
drop-enum   = "DROP" , "ENUM" , qualified-name ;            (* -> DroppedEnums (explicit drop, partial schema) *)
```

```sql
CREATE ENUM app.order_status ('pending', 'shipped', 'delivered');
```

The values are an **ordered** list (the order is the type's comparison order, as in Postgres) and must be unique within
the enum. A column uses the enum by naming it as its type (`status order_status`). Enum evolution is additions-only: new
values may be inserted anywhere, but removing or reordering existing values cannot be planned. It requires manually
recreating the type.

### Domains

```ebnf
create-domain = "CREATE" , "DOMAIN" , qualified-name , [ "RENAMED" , "FROM" , ident ] , "AS" , type ,
                { "NOT" , "NULL" | "NULL" | "CONSTRAINT" , ident , "CHECK" , "(" , expr , ")" } ,
                [ "DEFAULT" , expr ] ;
drop-domain   = "DROP" , "DOMAIN" , qualified-name ;          (* -> DroppedDomains (explicit drop, partial schema) *)
```

```sql
CREATE DOMAIN app.email AS text NOT NULL CONSTRAINT email_fmt CHECK (VALUE ~ '@') DEFAULT 'x@y';
```

A domain is a schema-scoped named type over a base `type`, optionally constrained by `NOT NULL` and named `CHECK`
constraints (whose expressions reference the domain's `VALUE`). A column uses it by naming it as its type, so a domain
is created before, and dropped after, the tables that may use it. The optional `DEFAULT`, if present, must come last.

Because a domain is depended on by columns, changes are applied **in place** with `ALTER DOMAIN` wherever possible: a
default, not-null, or check change never drops the domain. Only a base-type change forces a drop + recreate.

### Composite types

```ebnf
create-type = "CREATE" , "TYPE" , qualified-name , [ "RENAMED" , "FROM" , ident ] ,
              "AS" , "(" , [ field , { "," , field } ] , ")" ;
field       = ident , type ;
drop-type   = "DROP" , "TYPE" , qualified-name ;             (* -> DroppedCompositeTypes (explicit drop, partial schema) *)
```

```sql
CREATE TYPE app.address AS (street text, zip int);
```

A composite type is a schema-scoped named tuple of `field name + type` pairs. Like a domain, a column uses it by naming
it as its type, so it is **created before**, and **dropped after**, the tables that may use it. Every change applies in
place with `ALTER TYPE`. Fields are matched by name.

### Sequences

```ebnf
create-sequence = "CREATE" , "SEQUENCE" , qualified-name , [ "RENAMED" , "FROM" , ident ] ,
                  [ "(" , seq-option , { "," , seq-option } , ")" ] ;
seq-option      = "AS" , ident
                | ( "START" | "INCREMENT" | "MINVALUE" | "MAXVALUE" | "CACHE" ) , [ "-" ] , integer
                | "CYCLE" ;
drop-sequence   = "DROP" , "SEQUENCE" , qualified-name ;    (* -> DroppedSequences (explicit drop, partial schema) *)
```

```sql
CREATE SEQUENCE app.order_id (AS bigint, START 100, INCREMENT 5, MAXVALUE 999999, CACHE 10, CYCLE);
```

The option style mirrors a column's `IDENTITY (…)` clause. An omitted option means the database provider's default applies.
Each option may appear at most once.

### Extensions

```ebnf
create-extension = "CREATE" , "EXTENSION" , ext-name , [ "VERSION" , string ] ;
drop-extension   = "DROP" , "EXTENSION" , ext-name ;       (* -> DroppedExtensions (explicit drop only) *)
ext-name         = ident | string ;
```

```sql
CREATE EXTENSION citext;
CREATE EXTENSION postgis VERSION '3.4';
CREATE EXTENSION 'uuid-ossp';
```

Extensions are **database-global**, not schema-scoped: declared at the top level (not inside a `CREATE SCHEMA`) and never
qualified by a schema. The name may be a quoted string when it is not a bare identifier. `VERSION` is optional; a version
change plans an update in place.

Unlike every other object, an extension that exists in the database but is absent from the desired schema is left alone:
it is removed only by an explicit `DROP EXTENSION`. Extensions are shared infrastructure, so absence must never imply a drop.

### Functions and procedures

```ebnf
create-function  = "CREATE" , "FUNCTION" , qualified-name , [ "RENAMED" , "FROM" , ident ] ,
                   "(" , [ arg-text ] , ")" , definition-text ;
create-procedure = "CREATE" , "PROCEDURE" , qualified-name , [ "RENAMED" , "FROM" , ident ] ,
                   "(" , [ arg-text ] , ")" , definition-text ;
drop-function    = "DROP" , ( "FUNCTION" | "PROCEDURE" | "ROUTINE" ) , qualified-name ; (* -> DroppedRoutines *)
```

```sql
CREATE FUNCTION app.add_tax(amount numeric, rate numeric) RETURNS numeric LANGUAGE sql AS $$
  SELECT amount * (1 + rate);
$$;
```

Functions and procedures both capture opaquely: `arg-text` is the verbatim text inside the parentheses, and `definition-text`
is everything after the closing parenthesis up to the top-level `;` (dollar-quote aware), so a `;` inside `$$ … $$`does
not end the statement. A procedure is identical except its definition has no `RETURNS` clause.

Two rules carry over from the database:

1. **No overloading.** One routine per name.
2. **Functions and procedures share one namespace.** Within a schema.

The argument list is part of the routine's identity: changing it plans a **drop + recreate**. A definition-only change
replaces in-place, like a view body change.

### Triggers

```ebnf
create-trigger = "CREATE" , "TRIGGER" , ident , timing , events , "ON" , qualified-name ,
                 [ "FOR" , "EACH" , ( "ROW" | "STATEMENT" ) ] , [ "WHEN" , "(" , expr , ")" ] ,
                 trigger-action ;
trigger-action = "EXECUTE" , ( "FUNCTION" | "PROCEDURE" ) , func-name , "(" , [ arg-text ] , ")"
               | "AS" , dollar-body ;
timing         = "BEFORE" | "AFTER" | "INSTEAD" , "OF" ;
events         = event , { "OR" , event } ;
event          = "INSERT" | "DELETE" | "TRUNCATE" | "UPDATE" , [ "OF" , "(" , ident , { "," , ident } , ")" ] ;
func-name      = ident , [ "." , ident ] ;
```

A trigger's action is written in one of two forms. The first executes a function (like PostgreSQL), where the trigger's
logic lives in a separate function it calls:

```sql
CREATE TRIGGER users_audit
  AFTER INSERT OR UPDATE OF (email)
  ON app.users
  FOR EACH ROW
  WHEN (new.email IS NOT NULL)
  EXECUTE FUNCTION app.log_change();
```

The second runs an inline body (like SQL Server), where the trigger carries its statements directly:

```sql
CREATE TRIGGER users_guard
  INSTEAD OF DELETE
  ON app.users
  AS $$
    BEGIN
      INSERT INTO app.audit (msg) VALUES ('blocked');
      RETURN;
    END
  $$;
```

The body uses the same dollar-quoted, opaque-SQL device as a function or deployment-script: `$$ … $$`, passed verbatim
with the delimiters stripped, so it may contain its own `;` and is not dialect-translated. The two forms are mutually
exclusive, and which one a [provider](/v3/providers/) accepts depends on the specific database. PostgreSQL uses
`EXECUTE FUNCTION`, SQL Server uses an inline body.

A trigger is table-scoped but written as a standalone statement that names its table via `ON`, attached to that table
when the document is built. For the function form, the function it executes must exist: the planner creates the trigger
after both its table and the function it calls, and drops it before either. `FOR EACH` defaults to `STATEMENT`. The
`WHEN` condition and the function `arg-text` are captured opaque.

Triggers are table members (named uniquely per table), so, like indexes and constraints, they are not renameable and have
no separate `DROP TRIGGER`. A trigger absent from a declared table's set is dropped, and a structural change is planned
as a drop + recreate.

## Construct → model mapping

| DDL construct                                                 | Model target                                                                         |
|---------------------------------------------------------------|--------------------------------------------------------------------------------------|
| `CREATE [PARTIAL] SCHEMA s`                                   | `SchemaDefinition` (`IsPartial`)                                                     |
| `CREATE TABLE s.t (…)`                                        | `SchemaDefinition` + `Table`                                                         |
| `CREATE VIEW s.v AS …`                                        | `SchemaDefinition` + `View` (`Body` opaque, `DependsOn` derived)                     |
| `RENAMED FROM x` (schema/table/column)                        | `OldName`                                                                            |
| `name type [NOT NULL] [DEFAULT e]`                            | `Column` (`Type`→`SqlType`, `IsNullable`, `DefaultExpression`)                       |
| `IDENTITY (…)`                                                | `Column.IsIdentity` + `IdentityOptions`                                              |
| `GENERATED ALWAYS AS (e) STORED`                              | `Column.GeneratedExpression` (opaque; excludes `DEFAULT`)                            |
| `CONSTRAINT n PRIMARY KEY (…)`                                | `Table.PrimaryKey` (`PrimaryKey`)                                                    |
| `CONSTRAINT n FOREIGN KEY … REFERENCES …`                     | `ForeignKey` (`OnDelete`/`OnUpdate`→`ReferentialAction`)                             |
| `CONSTRAINT n UNIQUE (…)`                                     | `UniqueConstraint`                                                                   |
| `CONSTRAINT n CHECK (e)`                                      | `CheckConstraint` (`Expression` = `e`, opaque)                                       |
| `CONSTRAINT n EXCLUDE [USING m] (c WITH op, …)`               | `ExclusionConstraint` (`Method`, `Elements`, `Predicate`)                            |
| `[UNIQUE] INDEX n [USING m] (key, …) [INCLUDE (…)] [WHERE e]` | `TableIndex` (`IsUnique`, `Method`, `Columns`→`IndexColumn`, `Include`, `Predicate`) |
| `GRANT … ON s.t TO r`                                         | `TableGrant`                                                                         |
| `GRANT USAGE ON SCHEMA s TO r`                                | `SchemaGrant`                                                                        |
| `DROP TABLE s.t` / `DROP SCHEMA s`                            | `DroppedTables` / `DroppedSchemas`                                                   |
| `DROP VIEW s.v`                                               | `DroppedViews`                                                                       |
| `CREATE MATERIALIZED VIEW s.v AS …`                           | `View` with `IsMaterialized = true`                                                  |
| `CREATE [UNIQUE] INDEX n ON s.rel (…)`                        | `TableIndex` on the table (`Table.Indexes`) or materialized view (`View.Indexes`)    |
| `CREATE ENUM s.e ('a', 'b')`                                  | `SchemaDefinition` + `EnumType` (ordered `Values`)                                   |
| `CREATE DOMAIN s.d AS t [NOT NULL] [CHECK] [DEFAULT]`         | `Domain` (`DataType`, `NotNull`, `Checks`, `Default`)                                |
| `DROP DOMAIN s.d`                                             | `DroppedDomains`                                                                     |
| `CREATE TYPE s.t AS (f1 t1, f2 t2)`                           | `CompositeType` (ordered `Fields`)                                                   |
| `DROP TYPE s.t`                                               | `DroppedCompositeTypes`                                                              |
| `CREATE SEQUENCE s.q (…)`                                     | `SchemaDefinition` + `Sequence` (`SequenceOptions`)                                  |
| `DROP ENUM s.e` / `DROP SEQUENCE s.q`                         | `DroppedEnums` / `DroppedSequences`                                                  |
| `CREATE FUNCTION s.f(…) …`                                    | `Routine` (`Kind` = `Function`; opaque)                                              |
| `CREATE PROCEDURE s.p(…) …`                                   | `Routine` (`Kind` = `Procedure`; opaque)                                             |
| `DROP {FUNCTION\|PROCEDURE\|ROUTINE} s.r`                     | `DroppedRoutines`                                                                    |
| `CREATE EXTENSION e [VERSION 'v']`                            | `DatabaseSchema` + `Extension` (root-level)                                          |
| `DROP EXTENSION e`                                            | `DroppedExtensions` (root-level; explicit drop only)                                 |
| `CREATE TRIGGER t … ON s.tbl …`                               | `Trigger` on the named table (`Table.Triggers`)                                      |
| `---` / `/** */` before a declaration                         | that object's `Comment`                                                              |
