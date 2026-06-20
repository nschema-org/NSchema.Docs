# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

NSchema.Docs is the central documentation site for the whole NSchema project (CLI, DDL language,
providers/backends, and the `NSchema.Core` library). It is a [Starlight](https://starlight.astro.build)
(Astro) static site published to [nschema.dev](https://nschema.dev) via Netlify. See the root
`../CLAUDE.md` for how this repo relates to the sibling code repos — this one ships docs, no code.

## Commands

```sh
npm install
npm run dev       # dev server with hot reload at http://localhost:4321
npm run build     # static site → ./dist (also builds the Pagefind search index + sitemap)
npm run preview   # serve the built ./dist locally
npm run check     # astro check — type-checks content & config; run this before considering work done
```

There is no test suite; `npm run check` plus a successful `npm run build` are the validation gates.

## Content authoring

- Pages live under `src/content/docs/`, one Markdown/MDX file per route, with YAML frontmatter
  (`title`, `description`, optional `sidebar.order`). MDX pages can import Starlight components
  (`Card`, `CardGrid`, `Steps`, `LinkCard`, …).
- **The sidebar is hand-curated in `astro.config.mjs`** (the `sidebar` array), not auto-generated
  from the file tree — except `cli/commands/` which uses `autogenerate`. Adding a page means adding
  both the file *and* a sidebar entry (outside `cli/commands/`). `slug` values there are the route
  path without leading/trailing slashes.
- **Internal links are absolute with a trailing slash** — `/cli/commands/plan/`, not relative or
  extensioned. Match this exactly or links break in the built site.
- A section's overview page is named after the section (e.g. `cli/cli.md`, `providers/providers.md`,
  `backends/backends.md`) and mapped to the bare section slug in the sidebar.

## The `draft:` convention (important)

This repo is mid-"humanize" effort (branch `chore/humanize`). Every page authored by Claude carries
`draft: true` in its frontmatter until a human has rewritten it in their own words. Drafts are
excluded from production builds. Only fully human-written pages omit the flag (currently
`index.mdx` and `cli/cli.md`).

When you create or substantially generate page content, **add `draft: true`**. Do not silently
remove `draft: true` from a page you only lightly touched — clearing it is the human author's signal
that the prose has been humanized.

## Conventions worth knowing

- DDL grammar pages use ` ```ebnf ` fences. Shiki has no EBNF grammar; `astro.config.mjs` aliases it
  to plain monospace via `expressiveCode.shiki.langAlias` so the build doesn't warn per block.
- Brand accent colors are defined in `src/styles/theme.css` (separate dark/light `--sl-color-accent*`
  values), wired in through `customCss` in the Starlight config.
- Logos/images live in `assets/`; reference them from MDX with relative paths
  (e.g. `../../../assets/nschema-mark.svg`). `public/` is served as-is (favicon).
- Deployment is Netlify-driven by `netlify.toml` (build command, `dist` publish dir, Node 22).
