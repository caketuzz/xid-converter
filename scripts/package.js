// Construit les paquets d'installation, sans dépendance.
//   node scripts/package.js --unpacked         → dist/xid-converter/ seul (à charger en mode développeur)
//   node scripts/package.js                    → + dist/xid-converter-<version>.zip (Chrome Web Store)
//   node scripts/package.js --crx [--base-url=https://hôte/chemin]
//                                              → + .crx signé et update.xml (installation par politique)
import {execFileSync} from "node:child_process";
import {createHash, createPrivateKey, createPublicKey, generateKeyPairSync, sign} from "node:crypto";
import {cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync} from "node:fs";
import {dirname, join, relative} from "node:path";
import {fileURLToPath} from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const keyPath = process.env.CRX_KEY || join(root, "keys", "xid-converter.pem");
const args = process.argv.slice(2);
const unpackedOnly = args.includes("--unpacked");
const withCrx = args.includes("--crx");
const baseUrl = args.find(arg => arg.startsWith("--base-url="))?.slice("--base-url=".length).replace(/\/$/, "");

// Liste blanche : seul ce que Chrome charge entre dans le paquet.
// Exclus de fait : tests/, scripts/, store/, *.md, package.json, .git*, icons/icon-source.png, clés, dist/.
const INCLUDE = ["manifest.json", "LICENSE", "NOTICE", "src", "icons/icon-16.png", "icons/icon-32.png", "icons/icon-48.png", "icons/icon-128.png"];
const IGNORED = [/(^|\/)\.DS_Store$/, /(^|\/)\./, /\.test\.js$/, /\.map$/];

function collect(path) {
  const absolute = join(root, path);
  if (!existsSync(absolute)) throw new Error(`Fichier manquant : ${path}`);
  if (!statSync(absolute).isDirectory()) return [path];
  return readdirSync(absolute).sort().flatMap(name => collect(join(path, name)));
}

const files = INCLUDE.flatMap(collect).filter(file => !IGNORED.some(pattern => pattern.test(file)));
const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));

// Chaque fichier référencé par le manifest doit être présent dans le paquet.
const referenced = [
  manifest.background?.service_worker,
  manifest.action?.default_popup,
  ...Object.values(manifest.icons || {}),
  ...Object.values(manifest.action?.default_icon || {}),
].filter(Boolean);
const missing = referenced.filter(file => !files.includes(file));
if (missing.length) throw new Error(`Référencé par manifest.json mais absent du paquet : ${missing.join(", ")}`);
const pkgVersion = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
if (pkgVersion && pkgVersion !== manifest.version) throw new Error(`Version package.json (${pkgVersion}) ≠ manifest.json (${manifest.version})`);

// Dossier non empaqueté : chargeable en mode développeur et base du ZIP.
const unpacked = join(dist, "xid-converter");
rmSync(unpacked, {recursive: true, force: true});
for (const file of files) cpSync(join(root, file), join(unpacked, file));
console.log(`DIR  ${relative(root, unpacked)}/ (${files.length} fichiers)`);
for (const file of files) console.log(`     ${file}`);
if (unpackedOnly) process.exit(0);

const name = `xid-converter-${manifest.version}`;
const zipPath = join(dist, `${name}.zip`);
rmSync(zipPath, {force: true});
execFileSync("zip", ["-q", "-X", "-9", zipPath, ...files], {cwd: unpacked});
console.log(`ZIP  ${relative(root, zipPath)}`);

if (withCrx) {
  if (!existsSync(keyPath)) {
    mkdirSync(dirname(keyPath), {recursive: true});
    const {privateKey} = generateKeyPairSync("rsa", {modulusLength: 2048});
    writeFileSync(keyPath, privateKey.export({type: "pkcs8", format: "pem"}), {mode: 0o600});
    console.log(`Clé  ${relative(root, keyPath)} créée — à sauvegarder : elle fixe l'ID de l'extension.`);
  }
  const privateKey = createPrivateKey(readFileSync(keyPath));
  const publicKey = createPublicKey(privateKey).export({type: "spki", format: "der"});
  const crxId = createHash("sha256").update(publicKey).digest().subarray(0, 16);
  const extensionId = [...crxId.toString("hex")].map(c => String.fromCharCode(97 + parseInt(c, 16))).join("");

  // Format CRX3 : en-tête protobuf CrxFileHeader, signature RSA-SHA256 sur SignedData + ZIP.
  const field = (number, bytes) => Buffer.concat([varint((number << 3) | 2), varint(bytes.length), bytes]);
  const signedData = field(1, crxId);
  const zip = readFileSync(zipPath);
  const signature = sign("sha256", Buffer.concat([Buffer.from("CRX3 SignedData\x00"), uint32(signedData.length), signedData, zip]), privateKey);
  const header = Buffer.concat([field(2, Buffer.concat([field(1, publicKey), field(2, signature)])), field(10000, signedData)]);
  const crxPath = join(dist, `${name}.crx`);
  writeFileSync(crxPath, Buffer.concat([Buffer.from("Cr24"), uint32(3), uint32(header.length), header, zip]));
  console.log(`CRX  ${relative(root, crxPath)}`);
  console.log(`ID   ${extensionId}`);

  if (baseUrl) {
    const updatePath = join(dist, "update.xml");
    writeFileSync(updatePath, `<?xml version="1.0" encoding="UTF-8"?>
<gupdate xmlns="http://www.google.com/update2/response" protocol="2.0">
  <app appid="${extensionId}">
    <updatecheck codebase="${baseUrl}/${name}.crx" version="${manifest.version}"/>
  </app>
</gupdate>
`);
    console.log(`XML  ${relative(root, updatePath)}`);
    console.log(`Politique ExtensionInstallForcelist : ${extensionId};${baseUrl}/update.xml`);
  } else {
    console.log("update.xml non généré : passer --base-url=https://hôte/chemin (URL où seront hébergés .crx et update.xml).");
  }
}

function varint(value) {
  const bytes = [];
  while (value > 0x7f) {bytes.push((value & 0x7f) | 0x80); value >>>= 7;}
  bytes.push(value);
  return Buffer.from(bytes);
}

function uint32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value);
  return buffer;
}
