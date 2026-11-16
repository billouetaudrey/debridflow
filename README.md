# PyRDT — Multi-Debrid Symlink & Download Client

> **PyRDT** est un client de téléchargement et d'émulation qBittorrent léger, rapide et modulaire conçu pour connecter vos applications de la suite \*arr (**Sonarr**, **Radarr**, **Whisparr**, **Prowlarr**, etc.) à vos fournisseurs de débridage favoris.

---

## 🌟 Fonctionnalités Principales

* 🌐 **Multi-Fournisseurs Debrid** : Support complet de **AllDebrid**, **Real-Debrid**, **Premiumize.me**, **Debrid-Link**, **TorBox** et **High-Way.me**.
* ⚡ **Deux modes de récupération par service** :
  * **Symlink (instantané)** : Crée des liens symboliques pointant vers le dossier monté par rclone (idéal pour la lecture directe sans duplication de stockage).
  * **Téléchargement réel (copie locale)** : Copie physique des fichiers depuis le cloud vers vos disques locaux (recommandé pour Whisparr ou le stockage permanent).
* 🎯 **Émulation API qBittorrent v2** : Vos applications \*arr pensent communiquer avec un client qBittorrent standard (catégories, vitesses, progression, fichiers, pause/reprise, suppression).
* 🎨 **Interface Web Moderne** :
  * Navigation multi-pages pour les paramètres.
  * Thème sombre (**Dark Mode**) et thème clair (**Light Mode**).
  * Multilingue (**Français 🇫🇷 / Anglais 🇬🇧**) avec bascule instantanée.
  * Suivi de la file d'attente en temps réel avec barre de progression.
* 🧹 **Automatisation & Nettoyage** :
  * Purge automatique des fichiers/symlinks locaux dès que Sonarr/Radarr a finalisé l'importation.
  * Suppression automatique des torrents/magnets sur le cloud du fournisseur après téléchargement.

---

## 🚀 Installation

### 1. Docker & Docker Compose *(Recommandé)*

Idéal pour Linux, serveurs NAS (Synology, QNAP, Unraid) ou Docker Desktop.

1. Clonez ou téléchargez le dossier du projet :
   ```bash
   git clone https://github.com/billouetaudrey/pyrdt.git
   cd pyrdt
   ```
2. Vérifiez le fichier `docker-compose.yml` (ajustez les chemins vers vos disques et vos montages rclone) :
   ```yaml
   services:
     pyrdt:
       image: python:3.12-slim
       container_name: pyrdt
       network_mode: host
       working_dir: /app
       command: >
         sh -c "pip install --no-cache-dir --root-user-action=ignore -r requirements.txt &&
                uvicorn app.main:app --host 0.0.0.0 --port 6505"
       environment:
         - PUID=1000
         - PGID=1000
         - TZ=Europe/Paris
         - RCLONE_MOUNT_DIR=/mnt/alldebrid/magnets
         - DOWNLOAD_BASE_DIR=/mnt/virtual/Medias/DL
         - POLL_INTERVAL=3.0
       volumes:
         - ./app.py:/app/app.py:ro
         - ./app:/app/app:ro
         - ./requirements.txt:/app/requirements.txt:ro
         - ./data:/data
         - /mnt/virtual/Medias:/mnt/virtual/Medias
         - /mnt/alldebrid:/mnt/alldebrid:rshared
       restart: unless-stopped
   ```
3. Lancez le conteneur en arrière-plan :
   ```bash
   docker compose up -d
   ```
4. Accédez au tableau de bord sur `http://localhost:6505` ou `http://<IP_SERVEUR>:6505`.

---

### 2. Linux (Bare-Metal / Sans Docker)

Compatible Debian, Ubuntu, Raspberry Pi OS, Fedora, Arch Linux, Alpine.

1. Lancez le script d'installation automatique :
   ```bash
   bash install.sh
   ```
   *Ce script vérifie et installe Python 3.10+, configure un environnement virtuel `venv`, installe les dépendances et propose d'activer un service `systemd`.*
