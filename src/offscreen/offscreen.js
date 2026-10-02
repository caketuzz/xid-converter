chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target !== "offscreen" || message.type !== "copy" || sender.id !== chrome.runtime.id) return;
  const field = document.getElementById("clipboard");
  try {
    field.value = message.text;
    field.focus();
    field.select();
    // Le document hors écran ne peut pas prendre le focus de la fenêtre.
    // execCommand reste nécessaire pour ce cas d'usage Chrome MV3.
    const ok = document.execCommand("copy");
    sendResponse({ok});
  } catch {
    sendResponse({ok: false});
  } finally {
    field.value = "";
  }
});
