# NSchema.Docs

The documentation site for [NSchema](https://github.com/nschema-org/NSchema), built with
[Starlight](https://starlight.astro.build) (Astro). Published to
[nschema.dev](https://nschema.dev).

This is the central home for all NSchema documentation — the CLI, the DDL language, the
providers/backends, and the `NSchema.Core` library. The other repositories link here.

## Develop

```sh
npm install
npm run dev       # local dev server with hot reload at http://localhost:4321
```

## Build

```sh
npm run build     # static site into ./dist
npm run preview   # serve the built ./dist locally
```

`npm run build` also builds the [Pagefind](https://pagefind.app) search index and a sitemap.

## Project layout

```
src/
  content/docs/        Markdown/MDX pages — one file per route
    start/             Installation, quickstart, "what is NSchema?"
    guides/            Task-oriented guides (workflow, CI, drift, state, ...)
    cli/               CLI reference (commands/, config, env vars, exit codes)
    ddl/               The NSchema DDL language (defining schemas, grammar, types)
    providers/         Database providers and state backends
    library/           Embedding the NSchema.Core engine
    reference/         Roadmap and other reference material
  assets/              Logo and images
  styles/theme.css     Brand accent colors
  content.config.ts    Starlight content collection
public/                Static files served as-is (favicon)
astro.config.mjs       Site config + sidebar
netlify.toml           Netlify build settings
```

## Deployment

Deploys to Netlify. `netlify.toml` sets the build command (`npm run build`), publish directory
(`dist`), and Node version. Connect the repository in the Netlify dashboard and point the
`nschema.dev` domain at it.

## Editing content

Each page is a Markdown (or `.mdx`) file under `src/content/docs/` with YAML frontmatter
(`title`, `description`). The sidebar is defined in `astro.config.mjs`. Internal links use
absolute, trailing-slash paths (e.g. `/cli/commands/plan/`).
