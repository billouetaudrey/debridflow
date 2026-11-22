# Privacy Policy — OmniSym Extension & Applications

**Last Updated:** November 21, 2026

Your privacy is paramount. **OmniSym** is an open-source, self-hosted suite. We believe in complete data ownership and transparency.

---

## 1. Information Collection & Usage

- **Zero Data Collection**: The **OmniSym Chrome Extension**, Progressive Web App (PWA), and userscripts do **not** collect, store, track, transmit, or sell any personal data, browsing history, telemetry, analytics, or identifying information.
- **Direct Local Communication**: All requests made by the extension (uploading magnets, torrent files, or download links) are routed strictly and directly between your web browser and your self-hosted OmniSym instance (e.g., `http://192.168.x.x:6505` or your private domain).
- **No Third-Party Servers**: There are no intermediary analytics, tracking servers, or telemetry endpoints operated by OmniSym.

---

## 2. Browser Extension Permissions

The OmniSym browser extension requests the following permissions solely for its core features:

| Permission | Purpose |
| :--- | :--- |
| `contextMenus` | Adds the *"⚡ Send to OmniSym"* item to your browser's right-click context menu. |
| `storage` | Saves your OmniSym server URL and category preferences locally in your browser (`chrome.storage.sync`). |
| `notifications` | Displays desktop notifications confirming when a link was successfully sent or if an error occurred. |
| `<all_urls>` | Enables the extension to communicate with your self-hosted server on any private IP or custom domain, and allows capturing links on pages you right-click. |

---

## 3. Third-Party Services

When you send a link to OmniSym, your self-hosted OmniSym server communicates directly with your configured debrid provider (e.g., AllDebrid, Real-Debrid, Premiumize) using your private API key. Please refer to your chosen debrid provider's privacy policy regarding their file processing and storage terms.

---

## 4. Open-Source Code

The full source code of OmniSym and its browser extension is open-source and publicly inspectable on GitHub:  
👉 [github.com/billouetaudrey/omnisym](https://github.com/billouetaudrey/omnisym)

---

## 5. Contact

For questions or security disclosures, please open an issue or discussion on the official GitHub repository.
