# PyRDT — Multi-Debrid Symlink & Download Client

> **PyRDT** est un client de téléchargement et d'émulation qBittorrent léger, rapide et modulaire conçu pour connecter vos applications de la suite \*arr (**Sonarr**, **Radarr**, **Whisparr**, **Prowlarr**, etc.) à vos fournisseurs de débridage favoris, avec gestion intelligente de médiathèque et détection des liens morts.

---

## 🌟 Fonctionnalités Principales

* 🌐 **Multi-Fournisseurs Debrid** : Support complet de **AllDebrid**, **Real-Debrid**, **Premiumize.me**, **Debrid-Link**, **TorBox** et **High-Way.me**.
* ⚡ **Deux modes de récupération par service** :
  * **Symlink (instantané)** : Crée des liens symboliques pointant vers le dossier monté par rclone (lecture directe sans duplication de stockage).
  * **Téléchargement réel (copie locale)** : Copie physique des fichiers depuis le cloud vers vos disques locaux (recommandé pour Whisparr ou le stockage permanent).
* 🎯 **Émulation API qBittorrent v2** : Vos applications \*arr communiquent avec PyRDT comme avec un client qBittorrent standard (catégories, vitesses, progression, statut, pause/reprise, suppression).
* 🔍 **Scanner de Médiathèque & Liens Debrid ("Médiathèque & Liens")** :
  * **Détection des liens morts** : Analyse récursive de vos dossiers de médiathèque pour repérer les symlinks cassés ou dont la source n'existe plus sur le cloud Debrid.
  * **Relance automatique Radarr / Sonarr** : Déclenchement automatique ou manuel d'une nouvelle recherche (`movies/search`, `episodes/search`) auprès de vos instances pour remplacer instantanément les fichiers manquants.
  * **Nettoyage & Suppression synchronisée** : Suppression locale en un clic des symlinks orphelins avec possibilité de supprimer également le film/la série ou le fichier associé directement dans Radarr / Sonarr.
  * **Gestionnaire de magnets** : Visualisation de tous les torrents cloud, identification des doublons et des magnets non associés à des fichiers locaux avec suppression sélective.
  * **Contrôle & Progression en direct** : Barre de progression animée avec pourcentage, étapes détaillées et **possibilité d'interrompre le scan en cours à tout moment**.
  * **Sécurité anti-flood & Coalescing** : Protection contre les rafales de requêtes webhook (cooldown 45s, fusion des imports simultanés et tampon de stabilisation de 15s).
* 🎨 **Interface Web Moderne & Responsive** :
  * Adaptée aux écrans d'ordinateurs, tablettes et smartphones.
  * Thème sombre (**Dark Mode**) et thème clair (**Light Mode**).
  * Multilingue (**Français 🇫🇷 / Anglais 🇬🇧**) avec bascule instantanée.
  * Paramètres modulaires avec possibilité d'activer/désactiver des fonctionnalités (ex: onglet scanner).
* 🧹 **Automatisation & Nettoyage** :
  * Purge automatique des fichiers/symlinks temporaires dès que Sonarr/Radarr a finalisé l'importation.
  * Suppression automatique des torrents/magnets sur le cloud du fournisseur après téléchargement.

---

## 🚀 Installation

### 1. Docker & Docker Compose *(Recommandé)*

