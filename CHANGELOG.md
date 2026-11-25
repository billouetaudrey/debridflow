# Changelog 📋

All notable changes to **OmniSym** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

🌐 **Language**: **English 🇬🇧** | [Français 🇫🇷](CHANGELOG.fr.md)

---

## [2.9.2] — 2026-11-25

### Added
- **Live Elapsed Time and Estimated Remaining Time (ETA) Display**:
  - Dynamically calculates and displays elapsed time (`⏱️ Elapsed: Xm Ys`) and estimated remaining time (`⏳ Remaining: Xh Ym`) under progress bars for active local copies and cloud downloads.
  - Formats durations adaptively with day, hour, minute, and second units (`d`, `h`, `m`, `s`).
  - Integrates session storage persistence to preserve elapsed time tracking across page reloads.
- **Progressive Auto-Retries for Rclone Mounted Releases**:
  - Implemented an escalating backoff retry schedule (10s, 20s, 30s, 60s, 120s, 180s — 7 minutes total) when a torrent is completed on the debrid provider (`statusCode == 4`) but not yet indexed in the local rclone VFS mount (`/mnt/alldebrid/magnets`).
  - Eliminates premature error states and false timeouts previously caused by rigid 60s static timeouts.
  - **Proactive Rclone VFS Cache Invalidation**: Automatic calls to the rclone Remote Control (RC) API (`POST /vfs/refresh`) for the `magnets` directory before each scheduled retry and on manual resumption, forcing rclone to refresh its WebDAV directory cache without delay.
  - **Interactive Countdown & Progress Badges in Queue**: Displays the live retry attempt and remaining seconds countdown inside the status badge (`⏳ Waiting for rclone (attempt X/6 • in Ys)`).
  - **Fuzzy & Resilient Folder Matching**: Added normalized release name matching (`simplify_name`) ignoring minor punctuation, dot/space differences, and bracket variations between the torrent metadata and the mounted filesystem.
  - **Instant Reset on Manual Resume/Retry**: Resuming or retrying an item resets retry attempts and immediately triggers a VFS refresh in the background.
  - **Rclone RC API Configuration**: Added configurable `rclone_rc_url` setting with live status feedback during the connection test.

### Fixed
- **Worker Coroutine Crash on Startup**:
  - Fixed missing `Optional` import in `app/worker.py` that caused a silent `NameError` crash inside `background_worker` on Python 3.12.
  - Added robust task done callbacks in `main.py` lifespan to log any unhandled background task exceptions.
- **Queue Status Text for Cached/Ready Debrided Torrents**:
  - Added `st_init_transfer` status label ("Initialisation transfert...") preventing fallback to "Débridage en cours..." when a debrided release is queued for transfer.
- **Resilient UI Auto-Refresh & PWA Cache Invalidation**:
  - Implemented an `AbortController` 8-second request timeout in `refreshQueue` preventing `isFetching` lockups on slow or pending requests.
  - Wrapped queue row rendering and header status updates in protective `try...catch` blocks.
  - Fixed variable scope reference error in DDL table rendering.
  - Bumped PWA service worker cache name to `omnisym-pwa-v2` and asset query versioning to `?v=2.8` to force clean cache updates.
- **Fix upload crash for manual .torrent files**:
  - Resolved `cannot access local variable 'raw_url' where it is not associated with a value` error occurring when uploading standalone `.torrent` files in the web UI without accompanying magnet links.
  - Automatically generates a synthetic magnet URI (`magnet:?xt=urn:btih:...`) allowing future retries of uploaded torrents.
- **Concurrent Transfers and Multi-Part Torrents (Part 1, Part 2) Handling**:
  - **Support for AllDebrid ID-Suffixed Mount Folders**: Automatically matches folders named `<title> (<ad_id>)` created by AllDebrid when multiple torrents share the exact same release title.
  - **Hash-Isolated Temporary Files**: Names temporary `.part` files using the torrent's short hash (`.<name>.<hash>.part`), preventing accidental overwrites or file deletions when concurrent torrents share the same folder or release name.
  - **Destination Path Concurrency Lock**: Automatically queues transfers targeting the exact same destination directory to serialize execution and eliminate write collisions.
  - **Deduplication of Already Completed Files**: Skips re-copying existing files that already match the source file size, allowing smooth merging of complementary multi-part releases into a single target directory.
  - **Recursive Parent Directory Creation**: Added `dst.parent.mkdir(parents=True, exist_ok=True)` preventing `[Errno 2] No such file or directory` errors.

## [2.9.1] — 2026-11-23

