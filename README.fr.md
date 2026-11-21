# DebridFlow 🌊

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-5A0FC8.svg?logo=pwa&logoColor=white)](https://developer.mozilla.org/fr/docs/Web/Progressive_web_apps)
[![Extension Chrome](https://img.shields.io/badge/Extension%20Chrome-Manifest%20V3-4285F4.svg?logo=googlechrome&logoColor=white)](extension/)
[![Coded with Gemini](https://img.shields.io/badge/Coded%20with-Google%20Gemini-8E75C2?logo=googlegemini&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Changelog](https://img.shields.io/badge/Changelog-v2.7.0-orange.svg)](CHANGELOG.fr.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

🌐 **Langue** : [English 🇬🇧](README.md) | **Français 🇫🇷** • 📋 [Journal des modifications](CHANGELOG.fr.md) • 🔒 [Politique de Confidentialité](PRIVACY.md)

> **DebridFlow** est un client de téléchargement et d'émulation qBittorrent WebAPI moderne, ultra-rapide et modulaire. Conçu pour connecter les applications de la suite \*arr (**Sonarr**, **Radarr**, **Whisparr**, **Lidarr**, **Prowlarr**) à vos services de débridage favoris, avec gestion automatique de médiathèque, recherche DDL intégrée et détection des liens orphelins.
>
> ✨ *Projet 100% conçu, architecturé et développé avec **Google Gemini**.*

https://github.com/user-attachments/assets/20a5bdf9-b7cb-40cd-9de1-2d2a5c2cdcc0

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
- [📱 Application Progressive Web App (PWA)](#-application-progressive-web-app-pwa)
- [🧩 Extension Navigateur & Userscript](#-extension-navigateur--userscript)
- [🔔 Notifications Telegram](#-notifications-telegram)
- [📐 Structure du Projet](#-structure-du-projet)
- [🤖 Conçu avec Google Gemini](#-conçu-avec-google-gemini)
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
* 📱 **Application Progressive Web App (PWA)** : Installable en application autonome sur Android, iOS, Windows, macOS et Linux avec affichage plein écran et cache App Shell hors-ligne.
* 🧩 **Extension Chrome & Userscript** : Ajout en 1 clic et au clic-droit natif vers DebridFlow pour les liens magnets, torrents et hébergeurs DDL.
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

## 📱 Application Progressive Web App (PWA)

DebridFlow propose une compatibilité complète Progressive Web App (PWA) :
* **Mode Autonome (Plein Écran)** : Fonctionne sans barre d'adresse ni boutons du navigateur sur Android, iOS, Windows, macOS et Linux.
* **Menu Natif « Partager » Android (Remplacement complet de MyJDownloader)** : DebridFlow s'enregistre dans la feuille de partage native d'Android. Depuis n'importe quelle application (Chrome, Reddit, Twitter, etc.), partagez un lien DDL (1fichier, Rapidgator...), un magnet ou un fichier `.torrent` en 1 seul appui !
* **Gestionnaire de Protocole Magnet** : Un simple appui sur un lien `magnet:` ouvre directement DebridFlow et ajoute le torrent.
* **Raccourcis d'Écran d'Accueil** : Appui long sur l'icône de l'application pour accéder aux actions rapides (*« Ajouter un téléchargement »*, *« Recherche DDL »*).
* **Mise en cache Service Worker** : Lancement instantané de l'interface avec stratégie de cache réseau prioritaire (Network-First).
* **Guide d'installation** :
  * **Android** : Ouvrez DebridFlow en HTTPS (ou `localhost`) dans Chrome, appuyez sur le menu `⋮` puis **« Installer l'application »** ou **« Ajouter à l'écran d'accueil »**.
  * **Ordinateur (Chrome / Edge / Brave)** : Cliquez sur l'icône **Installer** à droite de votre barre d'adresse.
  * **iOS (Safari)** : Appuyez sur le bouton **Partager**, puis sélectionnez **« Sur l'écran d'accueil »**.

---

## 🧩 Extension Navigateur & Userscript

Envoyez directement vos téléchargements vers votre serveur DebridFlow depuis n'importe quelle page web :

### 🌐 Extension Officielle Chrome / Brave / Edge (Manifest V3)
* **Menu contextuel natif au clic-droit** : Faites un clic droit sur n'importe quel lien ou texte sélectionné pour l'envoyer à DebridFlow (modes `Défaut`, `Symlink` ou `Téléchargement réel`).
* **Fenêtre de contrôle (Popup)** : Cliquez sur l'icône de l'extension pour vérifier la connexion en direct à votre serveur, changer la catégorie et lancer l'interface web.
* **Installation en 30 secondes** :
  1. Téléchargez l'extension au format ZIP depuis votre tableau de bord (*Paramètres > 4. Automatisation > Intégration Navigateur*) ou utilisez le dossier [extension/](extension/).
  2. Rendez-vous sur `chrome://extensions/`, activez le **Mode développeur**, et cliquez sur **« Charger l'extension non empaquetée »**.
  3. Indiquez l'URL de votre serveur DebridFlow dans le popup et cliquez sur **Enregistrer**.

### 🐒 Script Tampermonkey / Violentmonkey
* **Badges 1-clic** : Injecte un bouton discret `⚡` à côté des liens magnets sur les annuaires de torrents.
* **Raccourci `Alt + Clic gauche`** : Envoie instantanément n'importe quel lien en arrière-plan sans ouvrir de menu.
* **Installation en 1 clic** : Cliquez sur [debridflow.user.js](app/static/debridflow.user.js) pour l'installer directement dans Tampermonkey.

---

## 🔔 Notifications & Contrôleur Telegram Bidirectionnel

Configurez un bot Telegram dans **Paramètres > Notifications** pour piloter votre serveur à distance :
* **Réception et ajout automatique de téléchargements** : Envoyez ou partagez n'importe quel lien magnet, DDL ou fichier `.torrent` directement à votre bot Telegram depuis votre smartphone, où que vous soyez dans le monde (fonctionne en 4G/5G sans VPN ni ouverture de port). DebridFlow attrape le téléchargement et vous confirme l'ajout immédiatement en réponse !
* **Alertes automatiques** : Fin de téléchargement avec vitesse moyenne et taille, rapport d'analyse du scanner de médiathèque, détection de liens orphelins et alertes d'erreurs critiques d'API de débridage.

---

## 📐 Structure du Projet

```text
debridflow/
├── docker-compose.yml          # Déploiement conteneurisé Docker
├── install.sh                  # Script d'installation automatique Linux
├── start.sh                    # Script de lancement direct
├── requirements.txt            # Dépendances du projet (FastAPI, HTTPX, etc.)
├── PRIVACY.md                  # Politique de confidentialité pour extension & apps
├── extension/                  # Extension officielle Chrome / Chromium (Manifest V3)
│   ├── manifest.json
│   ├── background.js
│   ├── popup.html / popup.js
│   └── icons/
├── data/                       # Stockage persistant (état, caches, configuration)
└── app/
    ├── main.py                 # Application FastAPI, cycle de vie et routes PWA
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
    │   └── index.html          # Interface utilisateur web responsive & manifests PWA
    └── static/
        ├── manifest.json       # Manifeste PWA
        ├── sw.js               # Service Worker PWA
        ├── debridflow.user.js  # Script Tampermonkey
        ├── icons/              # Icônes PWA haute définition (192px, 512px, adaptatives)
        ├── css/style.css       # Thèmes clair/sombre et styles adaptatifs
        └── js/                 # Architecture frontend modulaire
            ├── app.js          # Cycle de vie et point d'entrée
            ├── i18n.js         # Dictionnaires multilingues (FR/EN) et thèmes
            ├── queue.js        # File d'attente et actions par lot
            ├── settings.js     # Paramètres et diagnostics API
            ├── onboarding.js   # Assistant interactif de bienvenue
            ├── scanner.js      # Scanner de médiathèque et gestionnaire magnets
            ├── finder.js       # Recherche multi-sources et injection
            └── speedtest.js    # Mesures de latence et débits réels
```

---

## 🤖 Conçu avec Google Gemini

DebridFlow a été **100% conçu, architecturé et développé avec Google Gemini**. De l'architecture système initiale, du backend modulaire FastAPI, des adaptateurs de débridage multi-fournisseurs, des algorithmes de cache incrémental en mémoire vive, jusqu'à l'interface utilisateur web responsive, l'intégralité du projet a été créée grâce au développement assisté par IA.

---

## 🙏 Remerciements & Inspirations

* **[rdt-client](https://github.com/rogerfar/rdt-client)** — Inspiration pour l'émulation de l'API Web qBittorrent reliant les débrideurs à la suite \*arr.
* **[JDownloader](https://jdownloader.org/)** — Inspiration pour la gestion des téléchargements directs (DDL) et la récupération de liens.

---
## ⚖️ Avertissement Légal & Licence

**DebridFlow** est un outil logiciel indépendant développé à des fins de gestion technique et d'automatisation de flux multimédia personnels. Les auteurs ne cautionnent ni n'encouragent le téléchargement de contenus non autorisés. Vous êtes responsable du respect des lois en vigueur dans votre juridiction.

Ce projet est distribué sous licence [MIT](LICENSE).