Idéal pour Linux, serveurs NAS (Synology, QNAP, Unraid) ou Docker Desktop.

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/billouetaudrey/pyrdt.git
   cd pyrdt
   ```
2. Adaptez `docker-compose.yml` selon vos chemins de montage et vos disques :
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
         - DEBRID_PROVIDER=alldebrid
         - RCLONE_MOUNT_DIR=/mnt/alldebrid/magnets
         - DOWNLOAD_BASE_DIR=/mnt/virtual/Medias/DL
         - MEDIA_SCAN_PATHS=/mnt/virtual/Medias/Films,/mnt/virtual/Medias/Series,/mnt/virtual/Medias/Animes
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

### 1. Client de téléchargement (Download Client)

Dans vos applications \*arr, rendez-vous dans **Settings** > **Download Clients** et ajoutez un client :

| Paramètre | Valeur |
| :--- | :--- |
| **Type de client** | **qBittorrent** |
| **Nom** | `PyRDT` |
| **Hôte (Host)** | `localhost` ou l'adresse IP de votre serveur PyRDT |
| **Port** | `6505` |
| **Nom d'utilisateur** | *(Laisser vide sauf si configuré dans Sécurité)* |
| **Mot de passe** | *(Laisser vide sauf si configuré dans Sécurité)* |
| **Catégorie** | `tv-sonarr` (pour Sonarr) / `radarr` (pour Radarr) / `whisparr` (pour Whisparr) |

> [!TIP]
> Dans PyRDT, rendez-vous dans l'onglet **Paramètres** > **Services (*arr)** pour définir pour chaque catégorie si elle doit utiliser le mode **Symlink** ou **Téléchargement réel**.

---

### 2. Webhook de notification (Scan automatique de la médiathèque)

Pour déclencher automatiquement la vérification des liens symboliques et de la médiathèque après chaque import terminé par Sonarr ou Radarr :

1. Dans **Sonarr** ou **Radarr**, allez dans **Settings** > **Connect** > bouton **+** > **Webhook**.
2. Renseignez les paramètres suivants :
   * **Name** : `PyRDT Scanner`
   * **Notification Triggers** : Cochez uniquement **On Download** / **On Import** (ou **On Upgrade**).
   * **URL** : `http://127.0.0.1:6505/api/scanner/webhook` *(ou l'IP de votre serveur)*
   * **Method** : `POST`
3. Enregistrez. Dès qu'un téléchargement est finalisé et importé, PyRDT analyse les nouveaux liens en tâche de fond.

> [!NOTE]
> Grâce au système de sécurité intégré (coalescing & cooldown), si Sonarr importe une saison complète de 20 épisodes à la suite, PyRDT regroupe automatiquement tous les webhooks pour n'exécuter qu'une seule analyse globale, sans saturer le serveur ni les disques.

---

## 🔍 Module "Médiathèque & Liens"

Accessible via l'onglet dédié (activable/désactivable dans les paramètres) :

* **Statistiques globales** : Total des liens morts, des torrents/magnets cloud, des doublons et des fichiers locaux indexés.
* **Résolution des liens morts** :
  * Recherche automatique : PyRDT contacte l'API de Radarr ou Sonarr pour déclencher une nouvelle recherche automatique du film ou de l'épisode correspondant au lien mort, puis purge le symlink cassé.
  * Suppression locale : Nettoie les fichiers/symlinks orphelins du stockage.
* **Gestion des magnets Debrid** :
  * Filtrez par : **Tous**, **Doublons**, **Non symlinkés** ou **Liens morts**.
  * Suppression sélective ou par lot directement depuis l'interface avec confirmation.

---

## 📁 Architecture du Code

```text
pyrdt/
├── app.py                      # Point d'entrée rétrocompatible
├── docker-compose.yml          # Déploiement conteneurisé
├── install.sh                  # Installeur automatique Linux (bare-metal)
├── start.sh                    # Script de démarrage direct
├── requirements.txt            # Dépendances Python (FastAPI, Uvicorn, HTTPX)
├── data/                       # Stockage persistant de l'état (state.json, scanner_cache.json)
└── app/
    ├── main.py                 # Initialisation FastAPI, middlewares, lifespan
    ├── config.py               # Paramètres par défaut, logging
    ├── state.py                # Gestion du fichier JSON d'état et verrous
    ├── storage.py              # Détection rclone, création symlinks/copies, auto-clean
    ├── scanner.py              # Moteur d'analyse de médiathèque, AllDebrid & Radarr/Sonarr
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
    │   ├── scanner.py          # Endpoints API du scanner de médiathèque et webhooks
    │   └── web.py              # Endpoints du tableau de bord Web et des paramètres
    ├── templates/
    │   └── index.html          # Interface utilisateur HTML5 responsive
    └── static/
        ├── css/style.css       # Thèmes sombre & clair (CSS variables) et responsive
        └── js/app.js           # Moteur i18n, gestion scanner et rafraîchissement temps réel
```

---

## 📄 Licence

Ce projet est sous licence MIT — vous êtes libre de l'utiliser, le modifier et le distribuer.
