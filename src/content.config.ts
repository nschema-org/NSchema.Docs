import { defineCollection } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";
import { changelogsLoader } from "starlight-changelogs/loader";

// NSchema's production history begins at 3.0.0 — the 0.x/1.x/2.x releases were
// the pre-CLI library era and are no longer meaningful. We don't delete those
// GitHub releases (they map to real published NuGet packages); we just hide
// pre-3.0 versions from the docs here. Returning `undefined` filters a version
// out; otherwise we strip any leading "v" from the tag for display.
const onlyV3Plus = ({ title }: { title: string }) => {
  const major = title.match(/(\d+)\.\d+\.\d+/);
  if (!major || Number(major[1]) < 3) return;
  return title.replace(/^v/, "");
};

// One changelog per NSchema package, sourced from each repo's GitHub releases.
// GH_API_TOKEN (a fine-grained PAT with Contents:read) is optional but lifts the
// build-time GitHub API rate limit from 60/hr to 5000/hr — set it in Netlify.
const ghPackage = (repo: string, base: string, title: string) => ({
  provider: "github" as const,
  owner: "nschema-org",
  repo,
  base,
  title,
  token: import.meta.env.GH_API_TOKEN,
  process: onlyV3Plus,
});

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  changelogs: defineCollection({
    loader: changelogsLoader([
      ghPackage("NSchema", "changelog/cli", "CLI"),
      ghPackage("NSchema.Core", "changelog/core", "Core"),
      ghPackage("NSchema.Postgres", "changelog/postgres", "PostgreSQL"),
      ghPackage("NSchema.Aws", "changelog/aws", "AWS"),
    ]),
  }),
};
