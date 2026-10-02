import {convert} from "../lib/converter.js";
const MENU = "convert-xid";
let creating;
let queue = Promise.resolve();
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({id: MENU, title: "Convertir X-ID ↔ entier et copier", contexts: ["selection"]});
  });
});
async function ensureOffscreen() {
  const contexts = await chrome.runtime.getContexts({contextTypes: ["OFFSCREEN_DOCUMENT"], documentUrls: [chrome.runtime.getURL("src/offscreen/offscreen.html")]});
  if (contexts.length) return;
  if (!creating) {
    creating = chrome.offscreen.createDocument({url: "src/offscreen/offscreen.html", reasons: ["CLIPBOARD"], justification: "Copier le résultat de la conversion demandée par clic droit."}).finally(() => {creating = undefined;});
  }
  await creating;
}
async function processSelection(text) {
  try {
    const converted = convert(text);
    await chrome.storage.session.set({last: {...converted, copied: false}});
    await ensureOffscreen();
    const response = await chrome.runtime.sendMessage({target: "offscreen", type: "copy", text: converted.result});
    if (!response?.ok) throw new Error("Copie impossible. Ouvre la popup pour copier le résultat.");
    await chrome.storage.session.set({last: {...converted, copied: true}});
    await chrome.action.setBadgeBackgroundColor({color: "#16815d"});
    await chrome.action.setBadgeText({text: "OK"});
    await chrome.action.setTitle({title: `${converted.input} → ${converted.result} (copié)`});
  } catch (error) {
    await chrome.storage.session.set({error: error.message});
    await chrome.action.setBadgeBackgroundColor({color: "#b54738"});
    await chrome.action.setBadgeText({text: "!"});
    await chrome.action.setTitle({title: error.message});
  }
}
chrome.contextMenus.onClicked.addListener(info => {
  if (info.menuItemId === MENU) {
    queue = queue.catch(() => {}).then(async () => {
      await chrome.storage.session.remove("error");
      await processSelection(info.selectionText || "");
    });
  }
});
