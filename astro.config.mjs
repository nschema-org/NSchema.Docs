// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// https://astro.build/config
export default defineConfig({
  site: "https://nschema.dev",
  integrations: [
    starlight({
      title: "NSchema",
      description:
        "A declarative database schema migration tool. Describe the schema you want; NSchema computes and applies the migration to get there.",
      logo: {
        light: "./src/assets/nschema-mark.svg",
        dark: "./src/assets/nschema-mark.svg"
      },
      favicon: "/favicon.svg",
      customCss: ["./src/styles/theme.css"],
      // The DDL grammar pages use ```ebnf fences; Shiki has no EBNF grammar, so
      // render them as plain monospace rather than emitting a warning per block.
      expressiveCode: {
        shiki: { langAlias: { ebnf: "plaintext" } },
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/nschema-org/NSchema",
        },
      ],
      editLink: {
        baseUrl: "https://github.com/nschema-org/NSchema.Docs/edit/main/",
      },
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
      sidebar: [
        {
          label: "Start Here",
          items: [
            { label: "What is NSchema?", slug: "start/introduction" },
            { label: "Installation", slug: "start/installation" },
            { label: "Quickstart", slug: "start/quickstart" },
          ],
        },
        {
          label: "Guides",
          items: [
            { label: "The plan / apply workflow", slug: "guides/workflow" },
            { label: "Adopting an existing database", slug: "guides/adopting-a-database" },
            { label: "Offline planning & state", slug: "guides/state" },
            { label: "Detecting drift", slug: "guides/drift" },
            { label: "Deployment scripts", slug: "guides/deployment-scripts" },
            { label: "Destructive-action safety", slug: "guides/destructive-actions" },
            { label: "Running in CI", slug: "guides/ci" },
          ],
        },
        {
          label: "CLI Reference",
          items: [
            { label: "Overview", slug: "cli" },
            {
              label: "Commands",
              items: [{ autogenerate: { directory: "cli/commands" } }],
            },
            { label: "Configuration blocks", slug: "cli/configuration" },
            { label: "Environment variables", slug: "cli/environment-variables" },
            { label: "Exit codes", slug: "cli/exit-codes" },
          ],
        },
        {
          label: "DDL Language",
          items: [
            { label: "Defining schemas", slug: "ddl/defining-schemas" },
            { label: "Grammar reference", slug: "ddl/grammar" },
            { label: "Type reference", slug: "ddl/types" },
          ],
        },
        {
          label: "Providers",
          items: [
            { label: "Overview", slug: "providers" },
            { label: "PostgreSQL", slug: "providers/postgres" },
          ],
        },
        {
          label: "Backends",
          items: [
            { label: "Overview", slug: "backends" },
            { label: "Local file", slug: "backends/file" },
            { label: "Amazon S3", slug: "backends/s3" },
          ],
        },
        {
          label: "Library (Core)",
          items: [
            { label: "Embedding the engine", slug: "library/embedding" },
            { label: "Concepts & pipeline", slug: "library/concepts" },
            { label: "Configuration (C#)", slug: "library/configuration" },
            { label: "Extension points", slug: "library/extension-points" },
          ],
        },
        {
          label: "Reference",
          items: [{ label: "Roadmap", slug: "reference/roadmap" }],
        },
      ],
    }),
  ],
});
