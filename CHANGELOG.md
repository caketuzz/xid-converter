# Changelog

All notable changes to this project are documented here. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [Semantic Versioning](https://semver.org/).

## [2.2.0] - 2026-10-02

### Changed
- Extension UI switched from French to English: popup, context menu, tooltip, error messages, manifest description and toolbar title.
- Store screenshots and promo tiles regenerated in English.

### Added
- Author, homepage and short name in the manifest; version, author and GitHub link in the popup footer.
- `NOTICE`, shipped with the extension alongside `LICENSE`.
- Privacy policy, changelog, Chrome Web Store listing texts and images (`npm run store-assets`).
- English README, with the French version kept below.

## [2.1.0] - 2026-10-02

### Added
- In-page tooltip after a right-click conversion, at the top-right of the selection: green with the copied result, red with the error message.
- `activeTab` and `scripting` permissions, used only to display that tooltip.

## [2.0.0] - 2026-10-02

### Added
- Chrome extension structure: `manifest.json` at the root, sources under `src/`, icons under `icons/`.
- Packaging scripts: unpacked build (`npm run build`), Chrome Web Store ZIP (`npm run package`), signed CRX3 and `update.xml` for self-hosted policy installs (`npm run package:crx`).

