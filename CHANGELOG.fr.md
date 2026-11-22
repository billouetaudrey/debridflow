# Journal des modifications (Changelog) 📋

Toutes les évolutions notables apportées au projet **OmniSym** sont répertoriées dans ce document.

Ce document respecte les conventions de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/)
et applique le versionnage sémantique [Semantic Versioning](https://semver.org/lang/fr/).

🌐 **Langue** : [English 🇬🇧](CHANGELOG.md) | **Français 🇫🇷**

---

## [2.8.0] — 2026-11-22

### Ajouté
- **Filtres de statut en menu déroulant compact** :
  - Remplacement des boutons par un élégant menu déroulant compact (**Tous**, **DL en cours**, **Débridage cloud**, **En échec**, **Terminés**, **En pause**) avec mise à jour en direct des compteurs.
- **Regroupement pliable / dépliable (Accordéons)** :
  - Sections repliables avec chevrons animés et badges de quantité, regroupant les éléments par **Statut / Type** (par défaut), **Catégorie** ou **Mode de transfert**.
  - Boutons d'action rapide **Tout déplier** et **Tout replier**.
  - Bouton de sélection groupée en un clic (`☑️`) pour cocher ou décocher tous les éléments d'une section spécifique.
  - Mémorisation de l'état plié/déplié dans `localStorage` pour persister lors des actualisations et rechargements.
  - Mise en page mobile réactive adaptée convertissant les groupes et lignes en cartes tactiles lisibles.

### Corrigé
- **Mise à jour en mémoire du dictionnaire d'état au démarrage** :
  - Résolution d'un bug où `torrents_db` était réassigné lors de `load_state()`, brisant les références importées dans le worker et le routeur qBittorrent, faisant disparaître la file après un redémarrage du conteneur.
  - Récupération et synchronisation réussies de l'ensemble des 105 téléchargements actifs avec Whisparr et AllDebrid.

---

## [2.7.1] — 2026-11-22

### Corrigé
- **Nettoyage automatique sur le débrideur lors d'un "Blocklist and search" ou torrent incomplet** :
  - Correction du comportement où l'action "Blocklist and search" ou la suppression d'un torrent incomplet/non-caché depuis Sonarr ou Radarr ne supprimait pas le magnet sur le compte débrideur (AllDebrid, RealDebrid, etc.).
  - La route `/api/v2/torrents/delete` distingue désormais automatiquement les médias complétés et importés (fichiers distants préservés pour ne pas casser les symlinks rclone) des torrents incomplets, bloqués, en échec ou rejetés avant import (immédiatement supprimés sur le débrideur pour garder le compte propre et libérer les slots cloud).

---

## [2.7.0] — 2026-11-21

### Ajouté
- **Rebranding officiel du projet** : Nouveau nom **OmniSym** (*Omni* = orchestrateur multimédia universel tout-en-un, *Sym* = symlinks instantanés et symbiose avec la suite *arr) pour refléter l'ensemble des fonctionnalités bien au-delà du simple débridage.
- **Intégrations Navigateurs (Clic-droit &amp; 1-Clic)** :
  - **Extension Google Chrome / Chromium (Manifest V3)** :
    - Intégration directe au menu contextuel natif au clic-droit sur les liens et le texte sélectionné.
    - Actions rapides pour les modes Défaut, Symlink (instantané) et Téléchargement réel (local).
    - Fenêtre popup avec diagnostic en direct de connexion, sélection de la catégorie et raccourci vers OmniSym.
    - Notifications de bureau natives lors de l'ajout réussi ou en cas d'erreur.
    - Téléchargement du package `.zip` prêt à l'emploi depuis les paramètres.
  - **Script Tampermonkey / Violentmonkey** :
    - Menu contextuel flottant sur les magnets, fichiers torrents et liens DDL (1fichier, Rapidgator, etc.).
    - Injection automatique de badges `⚡` 1-clic à côté des liens magnets sur les sites de torrents.
    - Raccourci `Alt + Clic gauche` pour envoyer instantanément n'importe quel lien en arrière-plan.
- **Support complet Progressive Web App (PWA)** :
  - Manifeste d'application web (`manifest.json`) permettant l'installation directe en tant qu'application autonome (standalone) sur Android, iOS, Windows, macOS et Linux.
  - Icônes haute résolution OmniSym (PNG 192x192 et 512x512, incluant les variantes adaptatives `maskable` pour les lanceurs Android).
  - Service Worker léger et performant (`sw.js`) avec stratégie Réseau d'abord (Network-First) et pré-mise en cache de l'App Shell hors-ligne.
  - Routes racine `/manifest.json`, `/sw.js` et `/favicon.ico` avec en-tête `Service-Worker-Allowed: /` et exclusion de l'authentification pour garantir l'installation PWA.
  - **Intégration Native Android Web Share Target** : S'intègre directement dans le menu natif « Partager » d'Android pour recevoir des liens DDL, magnets ou fichiers `.torrent` depuis n'importe quelle application (remplacement complet de MyJDownloader).
  - **Gestionnaire de Protocole Magnet** : L'appui sur un lien `magnet:` ouvre directement OmniSym.
  - **Raccourcis d'Écran d'Accueil** : Actions rapides sur appui long sur l'icône de l'application.
- **Contrôleur Telegram Bidirectionnel** :
  - Écouteur en tâche de fond permettant l'ajout de téléchargements à distance directement via Telegram.
  - Envoyez ou partagez des magnets, liens DDL ou fichiers `.torrent` à votre bot privé depuis n'importe où (fonctionne en 4G/5G sans VPN ni ouverture de port) ; OmniSym les ajoute immédiatement à la file et répond avec le statut.

---

## [2.6.0] — 2026-11-21

### Ajouté
- **Indicateur de statut de débridage en temps réel** :
  - Affichage direct de l'état de débridage dans la colonne Statut de la file d'attente (desktop et mobile).
  - `⚡ Déjà débridé (Cache)` : Le torrent était déjà présent à 100% dans le cache du fournisseur lors de l'ajout (débridage instantané).
  - `⚡ Débridé` : Le fichier a terminé d'être téléchargé sur les serveurs du fournisseur et est prêt.
  - `⏳ Non débridé (Cloud X% • Y sources)` : Le fichier n'était pas en cache et est en cours de téléchargement par le fournisseur depuis le réseau BitTorrent, avec progression en direct et nombre de seeders.
  - Détection automatique et affichage `⚡ Débridé` immédiat pour les liens directs DDL.
- **Architecture Frontend Modulaire** :
  - Découpage complet du fichier monolithique `app.js` (plus de 3 500 lignes) en 8 modules fonctionnels spécialisés :
    - `i18n.js` : Dictionnaires multilingues (FR/EN), métadonnées des fournisseurs Debrid, gestion de la langue et du thème sombre/clair.
    - `queue.js` : Affichage de la file d'attente, gestion DDL, utilitaires de formatage, actions par lot et fenêtres modales.
    - `settings.js` : Sous-navigation des paramètres, diagnostics de connexion API, répertoires personnalisés et alertes Telegram.
    - `onboarding.js` : Assistant interactif de premier démarrage étape par étape (étapes 1 à 4).
    - `scanner.js` : Scan de médiathèque, détection des symlinks orphelins, gestion des magnets cloud et relance Radarr/Sonarr.
    - `finder.js` : Recherche multi-moteurs (Brave, DuckDuckGo, etc.), filtres et injection en 1 clic vers Debrid.
    - `speedtest.js` : Mesures de latence et bancs d'essai de débits réels (Mbps / Mo/s).
    - `app.js` : Point d'entrée allégé, événements du cycle de vie et boucles de synchronisation.
- **Montage StaticFiles FastAPI** : Distribution native et ultra-performante de tous les fichiers statiques (`/static/`) avec gestion du cache HTTP et ETags.

### Modifié
- Restructuration de `index.html` pour charger les modules JavaScript de manière propre et ordonnée.
- Mise à jour des adaptateurs AllDebrid et Real-Debrid pour remonter les flags `ready` lors de l'upload et des interrogations de statut.

---

## [2.5.0] — 2026-11-20

### Ajouté
- **Suite de Speedtest & Diagnostics Réseau** :
  - Mesure de latence (ping) vers les datacenters AllDebrid et serveurs DNS mondiaux directement depuis la machine hôte.
  - Test de débit réel montant et descendant en Mbps et Mo/s via le point d'accès `/api/speedtest/run`.
- **Documentation Bilingue Complète** :
  - `README.md` en anglais comme page d'accueil internationale sur GitHub.
  - `README.fr.md` dédié pour la communauté francophone.
  - Ajout des badges de projet, incluant le badge officiel d'attribution Google Gemini.
- **Licence Officielle MIT** : Création du fichier `LICENSE`.

### Modifié
- **Changement de nom (Rebranding)** : Renommage intégral du projet de `PyRDT` vers **OmniSym** à travers l'ensemble des fichiers, services et conteneurs Docker.
- Amélioration de la relance des torrents : suppression automatique des identifiants obsolètes/échoués et ré-upload propre du magnet.

---

## [2.0.0] — 2026-11-19

### Ajouté
- **Gestionnaire Direct Download (DDL)** :
  - Débridage et téléchargement de liens hébergeurs majeurs (1fichier, Rapidgator, Turbobit, Uptobox, etc.).
  - File d'attente DDL dédiée et répertoires de destination personnalisables.
- **Recherche Multi-Moteurs (Finder)** :
  - Moteur unifié interrogeant DuckDuckGo, Brave, Google, Bing, Yandex et Mojeek simultanément.
  - Filtrage par magnets, torrents ou liens DDL avec ajout direct en file d'attente en 1 clic.
- **Scanner Intelligent de Médiathèque & Liens Morts** :
  - Cache incrémental en mémoire vive basé sur la date de modification (`mtime`) : scan en moins de 2 secondes.
  - Détection automatique des symlinks cassés pour les fichiers purgés du cloud.
  - Intégration directe aux API de Radarr et Sonarr pour relancer automatiquement la recherche des médias manquants.
  - Gestionnaire de magnets cloud pour purger les doublons et torrents orphelins.
- **Notifications Telegram** :
  - Alertes instantanées à la fin des téléchargements (avec vitesse moyenne et taille).
  - Rapports d'analyse de médiathèque et alertes d'erreurs d'API.
- **Interface Web Moderne & Responsive** :
  - Interface adaptée aux smartphones, tablettes et ordinateurs.
  - Modes Sombre et Clair.
  - Bascule instantanée Français / Anglais.
  - Assistant d'accueil interactif lors du premier lancement.

---

## [1.0.0] — 2026-11-15

### Ajouté
- **Émulation API qBittorrent v2** : Intégration transparente avec Sonarr, Radarr, Whisparr, Lidarr et Prowlarr.
- **Double Mode de Traitement** :
  - Liens symboliques instantanés sans espace disque (via montage cloud rclone).
  - Téléchargements physiques sur disques locaux avec limitation de bande passante.
- **Support Multi-Fournisseurs** : AllDebrid, Real-Debrid, Premiumize.me, Debrid-Link, TorBox et High-Way.me.
- **Déploiement Docker & Bare-Metal** : Script d'installation automatique `install.sh` et configuration `docker-compose.yml`.