2. **Gestion du service (si activé lors de l'installation)** :
   ```bash
   sudo systemctl status pyrdt    # Vérifier l'état
   sudo journalctl -u pyrdt -f    # Voir les logs en direct
   sudo systemctl restart pyrdt   # Redémarrer
   sudo systemctl stop pyrdt      # Arrêter
   ```
3. **Lancement manuel (sans service systemd)** :
   ```bash
   ./start.sh
   ```

---

### 3. Windows

1. **Prérequis** :
   * Installez **Python 3.10 ou supérieur** depuis [python.org](https://www.python.org/downloads/) (veillez à cocher la case *"Add python.exe to PATH"* lors de l'installation).
2. **Installation** (dans une invite de commande PowerShell ou CMD) :
   ```powershell
   cd C:\chemin\vers\pyrdt
   python -m venv venv
   .\venv\Scripts\activate
   pip install --upgrade pip
   pip install -r requirements.txt
   ```
3. **Démarrage** :
   ```powershell
   .\venv\Scripts\activate
   uvicorn app.main:app --host 0.0.0.0 --port 6505
   ```
   *(Vous pouvez créer un raccourci ou un fichier `start.bat` contenant ces commandes pour lancer PyRDT d'un double-clic).*

---

### 4. macOS

1. **Prérequis** :
   * Installez Python 3 via [Homebrew](https://brew.sh) si nécessaire :
     ```bash
     brew install python
     ```
2. **Installation** :
   ```bash
   cd /chemin/vers/pyrdt
   python3 -m venv venv
   source venv/bin/activate
   pip install --upgrade pip
   pip install -r requirements.txt
   ```
3. **Démarrage** :
   ```bash
   source venv/bin/activate
   uvicorn app.main:app --host 0.0.0.0 --port 6505
   ```

---

## ⚙️ Configuration de Sonarr / Radarr / Whisparr

Dans vos applications \*arr, rendez-vous dans **Settings** > **Download Clients** et ajoutez un client :

| Paramètre | Valeur |
| :--- | :--- |
| **Type de client** | **qBittorrent** |
| **Nom** | `PyRDT` |
| **Hôte (Host)** | `localhost` ou l'adresse IP de la machine faisant tourner PyRDT |
| **Port** | `6505` |
| **Nom d'utilisateur** | *(Laisser vide sauf si configuré dans Sécurité)* |
| **Mot de passe** | *(Laisser vide sauf si configuré dans Sécurité)* |
| **Catégorie** | `tv-sonarr` (pour Sonarr) / `radarr` (pour Radarr) / `whisparr` (pour Whisparr) |

> [!TIP]
> Dans PyRDT, rendez-vous dans l'onglet **Paramètres** > **3. Services (*arr)** pour définir pour chaque catégorie si elle doit utiliser le mode **Symlink** ou **Téléchargement réel**.

---

## 📁 Architecture du Code

```text
pyrdt/
├── app.py                      # Point d'entrée rétrocompatible
├── docker-compose.yml          # Déploiement conteneurisé
├── install.sh                  # Installeur automatique Linux (bare-metal)
├── start.sh                    # Script de démarrage direct
├── requirements.txt            # Dépendances Python (FastAPI, Uvicorn, HTTPX)
├── data/                       # Stockage persistant de l'état (state.json)
└── app/
    ├── main.py                 # Initialisation FastAPI, middlewares, lifespan
    ├── config.py               # Paramètres par défaut, logging
    ├── state.py                # Gestion du fichier JSON d'état et verrous
    ├── storage.py              # Détection rclone, création symlinks/copies, auto-clean
    ├── worker.py               # Tâche de fond asynchrone pour le suivi des téléchargements
    ├── bencode.py              # Décodeur Bencode (.torrent) et parseur de magnets
    ├── providers/              # Connecteurs d'API de débridage (Adapter Pattern)
    │   ├── base.py             # Interface commune BaseDebridProvider
    │   ├── alldebrid.py        # AllDebrid
    │   ├── realdebrid.py       # Real-Debrid
    │   ├── premiumize.py       # Premiumize.me
    │   ├── debridlink.py       # Debrid-Link
    │   ├── torbox.py           # TorBox
    │   └── highway.py          # High-Way.me
    ├── routers/
    │   ├── qbittorrent.py      # Endpoints compatibles qBittorrent WebAPI v2
    │   └── web.py              # Endpoints du tableau de bord Web et des paramètres
    ├── templates/
    │   └── index.html          # Interface utilisateur HTML5
    └── static/
        ├── css/style.css       # Thèmes sombre & clair (CSS variables)
        └── js/app.js           # Moteur i18n et rafraîchissement temps réel
```

---

## 📄 Licence

Ce projet est sous licence MIT — vous êtes libre de l'utiliser, le modifier et le distribuer.
