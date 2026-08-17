// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightChangelogs, {
  makeChangelogsSidebarLinks,
} from "starlight-changelogs";
import starlightVersions from "starlight-versions";
import starlightLinksValidator from "starlight-links-validator";
import sql from "@shikijs/langs/sql";

// The NSQL grammar is authored in NSchema.Core, beside the parser and the tests that keep the two in
// step, and is read straight from `main` so no copy of it lives here to go stale. The cost is a network
// call at build time: if GitHub is unreachable the build fails rather than quietly shipping NSQL as
// plain text, and a grammar change reaches the site on the next deploy without a commit here.
const nsql = {
  ...(await fetch(
    "https://raw.githubusercontent.com/nschema-org/NSchema.Core/main/grammar/nsql.tmLanguage.json",
  ).then((response) => response.json())),
  // Shiki keys a language by `name`; the grammar's own name is its display name in an editor.
  name: "nsql",
  // Script and routine bodies embed SQL. Shiki only resolves that include if the grammar is loaded
  // alongside, and an include that resolves to nothing takes the whole body rule down with it — which
  // would leave a body reading as NSQL rather than as the engine SQL it is. Hence `sql` in `langs`
  // below: a declared dependency is not loaded on demand, it has to be there already.
  embeddedLangs: ["sql"],
};

// https://astro.build/config
export default defineConfig({
  site: "https://nschema.dev",
  integrations: [
    starlight({
      plugins: [
        // Fails the build on broken internal links (e.g. a command page linking
        // to a route that doesn't exist). Runs in CI via `npm run build`.
        starlightLinksValidator({
          // /changelog/* routes are generated at build time by starlight-changelogs,
          // not content pages the validator can resolve. Everything else — including
          // the archived v3 snapshot — is validated.
          exclude: ["/changelog/**"],
        }),
        starlightChangelogs(),
        // Multi-version docs. The live `src/content/docs/` tree is the current
        // (v5) docs; each archived version lives under `src/content/docs/<slug>/`
        // with a sidebar snapshot in `src/content/versions/<slug>.json`. To cut a
        // new version, add it here and start the dev server — the plugin archives
        // the current docs into that slug. See CLAUDE.md "Versioned docs".
        starlightVersions({
          current: { label: "Latest (5.x)" },
          versions: [
            { slug: "v4", label: "v4.x" },
            { slug: "v3", label: "v3.x" },
          ],
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
      // ```nsql fences are the project language itself; ```sql stays for the engine
      // SQL a script body or a plan is made of.
      expressiveCode: {
        shiki: { langAlias: { ebnf: "txt" }, langs: [...sql, nsql] },
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
        { label: "NSQL Language", items: [{ autogenerate: { directory: "nsql" } }] },
        { label: "Providers", items: [{ autogenerate: { directory: "providers" } }] },
        { label: "Backends", items: [{ autogenerate: { directory: "backends" } }] },
        { label: "Library (Core)", items: [{ autogenerate: { directory: "library" } }] },
        { label: "Project", items: [{ autogenerate: { directory: "project" } }] },
        { label: "Upgrading", items: [{ autogenerate: { directory: "upgrade" } }] },
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
