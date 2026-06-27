// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightChangelogs, {
  makeChangelogsSidebarLinks,
} from "starlight-changelogs";
import starlightVersions from "starlight-versions";

// https://astro.build/config
export default defineConfig({
  site: "https://nschema.dev",
  integrations: [
    starlight({
      plugins: [
        starlightChangelogs(),
        // Multi-version docs. The live `src/content/docs/` tree is the current
        // (v4) docs; each archived version lives under `src/content/docs/<slug>/`
        // with a sidebar snapshot in `src/content/versions/<slug>.json`. To cut a
        // new version, add it here and start the dev server — the plugin archives
        // the current docs into that slug. See CLAUDE.md "Versioned docs".
        starlightVersions({
          current: { label: "Latest (4.x)" },
          versions: [{ slug: "v3", label: "v3.x" }],
        }),
      ],
      title: "NSchema",
      description: "A declarative database schema migration tool. Describe the schema you want; NSchema computes and applies the migration to get there.",
      logo: {
        light: "./assets/nschema-mark.svg",
        dark: "./assets/nschema-mark.svg"
      },
      favicon: "/favicon.svg",
      customCss: [
        // Self-hosted brand fonts — load before the theme so it can reference
        // them. Space Grotesk for headings/brand, JetBrains Mono for code.
        "@fontsource-variable/space-grotesk",
        "@fontsource-variable/jetbrains-mono",
        "./src/styles/theme.css",
      ],
      // The DDL grammar pages use ```ebnf fences; Shiki has no EBNF grammar, so
      // render them as plain monospace rather than emitting a warning per block.
      expressiveCode: {
        shiki: { langAlias: { ebnf: "txt" } },
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
        { label: "Start Here", items: [{ autogenerate: { directory: "start" } }] },
        { label: "Guides", items: [{ autogenerate: { directory: "guides" } }] },
        { label: "CLI Reference", items: [{ autogenerate: { directory: "cli" } }] },
        { label: "DDL Language", items: [{ autogenerate: { directory: "ddl" } }] },
        { label: "Providers", items: [{ autogenerate: { directory: "providers" } }] },
        { label: "Backends", items: [{ autogenerate: { directory: "backends" } }] },
        { label: "Library (Core)", items: [{ autogenerate: { directory: "library" } }] },
        { label: "Project", items: [{ autogenerate: { directory: "project" } }] },
        {
          // Generated from each package repo's GitHub releases by
          // starlight-changelogs; bases must match src/content.config.ts.
          label: "Changelog",
          items: makeChangelogsSidebarLinks([
            { type: "all", base: "changelog/cli", label: "CLI" },
            { type: "all", base: "changelog/core", label: "Core" },
            { type: "all", base: "changelog/postgres", label: "PostgreSQL" },
            { type: "all", base: "changelog/sqlserver", label: "SQL Server" },
            { type: "all", base: "changelog/sqlite", label: "SQLite" },
            { type: "all", base: "changelog/aws", label: "AWS" },
          ]),
        },
      ],
    }),
  ],
});
