// Injecté dans la page par chrome.scripting.executeScript : la fonction doit rester autonome (aucune référence externe).
export function showTooltip(text, ok) {
  const ID = "xid-converter-tooltip";
  document.getElementById(ID)?.remove();

  // Rectangle de la sélection ; dans un champ de saisie, celui du champ.
  let rect;
  const active = document.activeElement;
  if (active && /^(INPUT|TEXTAREA)$/.test(active.tagName) && active.selectionStart !== active.selectionEnd) {
    rect = active.getBoundingClientRect();
  } else {
    const selection = getSelection();
    if (selection?.rangeCount) rect = selection.getRangeAt(0).getBoundingClientRect();
  }
  if (!rect || (!rect.width && !rect.height)) rect = {top: 8, right: innerWidth - 8, bottom: 8};

  const host = document.createElement("div");
  host.id = ID;
  host.style.cssText = "all: initial; position: fixed; z-index: 2147483647; top: 0; left: 0;";
  const shadow = host.attachShadow({mode: "closed"});
  shadow.innerHTML = `<style>
    .tip {font: 600 13px/1.3 system-ui, -apple-system, sans-serif; color: #fff; background: ${ok ? "#16815d" : "#b54738"};
      padding: 6px 10px; border-radius: 6px; box-shadow: 0 2px 8px rgb(0 0 0 / .25); white-space: nowrap; max-width: 320px;
      overflow: hidden; text-overflow: ellipsis; cursor: pointer; animation: in .15s ease-out;}
    .tip.error {white-space: normal; max-width: 260px;}
    .tip.out {opacity: 0; transition: opacity .2s;}
    .tip span {font-weight: 400; opacity: .85;}
    @keyframes in {from {opacity: 0; transform: translateY(4px);}}
    @media (prefers-reduced-motion: reduce) {.tip {animation: none;} .tip.out {transition: none;}}
  </style><div class="tip" role="status"></div>`;
  const tip = shadow.querySelector(".tip");
  if (ok) {
    tip.textContent = text + " ";
    tip.append(Object.assign(document.createElement("span"), {textContent: "copied"}));
  } else {
    tip.textContent = text;
    tip.classList.add("error");
  }
  (document.body || document.documentElement).append(host);

  // Coin haut droit de la sélection, au-dessus ; en dessous s'il manque de place, toujours dans la fenêtre.
  const {width, height} = tip.getBoundingClientRect();
  const left = Math.max(8, Math.min(rect.right + 4, innerWidth - width - 8));
  const top = rect.top - height - 4 >= 8 ? rect.top - height - 4 : Math.min(rect.bottom + 4, innerHeight - height - 8);
  host.style.transform = `translate(${left}px, ${top}px)`;

  const remove = () => {
    removeEventListener("scroll", remove, true);
    host.remove();
  };
  const timer = setTimeout(() => {
    tip.classList.add("out");
    setTimeout(remove, 200);
  }, ok ? 2500 : 4000);
  tip.addEventListener("click", () => {clearTimeout(timer); remove();});
  addEventListener("scroll", remove, {capture: true, passive: true});
}
