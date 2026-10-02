// Recopie la version de package.json dans manifest.json et date la section [Unreleased] du CHANGELOG (appelé par `npm version`).
import {readFileSync, writeFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const {version} = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const manifestPath = join(root, "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
manifest.version = version;
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`manifest.json → ${version}`);
const changelogPath = join(root, "CHANGELOG.md");
const changelog = readFileSync(changelogPath, "utf8");
if (changelog.includes("## [Unreleased]")) {
  writeFileSync(changelogPath, changelog.replace("## [Unreleased]", `## [${version}] - ${new Date().toISOString().slice(0, 10)}`));
  console.log(`CHANGELOG.md : [Unreleased] → [${version}]`);
} else if (!changelog.includes(`## [${version}]`)) {
  console.warn(`CHANGELOG.md : ni « ## [Unreleased] » ni « ## [${version}] ». Les notes de la release GitHub seront vides.`);
}
