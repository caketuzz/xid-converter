import {convert} from "../lib/converter.js";
const input = document.getElementById("input");
const output = document.getElementById("result");
const label = document.getElementById("label");
const copy = document.getElementById("copy");
const status = document.getElementById("status");
let current = "";
document.getElementById("version").textContent = `X-ID Converter v${chrome.runtime.getManifest().version}`;
function update() {
  current = "";
  copy.disabled = true;
  status.textContent = "";
  output.textContent = "—";
  label.textContent = "Result";
  if (!input.value.trim()) return;
  try {
    const converted = convert(input.value);
    current = converted.result;
    output.textContent = current;
    label.textContent = converted.label;
    copy.disabled = false;
  } catch (error) {status.textContent = error.message;}
}
input.addEventListener("input", update);
copy.addEventListener("click", async () => {
  try {await navigator.clipboard.writeText(current); status.textContent = "Copied!";}
  catch {status.textContent = "Could not copy. Select the result to copy it.";}
});
input.addEventListener("keydown", event => {if (event.key === "Enter" && current) copy.click();});
async function init() {
  const {last, error} = await chrome.storage.session.get(["last", "error"]);
  if (last) {input.value = last.input; update();}
  if (error) status.textContent = error;
  else if (last?.copied) status.textContent = "Last selection: result already copied.";
  await chrome.action.setBadgeText({text: ""});
  input.focus();
  input.select();
}
init().catch(() => {status.textContent = "History unavailable.";});
