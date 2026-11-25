# Journal des modifications (Changelog) 📋

Toutes les évolutions notables apportées au projet **OmniSym** sont répertoriées dans ce document.

Ce document respecte les conventions de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/)
et applique le versionnage sémantique [Semantic Versioning](https://semver.org/lang/fr/).

🌐 **Langue** : [English 🇬🇧](CHANGELOG.md) | **Français 🇫🇷**

---

## [2.9.2] — 2026-11-25

### Ajouté
- **Retentatives progressives automatiques pour les fichiers montés dans Rclone** :
  - Mise en place d'une stratégie de réessais progressifs à intervalles échelonnés (10s, 20s, 30s, 60s, 120s, 180s — total 7 minutes) lorsqu'un torrent est débridé sur le cloud (`statusCode == 4`) mais pas encore visible dans le montage local Rclone (`/mnt/alldebrid/magnets`).
  - Élimination des faux échecs et mises en erreur prématurées après un timeout statique court de 60s.
  - **Invalidation et rafraîchissement proactif du cache VFS** : appel direct à l'API Remote Control (RC) de rclone (`POST /vfs/refresh`) sur le dossier `magnets` avant chaque tentative et lors d'une relance, forçant rclone à actualiser immédiatement son arborescence WebDAV.
  - **Suivi visuel et décompte dynamique dans la file d'attente** : affichage du numéro de tentative en cours et d'un décompte en secondes dans le badge d'état (`⏳ Attente rclone (tentative X/6 • dans Ys)`).
  - **Détection et recherche assouplie des dossiers/fichiers** : comparaison normalisée (`simplify_name`) insensible aux variations de ponctuation, d'espaces et d'extensions entre le nom du magnet et le nom exposé par le montage.
  - **Rafraîchissement instantané lors d'une relance manuelle** : le clic sur « Relancer » ou « Reprendre » remet à zéro les compteurs de tentatives et déclenche immédiatement l'invalidation du cache VFS.
  - **Configuration de l'URL RC Rclone** : ajout du paramètre `rclone_rc_url` dans les paramètres et validation de son statut lors du test de connexion.

### Corrigé
- **Correction de l'erreur d'upload de fichiers .torrent manuels** :
  - Résolution de l'exception `cannot access local variable 'raw_url' where it is not associated with a value` survenue lors de l'ajout manuel de fichiers `.torrent` dans l'interface sans lien magnet associé.
  - Génération automatique d'un URI magnet synthétique (`magnet:?xt=urn:btih:...`) pour permettre la relance ultérieure de ces torrents.

## [2.9.1] — 2026-11-23

### Ajouté
- **Mémorisation du choix dans les options de suppression** :
  - Ajout de la case à cocher « Mémoriser mon choix » dans la boîte modale de confirmation de suppression (`#del-modal`).
  - Mémorisation persistante dans `localStorage` de l'état des options (« Supprimer les fichiers locaux / symlinks » et « Supprimer le magnet sur AllDebrid »).
  - Pré-sélection automatique des options enregistrées à chaque future ouverture de la modale de suppression.
- **Recherche d'alternative pour les magnets et téléchargements en erreur** :
  - Ajout du bouton d'action `🔍 Rechercher` et de l'icône loupe cliquable à côté du titre pour tout torrent ou téléchargement DDL en statut d'erreur dans la file d'attente (`state === 'error'`).
  - Ouvre automatiquement l'onglet Finder multi-moteurs avec le titre nettoyé et lance la recherche instantanément pour trouver une release ou un lien alternatif en un clic.
  - Intégration dans le gestionnaire Médiathèque & Liens : bouton de recherche directe sur les cartes de magnets en statut mort API (`statusCode > 4`) et sur les liens morts locaux sans association Arr.

### Corrigé
- **Filtrage intelligent de la médiathèque & exclusion des fichiers non téléchargés ou hors dossiers scannés** :
  - **Exclusion des téléchargements en cours** : les magnets dont le statut AllDebrid est `< 4` (0 = traitement/attente, 1 = en cours de téléchargement cloud, 2 = compression, 3 = téléversement) ou qui sont en cours de transfert local actif ne sont plus listés dans l'onglet Médiathèque. Ils restent gérés dans l'onglet File d'attente et ne sont plus étiquetés à tort comme « Non symlinkés ».
  - **Respect strict des dossiers configurés dans Paramètres / Médiathèque (`media_scan_paths`)** : les torrents issus de catégories ou de services hors médiathèque (ex. Whisparr, Torrent-Direct, répertoires de téléchargement direct non inclus dans la médiathèque) n'apparaissent plus dans la liste des magnets de la médiathèque.
  - **Comptage et badges fiables pour les magnets « Non symlinkés »** : seuls les magnets AllDebrid terminés (`statusCode == 4`), valides et absents du disque local dans les dossiers scannés sont comptabilisés dans les « Non symlinkés ». Les magnets en erreur ou expirés sont cantonnés au statut « Morts API » sans cumuler de faux badges.
  - **Filtre « Non symlinkés » dans l'interface** : le bouton de filtre n'affiche désormais que les véritables fichiers non symlinkés en excluant les erreurs API.

## [2.9.0] — 2026-11-22

### Ajouté
- **Barre de recherche en direct dans la file d'attente** :
  - Champ de saisie instantané avec icône loupe et bouton d'effacement rapide (`✕`) intégré dans la barre de contrôle.
  - Filtrage multi-critères en temps réel (titre du fichier, catégorie, hash, identifiant AllDebrid, dossier de destination).
  - Compatible avec tous les filtres de statut, tris interactifs et regroupements pliables (seuls les groupes contenant des résultats restent affichés).
  - Préservation du focus et de la saisie sans interruption lors du rafraîchissement automatique de 2 secondes.
- **Bouton de recherche d'alternative pour les fichiers en cours de débridage** :
  - Bouton dédié `🔍 Rechercher` dans les actions et icône loupe rapide à côté du titre pour tout fichier en cours de débridage cloud ou DDL.
  - Ouvre automatiquement l'onglet Recherche (Finder multi-moteurs), pré-remplit le titre nettoyé et lance instantanément la recherche multi-sources pour trouver une release alternative ou un lien direct en un clic.
- **Menu déroulant de tri pour mobile & desktop** :
  - Intégration d'un sélecteur déroulant `Trier :` dans la barre de contrôle de la file d'attente (Statut & Vitesse, Vitesse +/- rapide, Nom A-Z / Z-A, ID +/- récent, Catégorie A-Z / Z-A).
  - Offre un contrôle de tri complet et tactile sur smartphone où les en-têtes de colonnes du tableau sont masqués au profit des cartes responsives.
  - Synchronisation bidirectionnelle automatique et persistante entre le menu déroulant et les clics sur les colonnes en mode bureau.
- **Tri interactif des colonnes au clic (ID, Nom, Catégorie, Vitesse, Statut)** :
  - En-têtes de tableau cliquables avec indicateurs d'ordre actifs (`▲` croissant / `▼` décroissant) et basculement en un clic.
  - Tri multi-critères : par **Statut** (avec progression), par **Vitesse / Débit** (du plus rapide au plus lent), par **Nom** (alphabétique A-Z / Z-A), par **ID** (numérique AllDebrid / hash) et par **Service / Catégorie**.
  - Persistance automatique du critère et de l'ordre de tri dans `localStorage` (maintien permanent lors des actualisations automatiques de 2s et réouvertures).
  - Tri appliqué en temps réel à l'intérieur de chaque groupe pliable ainsi qu'en vue liste plate.
- **Affichage des débits en direct (par débridage et global)** :
  - **Débit individuel par débridage** : affichage d'un badge de débit en temps réel directement à côté de la catégorie (`☁️ X.X Mo/s` pour le débridage cloud chez AllDebrid, `📥 Y.Y Mo/s` pour le téléchargement local vers le disque).
  - **Débit global cumulé par catégorie & groupe** : affichage du débit cumulé en temps réel dans chaque en-tête de catégorie pliable (`📁 Catégorie : tv-whisparr [41] [⚡ 75.9 Ko/s]`) et par statut.
  - **Indicateurs globaux de bande passante** : deux compteurs dynamiques dans la barre d'outils affichant le débit global de débridage cloud AllDebrid et le débit de téléchargement local.
  - **Transmission du débit aux applications *Arr** : transmission en direct de la vitesse instantanée dans l'API qBittorrent pour un suivi du débit dans Radarr, Sonarr et Whisparr.
- **Bouton de synchronisation forcée (Arr / Débrideur)** :
  - Ajout du bouton `🔄 Rafraîchir (Arr / Débrideur)` dans la barre d'outils de la file d'attente.
  - Interrogation immédiate du fournisseur Debrid pour tous les torrents actifs sans attendre le cycle du worker.
  - Déclenchement automatique de la commande `RefreshMonitoredDownloads` vers les API Radarr, Sonarr et Whisparr pour forcer l'analyse immédiate des téléchargements terminés.
- **Support complet de Whisparr dans les paramètres Arr** :
  - Champs dédiés pour l'URL et la clé API Whisparr dans la section intégration Arr.

### Modifié
- **Séparation stricte entre « DL en cours » et « Débridage en cours »** :
  - Les éléments en cours de débridage ou en attente chez le fournisseur (`is_debrided: false`) sont désormais strictement isolés dans le statut et le filtre « Débridage cloud », même si leur mode de transfert cible est configuré sur « Téléchargement ».
  - Le filtre « DL en cours » n'inclut dorénavant que les éléments déjà débridés en cours de téléchargement local ou de transfert actif.

### Corrigé
- **Détection des doublons de séries (Saison 01 vs Saison 02)** :
  - **Préservation prioritaire de la saison et de l'épisode** : correction de l'algorithme de normalisation des noms de fichiers (`normalize_filename`) qui tronquait prématurément le titre dès la première année rencontrée (ex: *One Piece 2023 S01* et *One Piece 2023 S02* étaient tous deux tronqués en *One Piece 2023*, créant un faux doublon).
  - **Standardisation multi-formats** : détection et normalisation automatique des formats de séries (`S01`, `S1`, `Saison 1`, `Season 01`, `S01E02`, `S01-S03`), garantissant que chaque saison et chaque épisode reste un média distinct et n'est jamais confondu avec une autre saison.
- **Relance des liens morts dans Radarr, Sonarr & Whisparr** :
  - **Correction du blocage au clic** : remplacement de l'injection directe des chemins dans les attributs `onclick` par un indexage sécurisé, évitant les erreurs de syntaxe JavaScript causées par les apostrophes dans les titres de médias (ex. *Guy Ritchie's*, *Marvel's*).
  - **Purge effective du fichier mort avant recherche** : suppression explicite de l'entrée du fichier mort dans l'API de Radarr (`DELETE /api/v3/moviefile/{id}`) et Sonarr (`DELETE /api/v3/episodefile/{id}`) avant de déclencher `MoviesSearch` ou `SeriesSearch`, garantissant que Radarr/Sonarr détecte le média comme manquant et télécharge immédiatement une nouvelle release.
  - **Prise en charge complète de Whisparr** : intégration de Whisparr dans la relance individuelle et groupée des liens morts.
  - **Nettoyage immédiat du cache** : retrait instantané du lien mort de la mémoire et du cache local dès la relance réussie.
- **Alignement typographique et saut de ligne des libellés (`Filtrer :`, `Grouper :`, `Trier :`)** :
  - Empêchement du renvoi à la ligne intempestif des deux-points (`:`) sur smartphone et petits écrans grâce à l'utilisation d'espaces insécables (`&nbsp;` / `\u00A0`) et de styles CSS stricts (`white-space: nowrap`, `flex-shrink: 0`).
- **Persistance du repliage des groupes lors du rafraîchissement automatique** :
  - Suppression de la condition qui forçait la réouverture intempestive des accordéons repliés lors du polling périodique de 2 secondes.
  - Les groupes repliés par l'utilisateur restent désormais strictement repliés en toute circonstance.

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