### Added
- **Remember Choice in Deletion Options**:
  - Added "Remember my choice" checkbox in the deletion confirmation modal (`#del-modal`).
  - Persistent `localStorage` storage for the user's deletion preferences ("Also delete local files / symlinks" and "Also delete magnet on AllDebrid").
  - Automatically pre-selects the saved choices whenever the deletion dialog is opened.
- **Alternative Finder Search for Errored Magnets and Downloads**:
  - Added dedicated `🔍 Search` action button and inline clickable magnifying glass next to the filename for any torrent or DDL download in `error` state in the queue.
  - Automatically switches to the Multi-Engine Finder tab, pre-fills the cleaned release title, and initiates a search with one click to find replacements.
  - Also integrated into the Media Library & Links tab for dead/errored provider magnets (`statusCode > 4`) and unlinked dead symlinks.

### Fixed
- **Smart Media Library Filtering & Exclusion of In-Progress or Non-Scanned Downloads**:
  - **In-Progress Download Exclusion**: Magnets with AllDebrid status `< 4` (0 = processing, 1 = downloading, 2 = compressing, 3 = uploading) or active local transfers are no longer displayed in the Media Library tab. They remain strictly in the Queue tab and are no longer mistakenly tagged as "Not Symlinked".
  - **Strict Adherence to Configured Media Library Scan Folders (`media_scan_paths`)**: Torrents associated with services/categories outside the media library (e.g. Whisparr, Torrent-Direct, direct download folders outside the scanned paths) are excluded from media library magnets and duplicates analysis.
  - **Accurate Statistics & Badges for "Not Symlinked" Items**: Only completed (`statusCode == 4`) and valid magnets missing from local media storage receive the "Not Symlinked" badge and count. Provider errors/expired items are cleanly isolated under "Dead API".
  - **Interactive Filter Cleanliness**: The "Not Symlinked" filter button now solely displays valid unlinked items, preventing dead/expired provider items from cluttering the view.

## [2.9.0] — 2026-11-22

### Added
- **Live Search Bar in Queue**:
  - Real-time text search input with quick clear button (`✕`) integrated directly into the queue controls bar.
  - Multi-attribute filtering (filename, category, hash, AllDebrid ID, save path).
  - Seamlessly integrates with status filters, sorting, and collapsible groups (only groups with matching items remain visible).
  - Retains input focus and state across background 2-second polling cycles without cursor interruptions.
- **Search Alternative Button for Items Under Cloud Debriding**:
  - Dedicated `🔍 Search` button in action column and inline magnifying glass icon next to the title for files currently undergoing cloud debriding or DDL.
  - Automatically switches to the Multi-Engine Finder tab, pre-fills the cleaned title, and triggers an immediate multi-engine search to find alternative releases or direct links in one click.
- **Mobile & Desktop Sort Dropdown Menu**:
  - Added dedicated `Sort:` select menu in the queue controls bar (Status & Speed, Speed fastest/slowest, Name A-Z / Z-A, ID newest/oldest, Category A-Z / Z-A).
  - Enables full sorting capability on mobile/touch screens where table column headers are hidden in favor of responsive cards.
  - Automatically and bidirectionally synchronized with desktop column header clicks and persisted in `localStorage`.
- **Interactive Click-to-Sort Table Headers (ID, Name, Category, Speed, Status)**:
  - Clickable column headers with active sort direction indicators (`▲` ascending / `▼` descending) and one-click toggle.
  - Multi-criteria sorting: by **Status** (combined with progress), by **Speed / Rate** (highest throughput first), by **Name** (alphabetical A-Z / Z-A), by **ID** (AllDebrid numeric / hash), and by **Service / Category**.
  - Persistent sorting preferences saved in `localStorage` across 2-second background polling cycles and page reloads.
  - Sorting seamlessly applied both inside individual collapsible accordion groups and in flat table view.
- **Real-Time Speed Metrics (Per-Debrid Item & Global Totals)**:
  - **Individual Debrid Speed Badge**: displays real-time speed badges directly beside the category tag (`☁️ X.X MB/s` for cloud debriding on AllDebrid, `📥 Y.Y MB/s` for local disk downloads).
  - **Cumulative Speed per Category & Group**: displays live aggregate speed inside each collapsible category header (`📁 Category: tv-whisparr [41] [⚡ 75.9 KB/s]`) and status group.
  - **Global Bandwidth Indicators**: dual real-time indicators in the toolbar tracking total AllDebrid cloud debrid bandwidth and total local download throughput.
  - **Live Speed Forwarding to *Arr Suite**: real-time download speeds are now reported via the qBittorrent API router to Radarr, Sonarr, and Whisparr.
