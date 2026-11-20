# DebridFlow 🌊

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **DebridFlow** est un client de téléchargement et d'émulation qBittorrent WebAPI moderne, ultra-rapide et modulaire. Conçu pour connecter les applications de la suite \*arr (**Sonarr**, **Radarr**, **Whisparr**, **Lidarr**, **Prowlarr**) à vos services de débridage favoris, avec gestion automatique de médiathèque, recherche DDL intégrée et détection des liens orphelins.

---

## 📑 Sommaire

- [🌟 Fonctionnalités](#-fonctionnalités)
- [🏗️ Modes de Fonctionnement](#️-modes-de-fonctionnement)
- [🚀 Installation & Déploiement](#-installation--déploiement)
  - [1. Docker & Docker Compose (Recommandé)](#1-docker--docker-compose-recommandé)
  - [2. Linux Bare-Metal](#2-linux-bare-metal)
  - [3. Windows](#3-windows)
  - [4. macOS](#4-macos)
- [⚙️ Configuration avec Sonarr / Radarr / Whisparr](#️-configuration-avec-sonarr--radarr--whisparr)
- [🔍 Scanner de Médiathèque & Liens Morts](#-scanner-de-médiathèque--liens-morts)
- [🔎 Finder Multi-Moteurs DDL](#-finder-multi-moteurs-ddl)
- [📊 Speedtest Réseau & Datacenters](#-speedtest-réseau--datacenters)
- [🔔 Notifications Telegram](#-notifications-telegram)
- [📐 Structure du Projet](#-structure-du-projet)
- [⚖️ Avertissement Légal & Licence](#️-avertissement-légal--licence)

---

## 🌟 Fonctionnalités

* 🌐 **Multi-Fournisseurs Debrid** : Support direct de **AllDebrid**, **Real-Debrid**, **Premiumize.me**, **Debrid-Link**, **TorBox** et **High-Way.me**.
* ⚡ **Deux modes de récupération par catégorie** :
  * **Mode Symlink** : Création instantanée de liens symboliques pointant vers le montage rclone cloud (zéro espace disque physique consommé).
  * **Mode Téléchargement réel** : Téléchargement physique des fichiers en streaming direct avec reprise, vérification d'intégrité et limitation de débit configurable.
* 🎯 **Émulation qBittorrent WebAPI v2** : Compatible clé en main avec Sonarr, Radarr, Whisparr et Prowlarr (catégories, gestion des priorités, vitesses, progression, pause/reprise, suppression).
* 📥 **Gestionnaire Direct Download (DDL)** : Débridage et téléchargement immédiat de liens d'hébergeurs (1fichier, Rapidgator, Turbobit, Uptobox, etc.) avec choix du dossier de destination.
* 🔍 **Scanner de Médiathèque & Liens Morts** :
  * Cache incrémental indexé sur la date de modification (`mtime`) : scan de milliers de fichiers en **1 à 2 secondes**.
  * Détection en temps réel des symlinks cassés ou retirés du cloud fournisseur.
  * Relance automatique de recherche auprès de Radarr / Sonarr pour remplacer les fichiers manquants.
  * Nettoyage sélectif ou en masse des orphelins et magnets cloud obsolètes.
* 🔎 **Moteur de Recherche Multi-Sources** : Recherche intégrée sur DuckDuckGo, Brave, Google, Bing, Yandex et Mojeek avec injection directe en file de débridage en 1 clic.
* 📊 **Test de Débit & Latence Intégré** : Mesure de ping vers l'infrastructure Debrid et serveurs mondiaux, avec calcul de débit montant/descendant (Mbps et Mo/s).
* 🔔 **Système de Notifications Telegram** : Alertes modulaires (téléchargements terminés, vitesse moyenne, liens orphelins détectés, erreurs serveur).
* 🎨 **Interface Web Moderne** : Responsive pour mobile, tablette et desktop, modes Sombre et Clair, multilingue Français 🇫🇷 / Anglais 🇬🇧, et onglets personnalisables.

---

## 🏗️ Modes de Fonctionnement

DebridFlow offre une flexibilité totale pour gérer vos flux multimédia :

```text
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ Sonarr / Radarr ├──────►│   DebridFlow    ├──────►│ Debrid Provider │
│   (qB API v2)   │       │   (Port 6505)   │       │   (Cloud API)   │
└─────────────────┘       └────────┬────────┘       └────────┬────────┘
                                   │                         │
                 ┌─────────────────┴─────────────────┐       │
                 ▼                                   ▼       ▼
       [ Mode Symlink ]                    [ Mode Téléchargement ]
   Pointe vers /mnt/rclone              Copie physique sur disque local
   (Lecture directe sans espace)        (Idéal Whisparr & stockage local)
```

---

## 🚀 Installation & Déploiement

### 1. Docker & Docker Compose (Recommandé)

Créez un fichier `docker-compose.yml` :

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
      - MEDIA_SCAN_PATHS=/mnt/virtual/Medias/Films,/mnt/virtual/Medias/Series
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

Démarrez le service :
```bash
docker compose up -d
```
L'interface est accessible sur `http://<IP_DU_SERVEUR>:6505`.

---

### 2. Linux Bare-Metal

Compatible avec Debian, Ubuntu, Raspberry Pi OS, Fedora, Arch Linux et Alpine :

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/billouetaudrey/debridflow.git
   cd debridflow
   ```
2. Exécutez le script d'installation :
   ```bash
   bash install.sh
   ```
3. Commandes de gestion du service systemd :
   ```bash
   sudo systemctl status debridflow    # Statut
   sudo journalctl -u debridflow -f    # Journaux en direct
   sudo systemctl restart debridflow   # Redémarrer
   sudo systemctl stop debridflow      # Arrêter
   ```

---

### 3. Windows

1. Installez **Python 3.10+** (en cochant *"Add python.exe to PATH"*).
2. Ouvrez PowerShell ou l'invite de commandes :
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

## ⚙️ Configuration avec Sonarr / Radarr / Whisparr

### 1. Ajout du Client de Téléchargement

Dans **Sonarr / Radarr**, naviguez vers **Settings** > **Download Clients** > **+** > **qBittorrent** :

| Champ | Paramètre recommandé |
| :--- | :--- |
| **Nom** | `DebridFlow` |
| **Hôte** | `localhost` ou adresse IP de votre machine DebridFlow |
| **Port** | `6505` |
| **Nom d'utilisateur** | *(Laisser vide sauf si configuré dans Sécurité)* |
| **Mot de passe** | *(Laisser vide sauf si configuré dans Sécurité)* |
| **Catégorie** | `radarr` (pour Radarr) / `tv-sonarr` (pour Sonarr) / `whisparr` |

> [!TIP]
> Dans DebridFlow (**Paramètres > Services \*arr**), configurez pour chaque catégorie si les fichiers doivent être créés en **Symlink** (instantané) ou en **Téléchargement réel**.

### 2. Automatisation du Scanner via Webhook

Pour analyser automatiquement vos liens après chaque import :
1. Dans **Sonarr** ou **Radarr**, allez dans **Settings** > **Connect** > **+** > **Webhook**.
2. Paramètres :
   * **Name** : `DebridFlow Scanner`
   * **Notification Triggers** : Cochez **On Download** / **On Import** (et **On Upgrade**).
   * **URL** : `http://127.0.0.1:6505/api/scanner/webhook`
   * **Method** : `POST`
3. DebridFlow utilise un mécanisme de coalescing : les requêtes rapprochées sont regroupées pour éviter les scans redondants.

---

## 🔍 Scanner de Médiathèque & Liens Morts

L'onglet **Médiathèque & Liens** analyse récursivement vos bibliothèques multimédia :
* **Détection instantanée** : Repérage des liens symboliques orphelins dont la source cloud a été supprimée.
* **Auto-Repair Radarr / Sonarr** : Envoi direct d'une commande de recherche à l'API de votre gestionnaire pour télécharger automatiquement une version de remplacement.
* **Gestion des Magnets Cloud** : Inspection de tous les torrents stockés chez votre fournisseur Debrid avec détection des doublons et suppression ciblée.

---

## 🔎 Finder Multi-Moteurs DDL

Le module de recherche intégré permet de trouver des fichiers multimédia sur plusieurs moteurs indépendants (DuckDuckGo, Brave, Google, Bing, Yandex, Mojeek) et de lancer le débridage immédiatement sans quitter DebridFlow.

---

## 📊 Speedtest Réseau & Datacenters

Mesurez les performances de votre connexion directement depuis le serveur hôte :
* Ping AllDebrid et latence globale.
* Vitesse de débit descendant (Download) et montant (Upload) affichée en Mbps et Mo/s.
* Raccourcis directs vers les plateformes de diagnostic officielles.

---

## 🔔 Notifications Telegram

Configurez un bot Telegram dans **Paramètres > Notifications** pour être alerté en direct :
* Fin de téléchargement avec vitesse moyenne et taille.
* Rapport d'analyse du scanner de médiathèque.
* Détection de liens morts nécessitant votre attention.
* Alertes d'erreurs critiques d'API de débridage.

---

## 📐 Structure du Projet

```text
debridflow/
├── docker-compose.yml          # Déploiement conteneurisé Docker
├── install.sh                  # Script d'installation automatique Linux
├── start.sh                    # Script de lancement direct
├── requirements.txt            # Dépendances du projet (FastAPI, HTTPX, etc.)
├── data/                       # Stockage persistant (état, caches, configuration)
└── app/
    ├── main.py                 # Application FastAPI et cycle de vie
    ├── config.py               # Paramètres globaux et journalisation
    ├── state.py                # Persistance de l'état JSON et verrous
    ├── storage.py              # Gestion des montages rclone et symlinks
    ├── scanner.py              # Moteur de scan, détection et liaison *arr
    ├── worker.py               # Traitement asynchrone des téléchargements
    ├── notifications.py        # Module de notifications Telegram
    ├── bencode.py              # Décodeur Bencode et parseur torrent/magnet
    ├── providers/              # Connecteurs API Debrid (AllDebrid, Real-Debrid...)
    ├── routers/
    │   ├── qbittorrent.py      # Endpoints WebAPI v2 qBittorrent
    │   ├── scanner.py          # Endpoints du scanner et webhooks
    │   ├── speedtest.py        # Endpoints du test de vitesse
    │   └── web.py              # Tableau de bord et endpoints de configuration
    ├── templates/
    │   └── index.html          # Interface utilisateur web responsive
    └── static/
        ├── css/style.css       # Thèmes clair/sombre et styles adaptatifs
        └── js/app.js           # Moteur frontend, traductions et requêtes temps réel
```

---

## ⚖️ Avertissement Légal & Licence

**DebridFlow** est un outil logiciel indépendant développé à des fins de gestion technique et d'automatisation de flux multimédia personnels. Les auteurs ne cautionnent ni n'encouragent le téléchargement de contenus non autorisés. Vous êtes responsable du respect des lois en vigueur dans votre juridiction.

Ce projet est distribué sous licence [MIT](LICENSE).
