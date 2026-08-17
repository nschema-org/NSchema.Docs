---
title: NSQL grammar
description: The complete reference for NSQL, the NSchema project language.
---

NSQL stays as true to standard SQL as possible, for maximum familiarity and compatibility. It should read instantly
to anyone who works with databases, but it is its own bounded language, **not** a SQL dialect. It describes *desired state*: 
you write the final shape of the schema, never migration steps. Every declaration maps 1:1 onto the `Database` domain
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
6. **Declarations and directives are separate.** A *declaration* says what the schema is; a *directive* says how to get
   there (a rename, a script). A `RENAMED FROM` clause hanging off a `CREATE` made the declaration about history rather
   than about the desired shape. See [Directives](#directives).
7. **Parsing is lossless.** The syntax tree keeps every character of the source, including comments and layout, which is
   what lets [`format`](/cli/commands/format/) reformat a file without ever rewriting what it means.

## Lexical

```ebnf
(* ignored: ordinary source comments and whitespace *)
line-comment   = "--" , { any-char - newline } ;
block-comment  = "/*" , { any-char } , "*/" ;

(* captured: doc-comments, attached to the following declaration (see Comments) *)
doc-line       = "---" , { any-char - newline } ;
doc-block      = "/**" , { any-char } , "*/" ;

bare-ident     = ( letter | "_" ) , { letter | digit | "_" } ;
quoted-ident   = dquote , { any-char - dquote | dquote dquote } , dquote   (* "" escapes a double quote *)
               | "[" , { any-char - "]" | "]]" } , "]" ;                   (* ]] escapes a bracket *)
ident          = bare-ident | quoted-ident ;
qualified-name = ident , "." , ident ;            (* schema.table, or schema.table for FK references *)
string         = "'" , { any-char - "'" | "''" } , "'" ;   (* '' escapes a single quote *)
integer        = digit , { digit } ;
```

### Identifiers

An identifier's identity is **its exact written text**, compared case-sensitively: `users` and `Users` are two different
tables. Keywords stay case-insensitive — `create table` and `CREATE TABLE` are the same statement.

Quoting lets a name carry characters a bare identifier can't, or collide with a keyword. Double quotes and square
brackets are two spellings of the same thing, each doubling its own closing delimiter to escape it:

```nsql
CREATE TABLE app."Order Details" ("weird ""col""" int);
CREATE TABLE app.[Order Details] ([weird ]]col]]] int);   -- the same two names
```

**Quotes are syntax, not identity.** Casing is significant with or without them, and either spelling names the same
object, so `"users"` and `users` are the same table while `"Users"` is not. Double quotes are the canonical form: the
writer (and [`import`](/cli/commands/import/)) quotes only the names that need it, always with double quotes.

The same rules apply wherever an identifier is read, including a [`--scope`](/cli/commands/plan/#scoping-to-an-object)
address on the command line.

### Expressions

`DEFAULT`, `CHECK (…)`, and index `WHERE` hold arbitrary SQL the model stores as an opaque string.

```ebnf
paren-expr     = "(" , balanced-tokens , ")" ;     (* CHECK (…), WHERE (…): capture balanced parens *)
default-expr   = token-run-until( top-level "," | top-level ")" | "GENERATED" ) ;
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

```nsql
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
document      = { [ doc-comment ] , ( declaration | directive | configuration ) } ;
declaration   = ( create-schema | create-table | create-view | create-enum | create-domain | create-type
                | create-sequence | create-function | create-procedure | create-extension | create-trigger
                | create-index | create-xml-index | create-xml-schema-collection
                | grant | template | apply-template ) , ";" ;
directive     = ( rename | script ) , ";" ;
configuration = ( engine | plugin | database | state ) , ";" ;
```

A flat statement list; schema membership is by qualified name, like normal SQL.

Three kinds of statement share the one grammar:

- **Declarations** say what the schema *is*. Deleting a declaration is how you drop the object — there is no `DROP`
  statement, because a declarative document describes the destination, not the journey.
- **[Directives](#directives)** say how the difference is managed: a [rename](#renames) or a [script](#scripts).
- **[Configuration](#configuration-statements)** says what the project runs against.

Any file may hold any of the three. Which files a run reads is a rule of the project layout, not of the grammar — see
[where files live](/cli/configuration/#where-configuration-files-live).

## Configuration statements

Orchestration configuration (the engine version, the plugins, the database, the state store) is written in the same
statement-shaped grammar as everything else:

```ebnf
engine    = "ENGINE" , attribute-list ;
plugin    = "PLUGIN" , ident , attribute-list ;
database  = "DATABASE" , ident , attribute-list ;
state     = "STATE" , ident , attribute-list ;

attribute-list = "(" , [ attribute , { "," , attribute } ] , ")" ;
attribute      = attr-key , "=" , attr-value ;
attr-key       = ident , { "." , ident } ;
attr-value     = string | [ "-" ] , integer | "true" | "false" | ident ;
```

```nsql
ENGINE (
  version = '[5.0,6.0)'
);

PLUGIN postgres (
  source  = 'NSchema.Postgres',
  version = '[5.0,6.0)'
);

DATABASE postgres (
  connection_string = '',
  command_timeout = 1000
);

STATE file (
  path = 'state/app.nsstate'
);
```

Notes on the shape:

- **`PLUGIN` requires a label** — your local name for the plugin. `DATABASE` and `STATE` take one too, referencing a
  declared `PLUGIN` (or the built-in `file` store). `ENGINE` takes none: there is only one engine.
- Each of `ENGINE`, `DATABASE`, and `STATE` may appear **at most once** across the configuration; a second one is a
  duplicate-statement error. `PLUGIN` may appear as often as the project has plugins.
- String **values** are single-quoted (`'postgres'`), SQL-style. Values may also be integers (optionally negative), 
  `true`/`false`, or a bare identifier.
- Attributes are a flat comma-separated list. Group related settings with a dotted key (`pool.max = 10`), which binds to
  a nested option on the plugin's settings.

A fifth block keyword, `LOCK`, shares the shape and is what [`nschema.lock`](/cli/configuration/#the-lockfile) is written
in. It is generated, not hand-authored.

:::tip
This section describes the language shape. For the attributes each statement recognizes, see [Configuration](/cli/configuration/),
[Databases](/databases/), and [State](/state/).
:::

## Directives

A directive doesn't describe the schema; it describes how the difference to it is managed. There are two: renames, and
[scripts](#scripts).

### Renames

Deleting one declaration and adding another reads as a drop and a create — which loses the data. A `RENAME` directive
says it is the same object under a new name, so the existing object is carried across instead:

```ebnf
rename        = "RENAME" , rename-kind , rename-source , "TO" , ident ;
rename-kind   = "SCHEMA" | "TABLE" | "COLUMN" | [ "MATERIALIZED" ] , "VIEW" | "ENUM" | "DOMAIN"
              | "TYPE" | "SEQUENCE" | "FUNCTION" | "PROCEDURE" | "ROUTINE" ;
rename-source = ident                               (* SCHEMA: a bare schema name *)
              | qualified-name                      (* an object: schema.name *)
              | ident , "." , ident , "." , ident   (* COLUMN: schema.table.column *) ;
```

```nsql
RENAME SCHEMA billing TO invoicing;
RENAME TABLE app.users TO accounts;
RENAME COLUMN app.accounts.email TO email_address;
```

The **source is fully qualified and the target is always a bare name**: a rename never moves an object between
containers. `FUNCTION`, `PROCEDURE`, and `ROUTINE` all name a routine (they share one name space) and `VIEW` covers a
materialized view; the concrete kind is resolved from the current state when the directive is planned.

Write the directive alongside the *new* declaration, and delete it once the rename has been applied everywhere.

A [template](#templates) body may carry object-level renames (everything except `RENAME SCHEMA`), so one edit renames the
object in every schema the template is applied to.

### Scripts

Some migration steps are imperative and can't be expressed declaratively. Backfills, data fixes, extensions, seeds.
These are declared inline with the `SCRIPT` directive, which names *when* the script runs (its event) and *how often*
(its run condition):

```ebnf
script         = "SCRIPT" , string , "RUN" , [ run-condition ] , "ON" , script-event ,
                 [ "(" , [ script-option , { "," , script-option } ] , ")" ] ,
                 "AS" , dollar-body , ";" ;
run-condition  = "ALWAYS" | "ONCE" ;
script-event   = "PRE" , "DEPLOYMENT" | "POST" , "DEPLOYMENT"
               | "ADD" , "COLUMN" , member-path | "ALTER" , "COLUMN" , "TYPE" , member-path
               | "ADD" , "CONSTRAINT" , member-path ;
member-path    = ident , "." , ident , "." , ident ;    (* schema.table.column-or-constraint *)
script-option  = ident , "=" , config-value ;
dollar-body    = "$$" , … , "$$" | "$" , tag , "$" , … , "$" , tag , "$" ;
```

```nsql
SCRIPT 'reindex' RUN ON POST DEPLOYMENT (run_outside_transaction = true) AS $$
    CREATE INDEX CONCURRENTLY idx_widgets_name ON app.widgets (name);
$$;

SCRIPT 'seed currencies' RUN ONCE ON POST DEPLOYMENT AS $$
    INSERT INTO app.currencies (code) VALUES ('GBP'), ('USD'), ('EUR');
$$;

SCRIPT 'backfill emails' RUN ON ADD COLUMN app.users.email AS $$
    UPDATE app.users SET email = username || '@legacy.example' WHERE email IS NULL;
$$;
```

Notes on the shape:

- The name is a single-quoted string, used in plan output, logs, and run-once tracking. Names are required and must be
  unique across the project.
- The **event** is when the script runs: `PRE DEPLOYMENT` / `POST DEPLOYMENT` are fixed bookends around the computed
  migration, while the change events (`ADD COLUMN`, `ALTER COLUMN TYPE`, `ADD CONSTRAINT`) fire only when the plan
  contains the matching structural change, splicing the SQL at the change (see [Data migrations](/guides/data-migrations/)).
- The **run condition** is how often it runs when its event occurs: `ALWAYS` (the default — a bare `RUN ON …` means
  this) or `ONCE` (recorded in the state backend on a successful apply and skipped thereafter; see
  [Deployment scripts](/guides/deployment-scripts/#run-conditions)). `UNLESS EXISTS` is reserved for a future release.
- A change-event target is a three-segment path — the third segment is a column name for the column events and a
  constraint name for `ADD CONSTRAINT`. Inside a [template](#templates) body the path is the unqualified
  `table.member` instead, and the script instantiates per applied schema (see the
  [guide](/guides/data-migrations/#migrations-in-templates)).
- Change-event matching is structural (the event plus the path), never positional, and the script can live in any
  `.sql` file. Declaring two scripts for the same event and path is an error.
- A matched script is carried **on the diff**, at the change it supports, and runs there — a deployment script bookends
  the migration, a change-event script splices in at its change.
- An optional `( … )` clause carries script options. The only option today is `run_outside_transaction = true`, for
  statements the database forbids inside a transaction (e.g. `CREATE INDEX CONCURRENTLY`).
- `AS` introduces the body, exactly as for a view (`CREATE VIEW … AS …`).
- The body is a dollar-quoted block (`$$ … $$` or `$tag$ … $tag$`) using the same opaque-SQL device as function bodies.
  Dollar-quoting lets the body contain its own `;` and single quotes without escaping; the inner content is taken
  verbatim (delimiters stripped, surrounding whitespace trimmed) and is not dialect-translated.

### Removed script forms

Before NSchema 4.4, bookend scripts and data migrations had their own statements (`PRE|POST DEPLOYMENT 'name' AS …` and
`MIGRATION ['name'] FOR <event> <path> AS …`). They were deprecated in 4.4 and **no longer parse in 5.0**; rewrite them
as `SCRIPT`. Unlike the old `MIGRATION` form, `SCRIPT` requires a name. See the [upgrade guide](/upgrade/v5/#scripts).

## Declarations

### Schemas

```ebnf
create-schema = "CREATE" , "SCHEMA" , ident ;
```

There is no `DROP SCHEMA` and no `PARTIAL SCHEMA`: an object is dropped by deleting its declaration, and an object
NSchema does not [manage](/guides/state/#the-managed-set) is never dropped in the first place, which is what `PARTIAL`
was reaching for.

### Tables

```ebnf
create-table = "CREATE" , "TABLE" , qualified-name ,
               "(" , table-item , { "," , table-item } , ")" ;

table-item   = [ doc-comment ] , ( column-def | pk-def | fk-def | unique-def | check-def | exclude-def
                                 | index-def | include-member ) ;
```

### Columns

```ebnf
column-def   = ident , type ,
               [ "NOT" , "NULL" | "NULL" ] ,
               [ "IDENTITY" , [ "(" , identity-opt , { "," , identity-opt } , ")" ] ] ,
               [ "DEFAULT" , ( paren-expr | default-expr ) ] ,
               [ "GENERATED" , "ALWAYS" , "AS" , paren-expr , "STORED" ] ;

identity-opt = ( "START" | "INCREMENT" | "MINVALUE" ) , integer ;
type         = ident , [ "(" , integer , [ "," , integer ] , ")" ] ;
```

Absence of `NOT NULL` means nullable (SQL default). `type` maps to `SqlType`: known names (`int`, `bigint`, `text`, `boolean`, …),
parametrised `varchar(n)` / `char(n)` / `decimal(p,s)`, and any unknown name → a custom type. A custom type may be
schema-qualified (`app.order_status`), and the schema is carried structurally rather than folded into the name. Common SQL
spelling aliases normalize to the canonical name (see [type reference](/nsql/types/)). The modifier order above is fixed.

A **`GENERATED ALWAYS AS (expr) STORED`** column is computed from other columns and stored; its expression is opaque 
(read like a `CHECK`), and `STORED` is required (the only generation kind supported). It is mutually exclusive with `DEFAULT`.

### Constraints

Names are mandatory; structural changes drop-and-recreate, but a doc-comment change alone is applied in place (`COMMENT ON CONSTRAINT`), never a recreate.

```ebnf
pk-def     = "CONSTRAINT" , ident , "PRIMARY" , "KEY" , [ clustering ] , "(" , col-list , ")" ;
fk-def     = "CONSTRAINT" , ident , "FOREIGN" , "KEY" , "(" , col-list , ")" ,
             "REFERENCES" , qualified-name , "(" , col-list , ")" ,
             [ "ON" , "DELETE" , ref-action ] , [ "ON" , "UPDATE" , ref-action ] ;
unique-def = "CONSTRAINT" , ident , "UNIQUE" , [ clustering ] , "(" , col-list , ")" ;
check-def  = "CONSTRAINT" , ident , "CHECK" , paren-expr ;
exclude-def = "CONSTRAINT" , ident , "EXCLUDE" , [ "USING" , ident ] ,
              "(" , excl-elem , { "," , excl-elem } , ")" , [ "WHERE" , paren-expr ] ;
excl-elem  = ( ident | paren-expr ) , "WITH" , operator ;

clustering = "CLUSTERED" | "NONCLUSTERED" ;
ref-action = "NO" , "ACTION" | "CASCADE" | "SET" , "NULL" | "SET" , "DEFAULT" ;
col-list   = ident , { "," , ident } ;
```

An **`EXCLUDE`** constraint guarantees that no two rows have all of the given operators returning true across the listed 
elements. Each element is a column or parenthesized expression paired with an `operator` (raw text up to the `,` or `)`); 
`USING method` is optional, as is a partial `WHERE`. Dropping one is a destructive change.

`CLUSTERED` / `NONCLUSTERED` is described under [Clustering](/nsql/grammar/#clustering).

### Indexes (inline)

```ebnf
index-def  = [ "UNIQUE" ] , [ clustering ] , "INDEX" , ident , [ "USING" , ident ] ,
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

### Clustering

A **clustered** index *is* the relation's rows, held in its order, rather than a structure sitting beside them. It can be
written on a primary key, a unique constraint, or an index, inline or standalone, in the spelling T-SQL uses:

```nsql
CREATE TABLE app.bom
(
    id           bigint NOT NULL IDENTITY,
    assembly_id  bigint NOT NULL,
    component_id bigint NOT NULL,
    CONSTRAINT bom_pkey PRIMARY KEY NONCLUSTERED (id)
);

CREATE UNIQUE CLUSTERED INDEX bom_assembly_ix ON app.bom (assembly_id, component_id);
```

**Saying nothing is its own state**, distinct from writing `NONCLUSTERED`. The engines disagree on the default — a SQL
Server primary key clusters, an index does not — so an omitted keyword means *whatever the engine would do*, and is left
to it. That is what keeps a schema written without the keyword and one read back by [`import`](/cli/commands/import/) the
same: import records clustering only where it differs from the engine's own default, so it never writes noise you did not
ask for, and never loses a choice you did.

Two rules follow from what clustering is:

- **At most one per relation.** A second clustered index has nothing left to order, so it is an error
  (`multiple-clustered-indexes`).
- **A change to it is a drop and a recreate.** No engine reorders a table in place.

On an engine with no such concept — Postgres's `CLUSTER` is a one-off reordering rather than a property of the index, and
SQLite has nothing equivalent — declared clustering is not applied, and the plan says so
(`clustering-not-supported`) rather than dropping it silently.

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
create-view = "CREATE" , [ "MATERIALIZED" ] , "VIEW" , qualified-name ,
              [ "WITH" , "SCHEMABINDING" ] ,
              "AS" , view-body ;                            (* view-body: opaque text up to the top-level ';' *)
create-index = "CREATE" , [ "UNIQUE" ] , [ clustering ] , "INDEX" , ident , "ON" , qualified-name , [ "USING" , ident ] ,
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
built (like a `GRANT`): a table equivalent to declaring the index inline in the table body or a view. Targeting an unknown 
relation is an error. A view's indexes *must* be standalone (its body is opaque, so there is nowhere inline to put them); 
a table's may be written either way. There is no `DROP INDEX`: an index absent from its relation's declaration is dropped.

```nsql
CREATE MATERIALIZED VIEW app.daily_totals AS SELECT date, sum(amount) FROM app.sales GROUP BY date;
CREATE UNIQUE INDEX daily_totals_date_ix ON app.daily_totals (date);
```

A view need not be materialized to carry indexes. SQL Server's *indexed view* is a plain view with a unique clustered
index on it, which is what makes its result set stored, so an index attaches to either kind:

```nsql
CREATE VIEW app.order_customers WITH SCHEMABINDING AS
    SELECT o.id, o.customer_id FROM app.orders o;

CREATE UNIQUE CLUSTERED INDEX order_customers_ix ON app.order_customers (id);
```

**`WITH SCHEMABINDING`** binds the view to the schema of what it reads, so the objects behind it cannot be altered out
from under it. It is required before a view can be indexed on SQL Server. Changing the binding, like changing the body,
recreates the view — and because a view's indexes hang off its stored form, a view carrying indexes is dropped and
recreated rather than replaced in place, with its indexes rebuilt from the declaration.

### Enums

```ebnf
create-enum = "CREATE" , "ENUM" , qualified-name ,
              "(" , [ string , { "," , string } ] , ")" ;
```

```nsql
CREATE ENUM app.order_status ('pending', 'shipped', 'delivered');
```

The values are an **ordered** list (the order is the type's comparison order, as in Postgres) and must be unique within 
the enum. A column uses the enum by naming it as its type (`status order_status`). Enum evolution is additions-only: new
values may be inserted anywhere, but removing or reordering existing values cannot be planned. It requires manually 
recreating the type.

### Domains

```ebnf
create-domain = "CREATE" , "DOMAIN" , qualified-name , "AS" , type ,
                { "NOT" , "NULL" | "NULL" | "CONSTRAINT" , ident , "CHECK" , "(" , expr , ")" } ,
                [ "DEFAULT" , expr ] ;
```

```nsql
CREATE DOMAIN app.email AS text NOT NULL CONSTRAINT email_fmt CHECK (VALUE ~ '@') DEFAULT 'x@y';
```

A domain is a schema-scoped named type over a base `type`, optionally constrained by `NOT NULL` and named `CHECK` 
constraints (whose expressions reference the domain's `VALUE`). A column uses it by naming it as its type, so a domain 
is created before, and dropped after, the tables that may use it. The optional `DEFAULT`, if present, must come last.

Because a domain is depended on by columns, changes are applied **in place** with `ALTER DOMAIN` wherever possible: a 
default, not-null, or check change never drops the domain. Only a base-type change forces a drop + recreate.

### Composite types

```ebnf
create-type = "CREATE" , "TYPE" , qualified-name ,
              "AS" , "(" , [ field , { "," , field } ] , ")" ;
field       = ident , type ;
```

```nsql
CREATE TYPE app.address AS (street text, zip int);
```

A composite type is a schema-scoped named tuple of `field name + type` pairs. Like a domain, a column uses it by naming 
it as its type, so it is **created before**, and **dropped after**, the tables that may use it. Every change applies in 
place with `ALTER TYPE`. Fields are matched by name.

### XML schema collections

```ebnf
create-xml-schema-collection = "CREATE" , "XML" , "SCHEMA" , "COLLECTION" , qualified-name ,
                               "AS" , collection-body ;   (* opaque text up to the top-level ';' *)

xml-type = "xml" , [ "(" , ( "DOCUMENT" | "CONTENT" ) , qualified-name , ")" ] ;
```

An XML schema collection is a named bundle of XSD that a typed `xml` column is validated against. Its body is captured
**verbatim** and never interpreted, exactly like a view body — one document however many namespaces it declares, because
an engine merges what is added to a collection and reports the whole thing back as a single document.

A column binds to one by naming it as the argument of the `xml` type, saying whether the column holds a whole
`DOCUMENT` or any `CONTENT` fragment:

```nsql
CREATE XML SCHEMA COLLECTION app.survey_schema AS '
    <xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" targetNamespace="urn:survey">
        <xsd:element name="survey" type="xsd:anyType"/>
    </xsd:schema>';

CREATE TABLE app.responses
(
    id     bigint NOT NULL IDENTITY,
    survey xml(DOCUMENT app.survey_schema) NULL,
    notes  xml NULL,
    CONSTRAINT responses_pkey PRIMARY KEY (id)
);
```

A collection is **created before**, and **dropped after**, the tables whose columns bind to it. Because its contents can
only be added to and never taken away, a change to the body is a drop and a recreate rather than an alteration. A bare
`xml` column is untyped and binds to nothing.

### XML indexes

```ebnf
create-xml-index = "CREATE" , [ "PRIMARY" ] , "XML" , "INDEX" , ident ,
                   "ON" , qualified-name , "(" , ident , ")" ,
                   [ "USING" , "XML" , "INDEX" , ident ,
                     "FOR" , ( "PATH" | "VALUE" | "PROPERTY" ) ] ;
```

An XML index indexes the shredded contents of an `xml` column rather than a value. A **primary** XML index is the node
table itself; every **secondary** is a B-tree over one that already exists, and names both the primary it reads and which
form it takes:

```nsql
CREATE PRIMARY XML INDEX responses_survey_pxml ON app.responses (survey);
CREATE XML INDEX responses_survey_path ON app.responses (survey)
    USING XML INDEX responses_survey_pxml FOR PATH;
```

The key names the single `xml` column being indexed. The facets of an ordinary index have nothing to mean here: an XML
index takes no `UNIQUE`, no `INCLUDE`, no `WHERE` and no access method, and each is refused with a diagnostic rather than
dropped silently. [Clustering](/nsql/grammar/#clustering) does not apply either — an XML index indexes a shredded
document, not the table's rows — so none is ever reported for one. A secondary is created after its primary and dropped
before it.

### Sequences

```ebnf
create-sequence = "CREATE" , "SEQUENCE" , qualified-name ,
                  [ "(" , seq-option , { "," , seq-option } , ")" ] ;
seq-option      = "AS" , ident
                | ( "START" | "INCREMENT" | "MINVALUE" | "MAXVALUE" | "CACHE" ) , [ "-" ] , integer
                | "CYCLE" ;
```

```nsql
CREATE SEQUENCE app.order_id (AS bigint, START 100, INCREMENT 5, MAXVALUE 999999, CACHE 10, CYCLE);
```

The option style mirrors a column's `IDENTITY (…)` clause. An omitted option means the database provider's default applies. 
Each option may appear at most once.

### Extensions

```ebnf
create-extension = "CREATE" , "EXTENSION" , ext-name , [ "VERSION" , string ] ;
ext-name         = ident ;                                  (* quoted when it is not a bare identifier *)
```

```nsql
CREATE EXTENSION citext;
CREATE EXTENSION postgis VERSION '3.4';
CREATE EXTENSION "uuid-ossp";
```

Extensions are **database-global**, not schema-scoped: declared at the top level (not inside a `CREATE SCHEMA`) and never 
qualified by a schema. A name that isn't a bare identifier is written as a [quoted identifier](#identifiers) (`"uuid-ossp"`),
not as a string. `VERSION` is optional; a version change plans an update in place.

An extension you declare becomes [managed](/guides/state/#the-managed-set) when it is applied, and is dropped when you
delete the declaration, like any other object. An extension NSchema never created is never dropped — extensions are
shared infrastructure, so one that was already there stays there.

### Functions and procedures

```ebnf
create-function  = "CREATE" , "FUNCTION" , qualified-name ,
                   "(" , [ arg-text ] , ")" , definition-text ;
create-procedure = "CREATE" , "PROCEDURE" , qualified-name ,
                   "(" , [ arg-text ] , ")" , definition-text ;
```

```nsql
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

```nsql
CREATE TRIGGER users_audit
  AFTER INSERT OR UPDATE OF (email)
  ON app.users
  FOR EACH ROW
  WHEN (new.email IS NOT NULL)
  EXECUTE FUNCTION app.log_change();
```

The second runs an inline body (like SQL Server), where the trigger carries its statements directly:

```nsql
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
exclusive, and which one a [database](/databases/) accepts depends on the specific database. PostgreSQL uses 
`EXECUTE FUNCTION`, SQL Server uses an inline body.

A trigger is table-scoped but written as a standalone statement that names its table via `ON`, attached to that table 
when the document is built. For the function form, the function it executes must exist: the planner creates the trigger 
after both its table and the function it calls, and drops it before either. `FOR EACH` defaults to `STATEMENT`. The 
`WHEN` condition and the function `arg-text` are captured opaque.

Triggers are table members (named uniquely per table), so, like indexes and constraints, they are not renameable and have 
no separate `DROP TRIGGER`. A trigger absent from a declared table's set is dropped, and a structural change is planned 
as a drop + recreate.

## Templates

Templates declare a reusable structure once and instantiate it in many places: a **schema template** holds whole
objects, applied to schemas; a **table template** (`FOR TABLE`) holds table members, pulled into a table body by an
`INCLUDE` member.

```ebnf
template        = "TEMPLATE" , ident , [ "FOR" , ( "SCHEMA" | "TABLE" ) ] , "BEGIN" , template-body , "END" , ";" ;
template-body   = { statement }                        (* FOR SCHEMA: CREATE statements, table GRANTs, SCRIPT statements *)
                | table-member , { "," , table-member } (* FOR TABLE: the table-body member grammar *) ;
apply-template  = "APPLY" , "TEMPLATE" , ident , "IN" , "SCHEMA" , ident , { "," , ident } , ";" ;
include-member  = "INCLUDE" , ident ;                  (* a table-body member naming a FOR TABLE template *)
```

```nsql
TEMPLATE outbox
BEGIN
  CREATE TABLE outbox (
    id      uuid NOT NULL,
    payload text NOT NULL,
    CONSTRAINT pk_outbox PRIMARY KEY (id)
  );
  CREATE INDEX ix_outbox_id ON outbox (id);
END;

APPLY TEMPLATE outbox IN SCHEMA billing, ordering;

TEMPLATE audit_columns FOR TABLE
BEGIN
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
END;

CREATE TABLE app.widgets (
  id uuid NOT NULL,
  INCLUDE audit_columns
);
```

Notes on the shape:

- The body is delimited by `BEGIN … END` — parsed like PostgreSQL's `BEGIN ATOMIC` function bodies, not an opaque
  block — so errors surface at the definition, and `format` formats the contents.
- `FOR SCHEMA` is the default and may be omitted.
- Inside a body, **an unqualified name binds to the target schema; a qualified name escapes** to the schema it
  names. Objects must be declared unqualified (each application creates its own copy); references may be either.
  A column type or trigger function the template itself declares is qualified per instance at expansion.
- A schema template body accepts `CREATE` object statements, table `GRANT`s, [`SCRIPT` directives](/guides/data-migrations/#migrations-in-templates)
  (with an unqualified `table.member` path, instantiated per applied schema), and object-level
  [`RENAME` directives](#renames) — no schemas, extensions, views, `RENAME SCHEMA`, configuration statements, or nested
  templates, and no `GRANT USAGE ON SCHEMA`.
- An `INCLUDE` member's columns land at the position the include is written; its other members attach alongside the
  table's own. A table template cannot include another template.
- Definitions, applications, and includes are location- and order-independent across all project files; template names
  are unique across the project, and instances are strictly identical.

:::note
Expansion happens when the desired schema is loaded — diff, plan, and import see only the concrete expanded
objects. See [Templates](/guides/templates/) for the practical guide.
:::

## Construct → model mapping

| NSQL construct                                                    | Model target                                                                          |
|-------------------------------------------------------------------|---------------------------------------------------------------------------------------|
| `CREATE SCHEMA s`                                                 | `Schema` on the `Database`                                                            |
| `CREATE TABLE s.t (…)`                                            | `Schema` + `Table`                                                                    |
| `CREATE VIEW s.v AS …`                                            | `Schema` + `View` (`Body` opaque `SqlText`, `DependsOn` derived)                      |
| `name type [NOT NULL] [DEFAULT e]`                                | `Column` (`Type`→`SqlType`, `IsNullable`, `DefaultExpression`→`SqlDefaultExpression`) |
| `IDENTITY (…)`                                                    | `Column.IsIdentity` + `IdentityOptions`                                               |
| `GENERATED ALWAYS AS (e) STORED`                                  | `Column.GeneratedExpression` (opaque; excludes `DEFAULT`)                             |
| `CONSTRAINT n PRIMARY KEY [CLUSTERED\|NONCLUSTERED] (…)`           | `Table.PrimaryKey` (`PrimaryKey`, `Clustered`)                                        |
| `CONSTRAINT n FOREIGN KEY … REFERENCES …`                         | `ForeignKey` (`OnDelete`/`OnUpdate`→`ReferentialAction`)                              |
| `CONSTRAINT n UNIQUE [CLUSTERED\|NONCLUSTERED] (…)`                | `UniqueConstraint` (`Clustered`)                                                      |
| `CONSTRAINT n CHECK (e)`                                          | `CheckConstraint` (`Expression` = `e`, opaque)                                        |
| `CONSTRAINT n EXCLUDE [USING m] (c WITH op, …)`                   | `ExclusionConstraint` (`Method`, `Elements`→`ExclusionElement`, `Predicate`)          |
| `[UNIQUE] [CLUSTERED\|NONCLUSTERED] INDEX n [USING m] (key, …) …`  | `TableIndex` (`IsUnique`, `Clustered`, `Method`, `Columns`→`IndexColumn`, `Include`)  |
| `GRANT … ON s.t TO r`                                             | `TableGrant`                                                                          |
| `GRANT USAGE ON SCHEMA s TO r`                                    | `SchemaGrant`                                                                         |
| `CREATE MATERIALIZED VIEW s.v AS …`                               | `View` with `IsMaterialized = true`                                                   |
| `CREATE [UNIQUE] INDEX n ON s.rel (…)`                            | `TableIndex` on the table (`Table.Indexes`) or view (`View.Indexes`)                  |
| `CREATE [PRIMARY] XML INDEX n ON s.t (col) …`                      | `TableIndex.Xml` (`XmlIndexDefinition`: `Kind`, `PrimaryIndex`)                       |
| `CREATE VIEW s.v WITH SCHEMABINDING AS …`                          | `View.IsSchemaBound = true`                                                           |
| `CREATE XML SCHEMA COLLECTION s.c AS '…'`                          | `Schema` + `XmlSchemaCollection` (`Body` opaque `SqlText`)                            |
| `xml(DOCUMENT\|CONTENT s.c)` as a column type                      | `SqlType.Xml` bound to the collection (`XmlTypeBinding`)                              |
| `CREATE ENUM s.e ('a', 'b')`                                      | `Schema` + `EnumType` (ordered `EnumLabel` values)                                    |
| `CREATE DOMAIN s.d AS t [NOT NULL] [CHECK] [DEFAULT]`             | `DomainType` (`DataType`, `NotNull`, `Checks`, `Default`)                             |
| `CREATE TYPE s.t AS (f1 t1, f2 t2)`                               | `CompositeType` (ordered `CompositeField`s)                                           |
| `CREATE SEQUENCE s.q (…)`                                         | `Schema` + `Sequence` (`SequenceOptions`)                                             |
| `CREATE FUNCTION s.f(…) …`                                        | `Routine` (`Kind` = `Function`; opaque)                                               |
| `CREATE PROCEDURE s.p(…) …`                                       | `Routine` (`Kind` = `Procedure`; opaque)                                              |
| `CREATE EXTENSION e [VERSION 'v']`                                | `Extension` on the `Database` (root-level)                                            |
| `CREATE TRIGGER t … ON s.tbl …`                                   | `Trigger` on the named table (`Table.Triggers`)                                       |
| `RENAME <kind> <source> TO n`                                     | a rename directive on the project (never part of the schema model)                    |
| `SCRIPT … ON PRE\|POST DEPLOYMENT`                                | `DeploymentScript` (`DeploymentPhase`, `RunCondition`)                                |
| `SCRIPT … ON <change> <path>`                                     | `ChangeScript` (`ChangeTarget`, `RunCondition`)                                       |
| `TEMPLATE n [FOR …] BEGIN … END` / `APPLY TEMPLATE` / `INCLUDE n` | expanded at load into concrete objects per target — no model construct survives       |
| `ENGINE` / `PLUGIN` / `DATABASE` / `STATE`                        | the project's configuration, not its schema                                           |
| `---` / `/** */` before a declaration                             | that object's `Comment`                                                               |
