# NSchema.Docs

The documentation site for [NSchema](https://github.com/nschema-org/NSchema), built with
[Starlight](https://starlight.astro.build) (Astro). Published to
[nschema.dev](https://nschema.dev).

This is the central home for all NSchema documentation: the CLI, the DDL language, the providers/backends, and the 
`NSchema.Core` library. The other repositories link here.

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

## Deployment

Deploys to Netlify. `netlify.toml` sets the build command (`npm run build`), publish directory(`dist`), and Node version.

## Editing content

Each page is a Markdown (or `.mdx`) file under `src/content/docs/` with YAML frontmatter (`title`, `description`). 
The sidebar is defined in `astro.config.mjs`. Internal links use absolute, trailing-slash paths (e.g. `/cli/commands/plan/`).
