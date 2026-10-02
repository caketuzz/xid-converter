# X-ID Converter — Chrome MV3

Extension légère, sans build ni dépendance. Conversion automatique entre un entier décimal et `x` + sa représentation base 36. Calculs avec BigInt pour conserver la précision des grands identifiants.

## Installation

1. Lancer `npm run build` : crée `dist/xid-converter/`, qui ne contient que les fichiers de l'extension (ni clés, ni tests, ni sources annexes). Pour une installation sans mode développeur, voir *Packaging*.
2. Ouvrir `chrome://extensions` dans Chrome (version 116 minimum).
3. Activer **Mode développeur** en haut à droite.
4. Cliquer **Charger l'extension non empaquetée** et sélectionner le dossier `dist/xid-converter`. Après une modification, relancer `npm run build` puis cliquer sur ↻ dans `chrome://extensions`.
5. Épingler l'extension depuis le bouton Extensions de Chrome.

## Utilisation

- **Popup** : coller un entier ou un X-ID. La conversion est immédiate. Cliquer **Copier le résultat**, ou appuyer sur Entrée dans le champ.
- **Clic droit** : sélectionner uniquement l'identifiant sur une page, puis **Convertir X-ID ↔ entier et copier**. Le résultat est copié automatiquement et une info-bulle l'affiche en haut à droite de la sélection (clic dessus ou défilement pour la fermer). Un badge **OK** apparaît sur l'extension ; **!** signale une erreur, détaillée dans la popup. La dernière conversion par clic droit reste visible dans la popup pour la session Chrome courante.
- Les espaces autour de l'identifiant et les lettres majuscules sont acceptés. Les URL, préfixes JSON, signes et sélections de plusieurs identifiants sont rejetés.

Exemples : `x9yazc2` ↔ `601814882` ; `x9yazc6` ↔ `601814886`.

## Permissions et confidentialité

Tout fonctionne localement, sans serveur, requête réseau, télémétrie ni accès général aux pages. L'extension ne lit pas le presse-papiers.

- `activeTab` + `scripting` : affichage de l'info-bulle dans l'onglet où le menu vient d'être utilisé, uniquement à ce moment-là (aucun accès permanent aux pages, aucun avertissement à l'installation).
- `contextMenus` : menu sur le texte sélectionné.
- `clipboardWrite` : écriture du résultat dans le presse-papiers.
- `offscreen` : document masqué nécessaire à la copie depuis le service worker.
- `storage` : dernière conversion et éventuelle erreur, en mémoire de session uniquement.

Chrome n'affiche pas nécessairement le menu d'une extension dans certaines surfaces internes, notamment les DevTools. Dans ce cas, utiliser la popup. Le service worker utilise le document hors écran et `execCommand('copy')`, conformément au modèle de l'exemple offscreen-clipboard de Chrome.

## Structure

```
manifest.json
icons/                           icon-16/32/48/128.png, icon-source.png (original à redimensionner)
src/
  background/service-worker.js   menu contextuel, badge, orchestration de la copie
  popup/                         popup.html, popup.js, popup.css
  content/tooltip.js             info-bulle injectée dans la page après un clic droit
  offscreen/                     document hors écran pour la copie (offscreen.html, offscreen.js)
  lib/converter.js               conversion X-ID ↔ entier (partagée, testée)
tests/                           tests Node (node --test)
```

## Packaging (installation sans mode développeur)

Chrome n'installe une extension hors mode développeur que depuis le Chrome Web Store, ou par politique d'entreprise. Un `.crx` glissé dans `chrome://extensions` est refusé.

```
npm run build                                      # dist/xid-converter/ (mode développeur)
npm run package                                    # + dist/xid-converter-<version>.zip
npm run package:crx -- --base-url=https://hôte/xid # + .crx signé et update.xml
```

Les deux commandes lancent les tests d'abord. Le paquet est construit à partir d'une liste blanche (`manifest.json`, `src/`, `icons/icon-{16,32,48,128}.png`), avec rejet des fichiers cachés (`.DS_Store`…). Le script vérifie que chaque fichier référencé par le manifest est présent, et que les versions de `package.json` et `manifest.json` concordent. Exclus : `tests/`, `scripts/`, `README.md`, `package.json`, `icons/icon-source.png`, `keys/`, `dist/`.

**Chrome Web Store** (recommandé) : envoyer le ZIP dans le [Developer Dashboard](https://chrome.google.com/webstore/devconsole). Choisir la visibilité *Privé* pour restreindre l'extension au domaine Google Workspace, ou *Non répertorié* pour l'accès par lien. Les mises à jour sont automatiques : incrémenter `version` dans `manifest.json` et `package.json`, puis renvoyer le ZIP.

**Auto-hébergé, par politique** : héberger `dist/*.crx` et `dist/update.xml` à l'URL passée en `--base-url`. Déployer ensuite la politique `ExtensionInstallForcelist` (ou `ExtensionSettings`) avec la valeur `<ID>;<base-url>/update.xml`, affichée par le script. Chrome n'applique ces politiques aux extensions hors Web Store que sur des postes gérés (MDM sur macOS, domaine/Intune sur Windows, ou Chrome Browser Cloud Management).

La clé de signature `keys/xid-converter.pem` est créée au premier `package:crx` (chemin modifiable via `CRX_KEY`). Elle détermine l'ID de l'extension : la sauvegarder hors du dépôt (elle est ignorée par git). La perdre oblige à redéployer sous un nouvel ID.

## Développement et vérification

`npm test` (Node.js 18+) lance les tests de conversion, sans installation préalable.

Vérification manuelle après installation : sélectionner `x9yazc2` dans une page web, déclencher le menu puis coller dans un champ : attendu `601814882`. Refaire avec `601814886` : attendu `x9yazc6`. Sélectionner `bonjour!` : attendu badge `!` et message dans la popup. Vérifier aussi la conversion et la copie dans la popup.

Les tests automatiques couvrent la conversion. La copie et le menu doivent être vérifiés dans Chrome avec l'extension chargée.

Documentation :
- https://developer.chrome.com/docs/extensions/reference/api/contextMenus
- https://developer.chrome.com/docs/extensions/reference/api/offscreen
- https://github.com/GoogleChrome/chrome-extensions-samples/tree/main/functional-samples/cookbook.offscreen-clipboard
