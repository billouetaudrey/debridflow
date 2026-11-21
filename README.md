# DebridFlow 🌊

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)
[![Coded with Gemini](https://img.shields.io/badge/Coded%20with-Google%20Gemini-8E75C2?logo=googlegemini&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

🌐 **Language**: **English 🇬🇧** | [Français 🇫🇷](README.fr.md)

> **DebridFlow** is a modern, lightweight, and high-performance qBittorrent WebAPI emulation client and media manager. Designed to connect your \*arr media suite (**Sonarr**, **Radarr**, **Whisparr**, **Lidarr**, **Prowlarr**) to your favorite debrid providers, featuring instant zero-space symlinking, real downloads, built-in DDL direct downloads, an ultra-fast media library scanner with broken link recovery, and multi-engine searching.
>
> ✨ *This project was 100% architected and developed with **Google Gemini**.*
>

https://github.com/user-attachments/assets/4fd94d19-1ca0-4d84-9bb5-a221abcba0c0

## 📑 Table of Contents

- [🌟 Key Features](#-key-features)
- [🏗️ How It Works](#️-how-it-works)
- [🚀 Quick Start & Installation](#-quick-start--installation)
  - [1. Docker & Docker Compose (Recommended)](#1-docker--docker-compose-recommended)
  - [2. Linux Bare-Metal](#2-linux-bare-metal)
  - [3. Windows](#3-windows)
  - [4. macOS](#4-macos)
- [⚙️ Sonarr / Radarr / Whisparr Setup](#️-sonarr--radarr--whisparr-setup)
- [🔍 Media Library & Dead Links Scanner](#-media-library--dead-links-scanner)
- [📥 Direct Download (DDL) Manager](#-direct-download-ddl-manager)
- [🔎 Multi-Engine DDL Finder](#-multi-engine-ddl-finder)
- [📊 Built-in Speedtest Suite](#-built-in-speedtest-suite)
- [🔔 Telegram Notifications](#-telegram-notifications)
- [📐 Project Architecture](#-project-architecture)
- [🤖 Built with Google Gemini](#-built-with-google-gemini)
- [⚖️ Legal Disclaimer & License](#️-legal-disclaimer--license)

---

## 🌟 Key Features

* 🌐 **Multi-Debrid Provider Support**: Native integration with **AllDebrid**, **Real-Debrid**, **Premiumize.me**, **Debrid-Link**, **TorBox**, and **High-Way.me**.
* ⚡ **Dual Processing Modes (Per Category)**:
  * **Instant Symlinks**: Create zero-storage symbolic links pointing directly to your rclone cloud mount (stream instantly without duplicating disk space).
  * **Physical Downloads**: Stream files directly to local storage with resume capability, integrity checks, and configurable bandwidth rate-limiting.
* 🎯 **qBittorrent WebAPI v2 Emulation**: Drop-in replacement for standard torrent clients. Works seamlessly with Sonarr, Radarr, Whisparr, and Prowlarr (categories, speeds, progress, pause/resume, deletion).
* 📥 **DDL Direct Download Manager**: Unlock and download files from major web hosters (1fichier, Rapidgator, Turbobit, Uptobox, etc.) directly into custom local target folders.
* 🔍 **Smart Media Library & Broken Link Scanner**:
  * **High-Speed Incremental Cache**: Tracks file modification times (`mtime`) and cloud targets in memory, completing scans in **1 to 2 seconds**.
  * **Dead Link Detection**: Flags broken symlinks or files that have expired/been purged from cloud storage.
  * **Auto-Repair via \*arr APIs**: Automatically triggers new searches in Radarr / Sonarr (`movies/search`, `episodes/search`) to seamlessly replace broken media.
  * **Cloud Magnet Clean-Up**: Identify duplicates and orphaned torrents stored in your debrid account with one-click cleanup.
* 🔎 **Multi-Engine Search (Finder)**: Search across DuckDuckGo, Brave, Google, Bing, Yandex, and Mojeek with one-click injection into your debrid queue.
* 📊 **Server Speedtest & Diagnostics**: Measure server latency to debrid datacenters and test real upload/download bandwidth (Mbps & MB/s).
* 🔔 **Instant Telegram Alerts**: Real-time notifications for completed downloads, average transfer speeds, scan reports, and API errors.
* 🎨 **Modern Responsive Web UI**: Mobile, tablet, and desktop friendly, Dark and Light themes, bilingual (English/French), and customizable tab visibility.

---

## 🏗️ How It Works

DebridFlow bridges your automation stack and debrid providers:

```text
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ Sonarr / Radarr ├──────►│   DebridFlow    ├──────►│ Debrid Provider │
│   (qB API v2)   │       │   (Port 6505)   │       │   (Cloud API)   │
└─────────────────┘       └────────┬────────┘       └────────┬────────┘
                                   │                         │
                 ┌─────────────────┴─────────────────┐       │
                 ▼                                   ▼       ▼
       [ Symlink Mode ]                    [ Download Mode ]
   Points to /mnt/rclone                Physical local disk copy
   (Zero storage footprint)             (Ideal for Whisparr & cold storage)
```

---

## 🚀 Quick Start & Installation

### 1. Docker & Docker Compose (Recommended)

Create a `docker-compose.yml` file:

```yaml
services:
  debridflow:
    image: python:3.12-slim
    container_name: debridflow
    network_mode: host
    working_dir: /app
    command: >
      sh -c "pip install --no-cache-dir --root-user-action=ignore -r requirements.txt &&
             uvicorn app.main:app --host 0.0.0.0 --port 6505"
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Europe/Paris
      - DEBRID_PROVIDER=alldebrid
      - RCLONE_MOUNT_DIR=/mnt/alldebrid/magnets
      - DOWNLOAD_BASE_DIR=/mnt/virtual/Medias/DL
      - MEDIA_SCAN_PATHS=/mnt/virtual/Medias/Movies,/mnt/virtual/Medias/TV
      - POLL_INTERVAL=3.0
    volumes:
      - ./app:/app/app:ro
      - ./app.py:/app/app.py:ro
      - ./requirements.txt:/app/requirements.txt:ro
      - ./data:/data
      - /mnt/virtual/Medias:/mnt/virtual/Medias
      - /mnt/alldebrid:/mnt/alldebrid:rshared
    restart: unless-stopped
```

Start the container:
```bash
docker compose up -d
```
Open your browser at `http://<YOUR_SERVER_IP>:6505`.

---

### 2. Linux Bare-Metal

Compatible with Debian, Ubuntu, Raspberry Pi OS, Fedora, Arch Linux, and Alpine:

1. Clone the repository:
   ```bash
   git clone https://github.com/billouetaudrey/debridflow.git
   cd debridflow
   ```
2. Run the automated installer:
   ```bash
   bash install.sh
   ```
3. Manage the systemd service (if enabled during install):
   ```bash
   sudo systemctl status debridflow    # Status
   sudo journalctl -u debridflow -f    # Live logs
   sudo systemctl restart debridflow   # Restart
   sudo systemctl stop debridflow      # Stop
   ```

---

### 3. Windows

1. Install **Python 3.10+** (ensure *"Add python.exe to PATH"* is checked).
2. Open PowerShell or Command Prompt:
   ```powershell
   git clone https://github.com/billouetaudrey/debridflow.git
   cd debridflow
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn app.main:app --host 0.0.0.0 --port 6505
   ```

---

### 4. macOS

```bash
git clone https://github.com/billouetaudrey/debridflow.git
cd debridflow
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 6505
```

---

## ⚙️ Sonarr / Radarr / Whisparr Setup

### 1. Download Client Configuration

In **Sonarr / Radarr**, go to **Settings** > **Download Clients** > **+** > **qBittorrent**:

| Option | Recommended Value |
| :--- | :--- |
| **Name** | `DebridFlow` |
| **Host** | `localhost` or your DebridFlow server IP |
| **Port** | `6505` |
| **Username** | *(Leave empty unless configured under Security)* |
| **Password** | *(Leave empty unless configured under Security)* |
| **Category** | `radarr` (for Radarr) / `tv-sonarr` (for Sonarr) / `whisparr` |

> [!TIP]
> In DebridFlow (**Settings > \*arr Services**), you can toggle whether each category uses **Symlink** (instant zero-disk) or **Real Download** (physical disk copy).

### 2. Automatic Scanner Webhook

Trigger an automatic scan whenever media is imported:
1. In **Sonarr** or **Radarr**, go to **Settings** > **Connect** > **+** > **Webhook**.
2. Fill in:
   * **Name**: `DebridFlow Scanner`
   * **Notification Triggers**: Check **On Download** / **On Import** (and **On Upgrade**).
   * **URL**: `http://127.0.0.1:6505/api/scanner/webhook`
   * **Method**: `POST`
3. Built-in cooldown & coalescing automatically bundles bulk imports (e.g. whole TV seasons) into a single optimized scan.

---

## 🔍 Media Library & Dead Links Scanner

Available under the **Media & Links** tab:
* **Dead Link Detection**: Identifies broken symlinks whose underlying cloud media was deleted.
* **Auto-Repair via \*arr APIs**: Instructs Sonarr or Radarr to automatically search for and download a working alternative, then purges the orphaned link.
* **Cloud Magnet Manager**: Inspect all active debrid cloud items, detect duplicates, and delete obsolete torrents directly from the dashboard.

---

## 📥 Direct Download (DDL) Manager

Unlock premium hoster links (1fichier, Rapidgator, Turbobit, etc.) directly:
* Paste one or multiple links into the **Direct Download** tab.
* Choose a custom target folder (e.g. `/mnt/storage/downloads`).
* Monitor download speed, progress, and automatic completion alerts.

---

## 🔎 Multi-Engine DDL Finder

Search for files across multiple privacy-respecting search engines (DuckDuckGo, Brave, Google, Bing, Yandex, Mojeek) and trigger downloads with a single click.

---

## 📊 Built-in Speedtest Suite

Test network connectivity and throughput directly from your host server:
* Ping tests to AllDebrid and global infrastructure.
* Real-time download & upload bandwidth benchmarks (Mbps and MB/s).
* Direct shortcuts to official speedtest providers.

---

## 🔔 Telegram Notifications

Configure automated alerts under **Settings > Notifications**:
* Completed downloads with average speed and file size.
* Scan summary reports.
* Immediate notifications when broken links are detected.
* Debrid provider API warnings or quota limits.

---

## 📐 Project Architecture

```text
debridflow/
├── docker-compose.yml          # Containerized deployment
├── install.sh                  # Automated Linux installation script
├── start.sh                    # Simple launcher script
├── requirements.txt            # Python dependencies (FastAPI, HTTPX, etc.)
├── data/                       # Persistent database (state, cache, settings)
└── app/
    ├── main.py                 # FastAPI application & lifespan events
    ├── config.py               # Configuration defaults & logging
    ├── state.py                # State persistence & locking
    ├── storage.py              # Rclone mount handling & symlink management
    ├── scanner.py              # Media library indexing & *arr auto-repair
    ├── worker.py               # Async background download worker
    ├── notifications.py        # Telegram notification engine
    ├── bencode.py              # Bencode decoder & magnet parser
    ├── providers/              # Debrid provider adapters (AllDebrid, Real-Debrid...)
    ├── routers/
    │   ├── qbittorrent.py      # qBittorrent WebAPI v2 endpoints
    │   ├── scanner.py          # Scanner endpoints & webhooks
    │   ├── speedtest.py        # Network & speedtest endpoints
    │   └── web.py              # Web dashboard & settings API
    ├── templates/
    │   └── index.html          # Responsive single-page interface
    └── static/
        ├── css/style.css       # Clean responsive UI styles & themes
        └── js/app.js           # Frontend logic, i18n & real-time updates
```

---

## 🤖 Built with Google Gemini

DebridFlow was **100% conceived, architected, and coded with Google Gemini**. From initial system design, modular FastAPI backend, multi-provider Debrid adapters, incremental in-memory caching algorithms, to responsive front-end engineering, every component was created with AI-driven development.

---

## 🙏 Acknowledgments & Inspirations

* **[rdt-client](https://github.com/rogerfar/rdt-client)** — Inspiration for the qBittorrent WebAPI emulation workflow bridging debrid providers with the \*arr stack.
* **[JDownloader](https://jdownloader.org/)** — Inspiration for the DDL direct-download management and link-grabbing approach.

---

## ⚖️ Legal Disclaimer & License

**DebridFlow** is an open-source tool created for educational and personal media organization purposes. The authors do not endorse or encourage the downloading of unauthorized or copyrighted content. Users are responsible for complying with all applicable laws in their jurisdiction.

Distributed under the [MIT License](LICENSE).