- **Force Refresh Button (Arr / Debrid)**:
  - Added dedicated `🔄 Refresh (Arr / Debrid)` button in the queue toolbar.
  - Triggers immediate status queries to the Debrid provider for all active torrents without waiting for the background worker polling interval.
  - Automatically sends `RefreshMonitoredDownloads` commands to configured Radarr, Sonarr, and Whisparr instances for immediate completed-download import scans.
- **Full Whisparr Integration in Settings**:
  - Added dedicated Whisparr URL and API key fields in the settings *Arr integration section.

### Changed
- **Strict Separation Between "Downloading" and "Debriding in Progress"**:
  - Torrents still undergoing cloud debrid conversion or BitTorrent caching on provider servers (`is_debrided: false`) are strictly confined to the "Debriding" status and filter, regardless of their configured destination mode.
  - The "Downloading" filter now exclusively contains already-debrided items undergoing active local disk download or transfer.

### Fixed
- **TV Series Duplicate Detection (Season 01 vs Season 02)**:
  - **Priority Season & Episode Preservation**: fixed filename normalization (`normalize_filename`) which previously truncated release names prematurely at the first detected year token (e.g. *One Piece 2023 S01* and *One Piece 2023 S02* were both reduced to *One Piece 2023*, generating a false duplicate).
  - **Multi-Format Standardization**: added robust detection and canonicalization for television patterns (`S01`, `S1`, `Saison 1`, `Season 01`, `S01E02`, `S01-S03`), ensuring distinct seasons and episodes are never incorrectly grouped as duplicates.
- **Retrigger Dead Links in Radarr, Sonarr & Whisparr**:
  - **Fixed Click Unresponsiveness**: resolved JavaScript SyntaxErrors caused by unescaped single quotes/apostrophes in media filenames (e.g. *Guy Ritchie's*, *Marvel's*) by referencing items safely by index instead of inlined paths.
  - **Effective Dead File Deletion Before Search**: explicitly deleted dead file references via Radarr (`DELETE /api/v3/moviefile/{id}`) and Sonarr (`DELETE /api/v3/episodefile/{id}`) prior to sending `MoviesSearch` or `SeriesSearch`, ensuring *Arr registers the media as missing and immediately downloads a replacement.
  - **Whisparr Retrigger Support**: added full Whisparr support for single and bulk dead link retriggering.
  - **Immediate Cache Purge**: automatically removed retriggered dead links from memory and cache upon successful search trigger.
- **Label Typography and Colon Line-Wrapping (`Filter:`, `Group:`, `Sort:`)**:
  - Fixed unwanted colon line-breaks on narrow mobile screens using non-breaking spaces and strict CSS rules (`white-space: nowrap`, `flex-shrink: 0`).
- **Persistent Group Collapsing During Automatic Polling**:
  - Resolved an issue where collapsed accordion groups automatically re-expanded every 2 seconds during the background UI polling cycle.
  - Group collapse state is now strictly preserved in `localStorage` and maintained across re-renders.

---

## [2.8.0] — 2026-11-22

### Added
- **Queue Status Filters in Sleek Dropdown**:
  - Replaced bulky buttons with an elegant, compact dropdown filter menu (**All**, **Downloading**, **Debriding in progress**, **Failed & Errors**, **Completed**, and **Paused**) with real-time counter badges.
- **Collapsible & Expandable Groups (Accordions)**:
  - Foldable sections with animated chevrons and counter badges, grouping items by **Status / Type** (default), **Category**, or **Transfer Mode**.
  - Quick action buttons to **Expand All** and **Collapse All**.
  - One-click group selection button (`☑️`) to select or deselect all items within a specific group.
  - Persistent fold/unfold states across page reloads and polling cycles stored in `localStorage`.
  - Fully responsive mobile layout transforming groups and rows into clean touch-friendly cards.

### Fixed
- **State Dictionary In-Place Mutation on Startup**:
  - Fixed an issue where `torrents_db` was reassigned upon `load_state()`, breaking imported dictionary references in worker and router modules, causing downloads to disappear after container restart.
  - Successfully recovered and synchronized active cloud downloads with Whisparr and AllDebrid.

---

## [2.7.1] — 2026-11-22

### Fixed
- **Automatic Provider Cleanup for Blocklisted or Incomplete Torrents**:
  - Fixed an issue where Sonarr/Radarr's "Blocklist and search" action or deletion of incomplete/un-cached torrents left dead magnets active on the provider account (AllDebrid, RealDebrid, etc.).
  - `/api/v2/torrents/delete` now automatically distinguishes between completed & imported media (preserved to keep active rclone symlinks valid) and incomplete, stalled, errored, or un-imported torrents (immediately deleted on the provider to free up cloud download slots).

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
