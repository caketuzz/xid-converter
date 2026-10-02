// Génère les visuels du Chrome Web Store dans store/ avec Chrome headless, à partir des vrais fichiers de l'extension.
//   node scripts/store-assets.js      (CHROME=/chemin/vers/chrome pour un autre binaire)
// Captures 1280×800, vignette promo 440×280 et bannière 1400×560 ; page de démonstration fictive (aucune marque réelle).
import {execFileSync} from "node:child_process";
import {mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";
import {convert} from "../src/lib/converter.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "store");
const chrome = process.env.CHROME || (process.platform === "darwin" ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" : "google-chrome");
const read = path => readFileSync(join(root, path), "utf8");
const dataUri = path => `data:image/png;base64,${readFileSync(join(root, path)).toString("base64")}`;
const escape = text => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

const version = JSON.parse(read("manifest.json")).version;
const tooltip = read("src/content/tooltip.js").replace(/^export /m, "");
const icon32 = dataUri("icons/icon-32.png");
const icon128 = dataUri("icons/icon-128.png");

// La popup réelle (HTML + CSS), figée dans un état donné.
function popup({input, label, result, status}) {
  const html = read("src/popup/popup.html")
    .replace(/<link rel="stylesheet"[^>]*>/, `<style>${read("src/popup/popup.css")}</style>`)
    .replace(/<script[^>]*><\/script>/, "")
    .replace(/<input id="input"/, `<input id="input" value="${input}"`)
    .replace(/<span id="label">[^<]*/, `<span id="label">${label}`)
    .replace(/<output id="result"([^>]*)>[^<]*/, `<output id="result"$1>${result}`)
    .replace(/<button id="copy" disabled>/, `<button id="copy">`)
    .replace(/<p id="status" role="status"><\/p>/, `<p id="status" role="status">${status}</p>`)
    .replace(/<span id="version">[^<]*/, `<span id="version">X-ID Converter v${version}`);
  return `<iframe class="popup" srcdoc="${escape(html)}"></iframe>`;
}

// Paires calculées par le convertisseur : les captures restent exactes.
const rows = [
  ["x9yazc2", "Product overview — extended cut", "12:04"],
  ["x9yazc6", "Interview: behind the scenes", "11:52"],
  ["x9yb1kq", "Tutorial: getting started", "11:37"],
  ["x9yb2m0", "Match highlights", "10:58"],
  ["x9yb3c4", "Official trailer", "10:21"],
].map(([xid, ...rest]) => [xid, convert(xid).result, ...rest]);

function browser({badge = "", body, after = ""}) {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><style>
    * {box-sizing: border-box;} html, body {margin: 0; height: 100%;}
    body {font: 14px/1.4 system-ui, -apple-system, sans-serif; color: #1f2937; background: #f3f4f6; overflow: hidden;}
    .tabs {height: 40px; background: #dfe3e8; display: flex; align-items: end; padding: 0 12px;}
    .tab {background: #fff; border-radius: 10px 10px 0 0; padding: 9px 16px; width: 240px; font-size: 12px; color: #374151;}
    .bar {height: 44px; background: #fff; display: flex; align-items: center; gap: 12px; padding: 0 14px; border-bottom: 1px solid #e5e7eb;}
    .url {flex: 1; background: #f1f3f4; border-radius: 16px; padding: 7px 16px; color: #4b5563; font-size: 13px;}
    .ext {position: relative; width: 28px; height: 28px; display: grid; place-items: center; border-radius: 50%; background: #eef2ff;}
    .ext img {width: 18px; height: 18px;}
    .badge {position: absolute; right: -6px; bottom: -4px; background: #16815d; color: #fff; font: 700 9px/1 system-ui; padding: 2px 3px; border-radius: 4px;}
    main {padding: 28px 40px;} h1 {font-size: 22px; margin: 0 0 4px;} .sub {color: #6b7280; margin: 0 0 20px;}
    .search {display: flex; gap: 10px; margin-bottom: 18px;} .search input {width: 320px; padding: 9px 12px; border: 1px solid #d1d5db; border-radius: 8px; font: 14px ui-monospace, monospace;}
    .search button {padding: 9px 16px; border: 0; border-radius: 8px; background: #374151; color: #fff;}
    table {width: 100%; border-collapse: collapse; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 2px rgb(0 0 0 / .06);}
    th, td {text-align: left; padding: 13px 16px; border-bottom: 1px solid #f0f1f3;} th {font-size: 12px; color: #6b7280; font-weight: 600; background: #fafafa;}
    td code {font: 13px ui-monospace, monospace; color: #111827;}
    .popup {position: absolute; top: 86px; right: 14px; width: 330px; height: 440px; border: 0; border-radius: 10px; box-shadow: 0 10px 30px rgb(0 0 0 / .3); background: #131b2a;}
    .caption {position: absolute; left: 40px; bottom: 32px; background: #131b2a; color: #e9eef8; padding: 14px 22px; border-radius: 12px; font-size: 20px; font-weight: 600;}
    .caption span {color: #8aafff;}
  </style><body>
    <div class="tabs"><div class="tab">Videos — Admin console</div></div>
    <div class="bar"><span>←</span><span>→</span><span>↻</span><div class="url">admin.example.com/videos</div>
      <div class="ext"><img src="${icon32}" alt="">${badge ? `<span class="badge">${badge}</span>` : ""}</div></div>
    <main>${body}</main>${after}
  </body></html>`;
}

function videosPage({search = ""} = {}) {
  return `<h1>Videos</h1><p class="sub">Sample internal page listing IDs.</p>
    <div class="search"><input id="search" value="${search}" placeholder="Search by ID"><button>Search</button></div>
    <table><tr><th>X-ID</th><th>ID</th><th>Title</th><th>Updated</th></tr>
    ${rows.map(([xid, id, title, time], i) => `<tr><td><code id="x${i}">${xid}</code></td><td><code>${id}</code></td><td>${title}</td><td>${time}</td></tr>`).join("")}</table>`;
}

const select = `const select = el => {const r = document.createRange(); r.selectNodeContents(el); getSelection().removeAllRanges(); getSelection().addRange(r);};`;

const shots = {
  "screenshot-1-right-click.png": [1280, 800, browser({
    badge: "OK",
    body: videosPage(),
    after: `<div class="caption">Right-click an ID <span>→</span> converted, copied and shown next to it</div>
      <script>${tooltip}${select} select(document.getElementById("x0")); showTooltip("601814882", true);</script>`,
  })],
  "screenshot-2-popup.png": [1280, 800, browser({
    body: videosPage(),
    after: `${popup({input: "x9yazc2", label: "Integer", result: "601814882", status: "Copied!"})}
      <div class="caption">Popup <span>·</span> paste an X-ID or an integer, converted instantly</div>`,
  })],
  "screenshot-3-input-field.png": [1280, 800, browser({
    badge: "OK",
    body: videosPage({search: "601814886"}),
    after: `<div class="caption">Works in input fields too <span>·</span> integer → X-ID</div>
      <script>${tooltip} const field = document.getElementById("search"); field.focus(); field.select(); showTooltip("x9yazc6", true);</script>`,
  })],
};

function promo(width, height) {
  const scale = height / 280;
  return `<!doctype html><meta charset="utf-8"><style>
    html, body {margin: 0; height: 100%;}
    body {display: flex; align-items: center; justify-content: center; gap: ${28 * scale}px; background: radial-gradient(circle at 30% 20%, #22314d, #131b2a 70%);
      font-family: system-ui, -apple-system, sans-serif; color: #e9eef8;}
    img {width: ${110 * scale}px; height: ${110 * scale}px;}
    h1 {font-size: ${34 * scale}px; margin: 0 0 ${8 * scale}px;} h1 span {color: #8aafff;}
    p {margin: 0; font: ${17 * scale}px ui-monospace, monospace; color: #a7b4cb;}
  </style><body><img src="${icon128}" alt=""><div><h1>X-ID <span>↔</span> integer</h1><p>x9yazc2 ⇄ 601814882</p></div></body>`;
}
shots["promo-small-440x280.png"] = [440, 280, promo(440, 280)];
shots["promo-marquee-1400x560.png"] = [1400, 560, promo(1400, 560)];

const tmp = mkdtempSync(join(tmpdir(), "xid-store-"));
mkdirSync(out, {recursive: true});
try {
  for (const [name, [width, height, html]] of Object.entries(shots)) {
    const page = join(tmp, name.replace(/\.png$/, ".html"));
    writeFileSync(page, html);
    execFileSync(chrome, ["--headless", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1", `--window-size=${width},${height}`,
      "--virtual-time-budget=1000", `--screenshot=${join(out, name)}`, `file://${page}`], {stdio: "ignore"});
    console.log(`store/${name} (${width}×${height})`);
  }
} finally {
  rmSync(tmp, {recursive: true, force: true});
}
