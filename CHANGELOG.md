# Changelog 📋

All notable changes to **OmniSym** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

🌐 **Language**: **English 🇬🇧** | [Français 🇫🇷](CHANGELOG.fr.md)

---

## [2.7.0] — 2026-11-21

### Added
- **Project Rebranding**: Officially renamed to **OmniSym** (*Omni* = universal all-in-one media orchestrator, *Sym* = instant symlinks & storage symbiosis) to accurately reflect its capabilities beyond mere debriding.
- **Browser Integrations (1-Click & Right-Click)**:
  - **Google Chrome / Chromium Extension (Manifest V3)**:
    - Native browser right-click context menu integration for links and selected text.
    - Quick actions for Default, Symlink (Instant), and Download (Local) modes.
    - Status popup with live server ping, category selection, and instant web app launcher.
    - Native desktop notifications on successful uploads or errors.
    - Direct `.zip` download package available from settings.
  - **Tampermonkey / Violentmonkey Userscript**:
    - Right-click context popup on magnets, torrents, and direct download links (1fichier, Rapidgator, etc.).
    - Automatic `⚡` quick-download badges injected next to magnet links.
    - `Alt + Left Click` instant-send shortcut.
- **Full Progressive Web App (PWA) Support**:
  - Web App Manifest (`manifest.json`) enabling installability as a standalone application on Android, iOS, Windows, macOS, and Linux.
  - Dedicated high-resolution application icons (192x192 and 512x512 PNG, including adaptive `maskable` variants for Android launchers).
  - Lightweight and resilient Service Worker (`sw.js`) with Network-First strategy and App Shell offline caching.
  - Root endpoints `/manifest.json`, `/sw.js`, and `/favicon.ico` mounted with `Service-Worker-Allowed: /` header and bypassed from authentication blocking.
  - **Native Android Web Share Target**: Integrates directly into Android's native "Share" sheet to receive DDL links, magnets, or `.torrent` files from any app (full MyJDownloader mobile replacement).
  - **Magnet Protocol Handler**: Tapping `magnet:` links opens OmniSym automatically.
  - **Home Screen App Shortcuts**: Quick launcher actions on Android.
- **Bidirectional Telegram Bot Controller**:
  - Background listener allowing remote download submissions directly via Telegram chat.
  - Send or share magnets, DDL links, or `.torrent` files to your private bot from anywhere (works on 4G/5G without VPN or port forwarding); OmniSym queues the download and replies with confirmation.

---

## [2.6.0] — 2026-11-21

### Added
- **Real-Time Debrid Status Indicator**:
  - Displays instant cloud cache status directly in the queue table and mobile cards.
  - `⚡ Cached (Instant)`: Torrent was already cached 100% on provider servers when added.
  - `⚡ Debrided`: File has finished downloading on the provider cloud and is ready.
  - `⏳ Not Cached (Cloud X% • Y sources)`: File is downloading on the provider from BitTorrent peers; displays live progress and active seeders.
  - DDL links automatically display `⚡ Debrided` upon link unlocking.
- **Modular Frontend Architecture**:
  - Split the monolithic `app.js` (3,500+ lines) into 8 clean, specialized functional modules:
    - `i18n.js`: Multilingual dictionaries (EN/FR), provider metadata, language & theme switchers.
    - `queue.js`: Queue rendering, DDL management, formatting utilities, batch actions, and modals.
    - `settings.js`: Sub-navigation, API connection diagnostics, custom directories, and Telegram notifications.
    - `onboarding.js`: Step-by-step interactive setup wizard (steps 1 to 4).
    - `scanner.js`: Media library scanning, broken symlink detection, cloud magnet management, and \*arr auto-search.
    - `finder.js`: Multi-engine web search (Brave, DuckDuckGo, etc.), filters, and 1-click debrid injection.
    - `speedtest.js`: Latency benchmarks and real-time bandwidth tests.
    - `app.js`: Lightweight application entry point, lifecycle events, and polling loops.
- **FastAPI StaticFiles Mount**: Native high-performance serving of all static assets (`/static/`) with HTTP caching and ETags.

### Changed
- Refactored `index.html` to load modular scripts in deterministic order.
- Updated AllDebrid and Real-Debrid provider adapters to return `ready` flags on upload and during status polling.

---

## [2.5.0] — 2026-11-20

### Added
- **Integrated Speedtest & Network Diagnostics**:
  - Measure latency (ping) to AllDebrid datacenters and global DNS nodes directly from the host.
  - Benchmark real download and upload bandwidth in both Mbps and MB/s via `/api/speedtest/run`.
- **Comprehensive Bilingual Documentation**:
  - English `README.md` as primary landing page for open-source community.
  - Dedicated French `README.fr.md`.
  - Added project badges including official Google Gemini attribution badge.
- **Official MIT License**: Created `LICENSE` file.

### Changed
- **Rebranding**: Renamed project across all files and docker services from `PyRDT` to **OmniSym**.
- Improved torrent retry flow: automatically removes stale/failed IDs and re-uploads magnets cleanly to restart resolution.

---

## [2.0.0] — 2026-11-19

### Added
- **Direct Download (DDL) Manager**:
  - Unlock and download files from major hosters (1fichier, Rapidgator, Turbobit, Uptobox, etc.).
  - Dedicated DDL queue and customizable local destination directories.
- **Multi-Engine Finder**:
  - Unified search querying DuckDuckGo, Brave, Google, Bing, Yandex, and Mojeek simultaneously.
  - Filter by magnets, torrents, or direct hoster links with 1-click queue injection.
- **Smart Media Library & Broken Link Scanner**:
  - Sub-2 second incremental cache using file modification timestamps (`mtime`).
  - Automatic broken symlink detection for purged cloud files.
  - Direct integration with Radarr and Sonarr APIs to auto-retrigger missing media searches.
  - Cloud magnet manager to clean up duplicate or orphan cloud torrents.
- **Telegram Notifications**:
  - Instant notifications for completed downloads (with average speed and file size).
  - Alerts for library scan results and provider errors.
- **Modern Responsive Web UI**:
  - Mobile, tablet, and desktop responsive layout.
  - Dark and Light themes.
  - Instant English / French language toggle.
  - Interactive onboarding assistant for first-time setup.

---

## [1.0.0] — 2026-11-15

### Added
- **qBittorrent WebAPI v2 Emulation**: Seamless integration with Sonarr, Radarr, Whisparr, Lidarr, and Prowlarr.
- **Dual Processing Modes**:
  - Instant zero-storage symbolic links (via rclone cloud mount).
  - Real physical local disk downloads with rate-limiting.
- **Multi-Provider Support**: AllDebrid, Real-Debrid, Premiumize.me, Debrid-Link, TorBox, and High-Way.me.
- **Docker & Bare-Metal Setup**: Automated `install.sh` and `docker-compose.yml` support.
