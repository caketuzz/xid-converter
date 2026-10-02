import {convert} from "../lib/converter.js";
import {showTooltip} from "../content/tooltip.js";
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
// Info-bulle près de la sélection. Échec silencieux (pages chrome://, Web Store, iframes d'une autre origine) : le badge suffit.
async function showInPage(tab, frameId, text, ok) {
  if (tab?.id === undefined || tab.id < 0) return;
  const target = {tabId: tab.id, frameIds: [frameId ?? 0]};
  await chrome.scripting.executeScript({target, func: showTooltip, args: [text, ok]}).catch(() => {});
}
async function processSelection(text, tab, frameId) {
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
    await showInPage(tab, frameId, converted.result, true);
  } catch (error) {
    await chrome.storage.session.set({error: error.message});
    await chrome.action.setBadgeBackgroundColor({color: "#b54738"});
    await chrome.action.setBadgeText({text: "!"});
    await chrome.action.setTitle({title: error.message});
    await showInPage(tab, frameId, error.message, false);
  }
}
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU) {
    queue = queue.catch(() => {}).then(async () => {
      await chrome.storage.session.remove("error");
      await processSelection(info.selectionText || "", tab, info.frameId);
    });
  }
});
