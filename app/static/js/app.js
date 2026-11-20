// PyRDT Frontend Logic & Multilingual Engine
const TRANSLATIONS = {
  fr: {
    // Brand & Header
    brand_title: "PyRDT — Client Multi-Debrid Symlink & DL",
    tab_queue: "File d'attente",
    tab_settings: "Paramètres",
    api_test_ok: "Test API OK",
    api_test_err: "Échec Test API",
    api_testing: "Vérification API...",
    status_dl: "DL en cours ({n})",
    status_sym: "Symlink en cours ({n})",
    status_unreachable: "Serveur PyRDT injoignable",

    // Toolbar
    btn_add_torrent: "Ajouter un torrent / magnet",
    btn_add_ddl: "Ajouter liens DDL",
    modal_upload_title: "Ajouter un Téléchargement",
    tab_magnet: "Lien Magnet",
    tab_torrent_file: "Fichier .torrent",
    tab_ddl: "Liens DDL (Direct)",
    tab_ddl_nav: "Liens DDL",
    lbl_magnet_input: "Lien(s) Magnet ou URL(s) :",
    ph_magnet_input: "magnet:?xt=urn:btih:...",
    hint_magnet_multiple: "Vous pouvez coller un ou plusieurs liens (un par ligne).",
    lbl_torrent_file: "Sélectionner ou glisser un fichier .torrent :",
    dropzone_prompt: "Glissez vos fichiers .torrent ici ou cliquez pour parcourir",
    dropzone_files_selected: "{n} fichier(s) sélectionné(s) :",
    lbl_ddl_input: "Lien(s) direct(s) (Rapidgator, 1fichier, Turbobit, etc.) :",
    ph_ddl_input: "https://rapidgator.net/file/...&#10;https://1fichier.com/?...",
    lbl_ddl_password: "Mot de passe éventuel (optionnel) :",
    ph_ddl_password: "Mot de passe des archives / liens si nécessaire",
    hint_ddl_multiple: "Collez vos liens directs hébergeurs (un par ligne). Débridage automatique via AllDebrid.",
    ddl_card_title: "Téléchargements Directs Hébergeurs (DDL)",
    ddl_card_desc: "Débridez vos liens Rapidgator, 1fichier, Turbobit, Nitroflare... directement via AllDebrid et téléchargez-les sur votre serveur.",
    btn_ddl_submit: "Débrider & Télécharger en DDL",
    title_ddl_queue: "Téléchargements DDL en cours & terminés",
    lbl_max_concurrent_dl: "Nombre de téléchargements simultanés en DDL :",
    hint_max_concurrent_dl: "Nombre de téléchargements simultanés (torrents/magnets en mode copie et liens directs DDL). Par défaut : 3.",
    st_resolving: "Débridage AllDebrid...",
    st_queued: "En attente (slot DL)",
    tag_ddl: "DDL Direct",
    // Multi-Engine Finder
    tab_finder_nav: "🔍 Recherche",
    finder_title: "Recherche Multi-Moteurs (Torrents, Magnets & DDL)",
    finder_subtitle: "Interroge simultanément DuckDuckGo, Brave, Bing, Yandex, Google, Yahoo, Mojeek... pour extraire des liens vérifiés directement téléchargeables dans PyRDT.",
    opt_finder_mode_torrent: "🧲 Magnets & Torrents (Deep)",
    opt_finder_mode_hoster: "🔗 Liens DDL (site:)",
    opt_finder_mode_both: "⚡ Tout (Torrent + DDL)",
    ph_finder_query: "Ex: Dune Part Two 2024 MULTI 1080p...",
    btn_finder_search: "Rechercher",
    finder_adv_settings: "⚙️ Paramètres avancés (moteurs actifs, filtres, similarité)",
    finder_lbl_engines: "Moteurs de recherche actifs :",
    finder_site_filter: "Domaine hébergeur (mode site:)",
    finder_region: "Région",
    finder_safesearch: "Filtre parental",
    finder_max_results: "Résultats max / moteur",
    finder_max_scrape: "Pages max à analyser (Torrent)",
    finder_min_sim: "Similarité minimum (%)",
    finder_timeout: "Timeout réseau (sec)",
    finder_chk_verify: "Vérifier validité des liens",
    btn_save_finder_default: "💾 Enregistrer comme défaut",
    finder_searching_title: "Recherche sur les moteurs et scan des liens...",
    finder_searching_desc: "Interrogation des moteurs configurés, extraction des trackers et test de validité des liens.",
    btn_sel_all: "Tout cocher",
    btn_sel_none: "Tout décocher",
    btn_sel_magnets: "Magnets seuls",
    btn_sel_ddl: "DDL seuls",
    btn_copy_selected: "📋 Copier sélectionnés",
    btn_dl_selected_pyrdt: "Télécharger la sélection dans PyRDT",
    btn_dl_item: "Télécharger dans PyRDT",
    title_rejected_items: "⚠️ Liens écartés / non retenus",
    lbl_dest_service: "Service / Catégorie :",
    lbl_transfer_mode: "Mode de transfert :",
    opt_mode_auto: "Auto (selon le service)",
    btn_send_debrid: "Envoyer vers le débrideur",
    upload_sending: "Envoi en cours...",
    upload_success: "{n} élément(s) envoyé(s) avec succès !",
    err_no_input: "Veuillez fournir un lien magnet ou sélectionner un fichier .torrent.",
    err_upload_failed: "Échec de l'envoi vers le débrideur.",
    lbl_destination: "Destination :",
    sel_count: "{n} sélectionné(s)",
    btn_retry: "Relancer",
    btn_pause: "Pause",
    btn_resume: "Reprendre",
    btn_delete: "Supprimer",
    btn_purge_completed: "Purger terminés",
    select_all: "Tout sélectionner",

    // Queue Table Headers
    th_id: "ID (AD / Hash)",
    th_name: "Nom",
    th_service: "Service / Mode",
    th_status: "Statut",
    th_actions: "Actions",
    no_torrents: "Aucun torrent en file d'attente",
    tag_dl: "DL réel",
    tag_sym: "Symlink",

    // Statuses
    st_completed: "Terminé",
    st_paused: "En pause",
    st_error: "Erreur",
    st_rclone_wait: "Attente rclone",
    st_copying: "Copie locale",
    st_downloading: "Téléchargement",

    // Delete Modal
    modal_title: "Options de suppression",
    modal_desc: "Retirer {n} élément(s) de la liste PyRDT :",
    opt_del_files: "Supprimer aussi les fichiers / liens symboliques locaux",
    opt_del_ad: "Supprimer aussi le magnet chez le fournisseur",
    btn_cancel: "Annuler",
    btn_confirm_delete: "Confirmer la suppression",

    // Settings Sub-categories
    nav_provider: "Fournisseur & API",
    nav_storage: "Dossiers & Stockage",
    nav_services: "Services (*arr)",
    nav_scanner: "Médiathèque & Liens",
    nav_automation: "Automatisation",
    nav_security: "Sécurité",
    nav_appearance: "Styles & Affichage",
    nav_notifications: "Notifications",
    nav_system: "Performances & Système",

    // Settings Section Titles
    sec_provider: "1. Fournisseur & API Debrid",
    sec_storage: "2. Dossiers & Stockage",
    sec_services: "3. Services, Catégories *arr & Destinations",
    sec_scanner_settings: "4. Médiathèque & Surveillance des Liens",
    sec_automation: "5. Automatisation & Nettoyage",
    sec_security: "6. Sécurité & Authentification",
    sec_appearance: "7. Styles & Affichage",
    sec_notifications: "8. Notifications Telegram",
    sec_system: "9. Performances & Système",

    // Fields & Labels
    lbl_provider: "Fournisseur de Débridage (Provider)",
    hint_provider: "Choisissez parmi AllDebrid, Real-Debrid, Premiumize, Debrid-Link, TorBox ou High-Way.",
    lbl_api_key: "Clé / Token API",
    hint_api_key: "Clé ou Token secret généré chez votre fournisseur.",
    lbl_agent: "Nom de l'agent / User-Agent",
    hint_agent: "Identifiant envoyé aux API (ex: PyRDT-Billou).",
    lbl_api_base: "URL de l'API",
    hint_api_base: "Pré-remplie automatiquement selon le service sélectionné.",
    btn_test_api: "Tester la connexion API",
    testing_api: "Test en cours...",

    lbl_rclone_mount: "Chemin de montage Rclone (source magnets)",
    hint_rclone_mount: "Dossier monté par rclone (ex: /mnt/alldebrid/magnets).",
    lbl_dl_dir: "Dossier racine des téléchargements (DL)",
    hint_dl_dir: "Chaque service écrit dans son sous-dossier ici.",
    lbl_allowed_exts: "Extensions autorisées (séparées par virgules)",
    hint_allowed_exts: "Fichiers vidéos, audios ou sous-titres acceptés.",
    lbl_mount_timeout: "Timeout montage Rclone (secondes)",
    hint_mount_timeout: "Temps max d'attente d'apparition du fichier avant erreur.",

    hint_services: "Par défaut, chaque service écrit dans <Dossier racine DL>/<sous-dossier>/ (vous pouvez aussi indiquer un chemin absolu commençant par /).",
    btn_add_service: "+ Ajouter un service",
    th_svc_cat: "Catégorie *arr",
    th_svc_mode: "Mode de récupération",
    th_svc_subpath: "Sous-dossier dans DL (ou chemin /)",
    opt_mode_symlink: "Symlink (instantané)",
    opt_mode_download: "Téléchargement réel (copie locale)",
    btn_remove: "Retirer",

    lbl_del_dl_done: "Supprimer automatiquement le magnet chez le fournisseur dès que le Téléchargement réel est terminé (n'affecte pas les Symlinks)",
    lbl_auto_clean: "Purger automatiquement la liste des téléchargements et les fichiers/symlinks locaux temporaires après import *arr",
    lbl_del_prov: "Supprimer aussi automatiquement le magnet chez le fournisseur lors de la purge après import (y compris pour les Symlinks)",

    lbl_username: "Nom d'utilisateur (Web & Apps *arr — optionnel)",
    hint_username: "Si renseigné, doit correspondre aux identifiants qBittorrent dans Sonarr/Radarr.",
    lbl_password: "Mot de passe (Web & Apps *arr — optionnel)",
    hint_password: "Protège l'accès Web et l'API qBittorrent.",

    lbl_poll_interval: "Intervalle de vérification API (secondes)",
    hint_poll_interval: "Fréquence d'interrogation du fournisseur (défaut : 3.0s).",
    lbl_theme_choice: "Thème de l'interface",
    hint_theme_choice: "Bascule entre le mode sombre et le mode clair.",
    lbl_language: "Langue de l'interface",
    hint_language: "Choisissez le français ou l'anglais pour l'affichage.",
    title_display_options: "Options d'affichage & Confidentialité :",

    btn_save_settings: "Enregistrer les paramètres",
    alert_saved: "Paramètres enregistrés et appliqués immédiatement.",
    tip_switch_light: "Passer en mode clair",
    tip_switch_dark: "Passer en mode sombre",
    home_tip: "Accueil (File d'attente)",

    // Scanner & Liens Morts
    tab_scanner: "Médiathèque & Liens",
    sc_title: "🧲 Gestionnaire AllDebrid & Liens Morts Médiathèque",
    sc_last_scan_unknown: "Dernier scan : Inconnu",
    btn_scan_now: "🔄 Scanner (Rapide)",
    btn_scan_force: "⚡ Scan complet",
    sc_stat_dead: "⚠️ Liens Morts Locaux",
    sc_stat_magnets: "🧲 Total Magnets AD",
    sc_stat_duplicates: "📑 Doublons AD",
    sc_stat_unlinked: "❓ Non Symlinkés",
    sc_stat_links: "🔗 Fichiers Détectés",
    sc_dead_head: "⚠️ Liens Morts dans votre Médiathèque",
    btn_research_all: "⚡ Relancer dans Radarr / Sonarr & Purger",
    btn_clean_all_dead: "🗑️ Supprimer tous les liens morts",
    msg_no_dead_links: "Aucun lien mort détecté dans la médiathèque. Lancez un scan pour vérifier.",
    th_sc_media: "Média Radarr / Sonarr",
    th_sc_deadpath: "Lien symbolique mort",
    th_sc_target: "Cible manquante (Rclone / AD)",
    th_sc_actions: "Actions",
    sc_magnets_head: "🧲 Magnets AllDebrid & Doublons",
    btn_filter_all: "Tous",
    btn_filter_duplicates: "Doublons uniquement",
    btn_filter_dead: "Morts API",
    btn_filter_unlinked: "Non symlinkés",
    ph_search_magnets: "🔍 Filtrer les magnets par titre...",
    btn_expand_all: "↕️ Déplier tout",
    btn_select_visible: "☑ Cocher visibles",
    btn_clean_duplicates: "🧹 Nettoyer doublons",
    btn_delete_checked: "🗑️ Supprimer cochés",
    msg_loading_magnets: "Chargement des magnets...",
    btn_scan_stop: "Interrompre",
    hint_enable_scanner_tab: "Active ou désactive l'accès à l'onglet et au tableau de bord Médiathèque.",
    hint_webhook_info: "À renseigner dans Sonarr/Radarr (Settings > Connect > Webhook, déclencheur : On Download / On Import) pour analyser automatiquement après un téléchargement.",
    sec_arr_integration: "🔗 Intégration Radarr & Sonarr (Relance automatique des liens morts)",
    lbl_enable_scanner_tab: "Afficher l'onglet Médiathèque & Liens dans la barre de navigation",
    lbl_radarr_url: "URL Radarr",
    lbl_radarr_key: "Clé API Radarr",
    lbl_sonarr_url: "URL Sonarr",
    lbl_sonarr_key: "Clé API Sonarr",
    lbl_scan_paths: "Dossiers Médiathèque à analyser",
    btn_add_scan_path: "+ Ajouter un dossier",
    ph_scan_path_single: "Ex: /mnt/virtual/Medias/Films",
    hint_scan_paths: "Dossiers scannés pour détecter les symlinks brisés / cibles inexistantes.",
    lbl_speed_limit: "Limite de vitesse de téléchargement (Mo/s)",
    hint_speed_limit: "Limite le débit de copie/téléchargement physique (0 = illimité).",
    lbl_hide_last_dl_name: "Masquer par défaut le nom du dernier téléchargement",
    hint_hide_last_dl_name: "Conserve toujours la vitesse affichée, mais masque le titre du média jusqu'à ce que vous appuyiez dessus.",
    lbl_last_download: "Dernier téléchargement :",
    lbl_avg_speed: "Vitesse moyenne :",
    lbl_show_last_dl: "Afficher le nom",
    lbl_hide_last_dl: "Masquer",

    // Notifications Telegram
    lbl_tg_enable: "Activer les notifications Telegram",
    hint_tg_enable: "Envoie des alertes en temps réel sur votre bot Telegram lors des scans, liens morts, téléchargements et erreurs.",
    lbl_tg_bot_token: "Token du Bot Telegram",
    hint_tg_bot_token: "Token secret obtenu auprès de @BotFather.",
    lbl_tg_chat_id: "Chat ID / Channel ID",
    hint_tg_chat_id: "Votre ID de discussion Telegram (obtenu via @userinfobot ou @GetMyChatID_Bot).",
    btn_test_tg: "📲 Envoyer un message de test",
    testing_tg: "Envoi du message de test...",
    title_tg_events: "Événements à notifier :",
    lbl_tg_scan_start: "Scan de médiathèque démarré",
    lbl_tg_scan_complete: "Scan de médiathèque terminé (résumé complet)",
    lbl_tg_dead_link: "Alerte : Liens morts détectés dans la médiathèque",
    lbl_tg_dl_complete: "Téléchargement réel ou Symlink terminé (avec taille et vitesse)",
    lbl_tg_clean_dead: "Suppression / Purge de liens morts effectuée",
    lbl_tg_error: "Erreurs critiques (débridage, timeout rclone, copie)",
    tg_test_ok: "Notification de test reçue avec succès !",
    tg_test_err: "Échec de l'envoi vers Telegram.",

    // Onboarding
    ob_title: "Bienvenue sur PyRDT 🚀",
    ob_subtitle: "Assistant de première configuration pas à pas",
    ob_tab_styles: "1. Styles",
    ob_tab_provider: "2. Fournisseur",
    ob_tab_storage: "3. Stockage",
    ob_tab_services: "4. Services",
    ob_tab_automation: "5. Automatisation",
    ob_tab_notifications: "6. Notifications",
    ob_tab_bondl: "7. Bon DL",
    ob_btn_prev: "← Précédent",
    ob_btn_next: "Suivant →",
    ob_btn_skip: "Passer la configuration",
    ob_btn_finish: "🚀 Enregistrer & Terminer (Bon DL !)",
    ob_relaunch_title: "Assistant de configuration initiale (Onboarding)",
    ob_relaunch_btn: "🚀 Relancer l'assistant",
    ob_relaunch_hint: "Relance le guide pas à pas pour revoir ou modifier l'ensemble de vos paramètres.",
    ob_summary_title: "🎉 Tout est prêt ! Bon DL",
    ob_summary_desc: "Votre configuration PyRDT est prête. Cliquez ci-dessous pour appliquer vos réglages et démarrer vos téléchargements.",
    ob_hint_step1: "Personnalisez l'apparence et le confort visuel de PyRDT. Vous pouvez changer le thème ou la langue à tout moment.",
    ob_hint_step2: "Connectez votre compte Debrid pour débrider et récupérer vos fichiers à vitesse maximale.",
    ob_hint_step3: "Configurez les chemins où Rclone monte le disque distant et où PyRDT stocke les téléchargements et liens symboliques.",
    ob_hint_step4: "Configurez les catégories correspondant à Sonarr, Radarr, etc. Choisissez le mode Symlink (instantané) ou Téléchargement réel (copie sur disque).",
    ob_hint_step5: "Ajustez le comportement de nettoyage automatique et protégez l'accès à PyRDT.",
    ob_hint_step6: "Activez la surveillance des liens morts dans votre médiathèque et recevez des alertes en temps réel sur Telegram.",
    sec_reset: "Zone de Réinitialisation & Assistant",
    title_reset_settings: "Supprimer tous les paramètres & Réafficher l'Onboarding",
    btn_reset_settings: "🗑️ Supprimer & Relancer l'onboarding",
    hint_reset_settings: "Réinitialise tous les paramètres de PyRDT à leurs valeurs d'origine et réaffiche l'assistant de configuration initiale.",
    confirm_reset_settings: "Êtes-vous sûr de vouloir supprimer tous les paramètres, restaurer les valeurs par défaut et relancer l'assistant de configuration initiale ?",
    opt_theme_dark: "🌙 Sombre (Dark Mode)",
    opt_theme_light: "☀️ Clair (Light Mode)",
    opt_lang_fr: "🇫🇷 Français",
    opt_lang_en: "🇬🇧 English",
    title_clean_options: "Options de nettoyage :",
    title_auth_options: "Authentification (Optionnelle) :",
    title_medialib_surveillance: "Surveillance Médiathèque & Radarr / Sonarr :",
    title_webhook_info: "ℹ️ URL Webhook Sonarr / Radarr :",
    recap_provider_title: "🔑 Fournisseur Debrid :",
    recap_dl_dir_title: "📁 Dossier Téléchargements :",
    recap_services_title: "🎬 Services *arr configurés :",
    recap_tg_title: "🔔 Notifications Telegram :",
    ob_btn_finish_alt: "Bon DL ! Lancer PyRDT 🚀",
    ob_active: "Activées",
    ob_disabled: "Désactivées",
    ob_services_count: "{n} service(s)",
    ph_auth_empty: "Laisser vide = pas d'auth",
    ph_api_key: "Clé ou Token API",
    ph_speed_unlimited: "0 = illimité",
    ph_scan_paths: "/mnt/virtual/Medias/Films,/mnt/virtual/Medias/Series,...",
    tip_toggle_name: "Cliquer pour afficher / masquer le nom",
    tip_scan_fast: "Scan incrémental rapide utilisant le cache",
    tip_scan_force: "Forcer une réindexation complète de tous les dossiers",
    tip_close: "Fermer / Passer",
    scan_starting: "Démarrage du scan...",
    missing_target: "Cible inexistante",
    btn_purge: "🗑️ Purger",
    btn_retrigger_radarr: "🔍 Relancer Radarr",
    btn_retrigger_sonarr: "🔍 Relancer Sonarr",
    media_unknown: "❓ Non identifié",
    tag_symlinked: "🔗 Symlinké",
    tag_not_symlinked: "Non symlinké",
    tag_dead_api: "⚠️ Mort API",
    tag_kept_default: "(Conservé par défaut)",
    meta_size: "Taille :",
    meta_status: "Statut :",
    msg_no_magnets: "Aucun magnet trouvé. Lancez un scan pour actualiser.",
    no_dead_to_delete: "Aucun lien mort à supprimer.",
    no_dead_arr: "Aucun lien mort associé à Radarr ou Sonarr.",
    confirm_delete_magnet: "Supprimer ce magnet sur le fournisseur et purger ses liens locaux associés ?\n\n{name}",
    confirm_delete_checked_mags: "Supprimer définitivement {n} magnet(s) sélectionné(s) sur le fournisseur et leurs symlinks locaux ?",
    confirm_clean_duplicates: "Supprimer {n} doublons inutiles sur le fournisseur ?\n\nLe meilleur fichier de chaque groupe sera conservé intact.",
    confirm_clean_all_dead: "Supprimer l'intégralité des {n} liens morts détectés sur le disque ?",
    confirm_delete_from_arr: "{n} des liens morts sont associés à Radarr ou Sonarr.\n\nVoulez-vous ÉGALEMENT supprimer ces médias de votre bibliothèque Radarr / Sonarr ?",
    confirm_research_dead: "Relancer une recherche dans {mediaType} et purger le lien mort local ?",
    confirm_research_all_dead: "Voulez-vous relancer la recherche dans Radarr / Sonarr pour les {n} médias détectés et purger les liens morts ?",
    tip_brand_home: "Accueil (File d'attente)",
    tip_theme_toggle: "Basculer le thème (Clair / Sombre)",
    ph_api_key_secret: "Votre clé secrète API...",
    confirm_clean_single_dead: "Supprimer définitivement ce lien symbolique mort sur le disque ?",
    confirm_delete_media_arr: "Ce média est associé à {mediaType}{mediaTitle}.\n\nVoulez-vous ÉGALEMENT supprimer ce titre de votre bibliothèque {mediaType} ?",
    no_mags_selected: "Aucun magnet sélectionné.",
    no_dup_mags: "Aucun doublon fournisseur détecté à nettoyer.",
    last_scan_prefix: "Dernier scan : ",
    btn_collapse_all: "↕️ Plier tout",
    btn_expand_all: "↕️ Déplier tout",
    btn_check_visible: "☑ Cocher visibles",
    btn_uncheck_all: "☐ Décocher tout",
    scan_finished_success: "Scan terminé avec succès !",
    scan_interrupted_user: "Scan interrompu par l'utilisateur.",
    ph_chat_id: "Ex: 123456789 ou -100123456789",
  },
  en: {
    // Brand & Header
    brand_title: "PyRDT — Multi-Debrid Symlink & DL Client",
    tab_queue: "Queue",
    tab_settings: "Settings",
    api_test_ok: "API Test OK",
    api_test_err: "API Test Failed",
    api_testing: "Checking API...",
    status_dl: "Downloading ({n})",
    status_sym: "Symlinking ({n})",
    status_unreachable: "PyRDT server unreachable",

    // Toolbar
    btn_add_torrent: "Add torrent / magnet",
    btn_add_ddl: "Add DDL links",
    modal_upload_title: "Add Download",
    tab_magnet: "Magnet Link",
    tab_torrent_file: ".torrent File",
    tab_ddl: "DDL Links (Direct)",
    tab_ddl_nav: "DDL Links",
    lbl_magnet_input: "Magnet link(s) or URL(s):",
    ph_magnet_input: "magnet:?xt=urn:btih:...",
    hint_magnet_multiple: "You can paste one or multiple links (one per line).",
    lbl_torrent_file: "Select or drop a .torrent file:",
    dropzone_prompt: "Drag and drop your .torrent files here or click to browse",
    dropzone_files_selected: "{n} file(s) selected:",
    lbl_ddl_input: "Direct link(s) (Rapidgator, 1fichier, Turbobit, etc.):",
    ph_ddl_input: "https://rapidgator.net/file/...&#10;https://1fichier.com/?...",
    lbl_ddl_password: "Password (optional):",
    ph_ddl_password: "Password for archives / links if needed",
    hint_ddl_multiple: "Paste hoster direct links (one per line). Automatic debriding via AllDebrid.",
    ddl_card_title: "Hosters Direct Downloads (DDL)",
    ddl_card_desc: "Debrid your Rapidgator, 1fichier, Turbobit, Nitroflare... links directly through AllDebrid and download them to your server.",
    btn_ddl_submit: "Debrid & Download DDL",
    title_ddl_queue: "Active & completed DDL downloads",
    lbl_max_concurrent_dl: "Simultaneous DDL downloads limit:",
    hint_max_concurrent_dl: "Simultaneous downloads limit (torrents/magnets in copy mode and direct DDL links). Default: 3.",
    st_resolving: "Debriding...",
    st_queued: "Queued (DL slot)",
    tag_ddl: "Direct DDL",
    // Multi-Engine Finder
    tab_finder_nav: "🔍 Search",
    finder_title: "Multi-Engine Finder (Torrents, Magnets & DDL)",
    finder_subtitle: "Simultaneously queries DuckDuckGo, Brave, Bing, Yandex, Google, Yahoo, Mojeek... to extract verified links directly downloadable in PyRDT.",
    opt_finder_mode_torrent: "🧲 Magnets & Torrents (Deep)",
    opt_finder_mode_hoster: "🔗 DDL Links (site:)",
    opt_finder_mode_both: "⚡ All (Torrent + DDL)",
    ph_finder_query: "Ex: Dune Part Two 2024 MULTI 1080p...",
    btn_finder_search: "Search",
    finder_adv_settings: "⚙️ Advanced settings (active engines, filters, similarity)",
    finder_lbl_engines: "Active search engines:",
    finder_site_filter: "Hoster domain (site: mode)",
    finder_region: "Region",
    finder_safesearch: "SafeSearch",
    finder_max_results: "Max results / engine",
    finder_max_scrape: "Max pages to scrape (Torrent)",
    finder_min_sim: "Min similarity (%)",
    finder_timeout: "Network timeout (sec)",
    finder_chk_verify: "Verify links validity",
    btn_save_finder_default: "💾 Save as default",
    finder_searching_title: "Searching engines and scanning links...",
    finder_searching_desc: "Querying configured engines, extracting trackers and testing link validity.",
    btn_sel_all: "Select all",
    btn_sel_none: "Deselect all",
    btn_sel_magnets: "Magnets only",
    btn_sel_ddl: "DDL only",
    btn_copy_selected: "📋 Copy selected",
    btn_dl_selected_pyrdt: "Download selection in PyRDT",
    btn_dl_item: "Download to PyRDT",
    title_rejected_items: "⚠️ Discarded / rejected links",
    lbl_dest_service: "Service / Category:",
    lbl_transfer_mode: "Transfer mode:",
    opt_mode_auto: "Auto (from service)",
    btn_send_debrid: "Send to Debrid Provider",
    upload_sending: "Sending...",
    upload_success: "{n} item(s) sent successfully!",
    err_no_input: "Please provide a magnet link or select a .torrent file.",
    err_upload_failed: "Failed to send to debrid provider.",
    lbl_destination: "Destination:",
    sel_count: "{n} selected",
    btn_retry: "Retry",
    btn_pause: "Pause",
    btn_resume: "Resume",
    btn_delete: "Delete",
    btn_purge_completed: "Purge completed",
    select_all: "Select all",

    // Queue Table Headers
    th_id: "ID (AD / Hash)",
    th_name: "Name",
    th_service: "Service / Mode",
    th_status: "Status",
    th_actions: "Actions",
    no_torrents: "No torrents in queue",
    tag_dl: "Real DL",
    tag_sym: "Symlink",

    // Statuses
    st_completed: "Completed",
    st_paused: "Paused",
    st_error: "Error",
    st_rclone_wait: "Waiting for rclone",
    st_copying: "Local copying",
    st_downloading: "Downloading",

    // Delete Modal
    modal_title: "Deletion Options",
    modal_desc: "Remove {n} item(s) from PyRDT list:",
    opt_del_files: "Also delete local files / symbolic links",
    opt_del_ad: "Also delete magnet on provider",
    btn_cancel: "Cancel",
    btn_confirm_delete: "Confirm deletion",

    // Settings Sub-categories
    nav_provider: "Provider & API",
    nav_storage: "Storage & Folders",
    nav_services: "Services (*arr)",
    nav_scanner: "Media Library & Links",
    nav_automation: "Automation",
    nav_security: "Security",
    nav_appearance: "Styles & Display",
    nav_notifications: "Notifications",
    nav_system: "Performance & System",

    // Settings Section Titles
    sec_provider: "1. Debrid Provider & API",
    sec_storage: "2. Folders & Storage",
    sec_services: "3. Services, *arr Categories & Destinations",
    sec_scanner_settings: "4. Media Library & Links Monitor",
    sec_automation: "5. Automation & Cleanup",
    sec_security: "6. Security & Authentication",
    sec_appearance: "7. Styles & Display",
    sec_notifications: "8. Telegram Notifications",
    sec_system: "9. Performance & System",

    // Fields & Labels
    lbl_provider: "Debrid Provider",
    hint_provider: "Choose your debrid service: AllDebrid, Real-Debrid, Premiumize, Debrid-Link, TorBox, or High-Way.",
    lbl_api_key: "API Key / Token",
    hint_api_key: "API Key or secret token generated with your provider.",
    lbl_agent: "Agent Name / User-Agent",
    hint_agent: "Identifier sent to APIs (e.g. PyRDT-Billou).",
    lbl_api_base: "API Base URL",
    hint_api_base: "Automatically filled according to selected provider.",
    btn_test_api: "Test API Connection",
    testing_api: "Testing...",

    lbl_rclone_mount: "Rclone Mount Path (magnets source)",
    hint_rclone_mount: "Folder mounted by rclone (e.g. /mnt/alldebrid/magnets).",
    lbl_dl_dir: "Root Download Folder (DL)",
    hint_dl_dir: "Each service writes to its own subfolder here.",
    lbl_allowed_exts: "Allowed Extensions (comma-separated)",
    hint_allowed_exts: "Allowed video, audio or subtitle extensions.",
    lbl_mount_timeout: "Rclone Mount Timeout (seconds)",
    hint_mount_timeout: "Max wait time for file appearance before error.",

    hint_services: "By default, each service writes to <Root DL folder>/<subfolder>/ (you can also provide an absolute path starting with /).",
    btn_add_service: "+ Add a service",
    th_svc_cat: "*arr Category",
    th_svc_mode: "Retrieval Mode",
    th_svc_subpath: "Subfolder in DL (or / path)",
    opt_mode_symlink: "Symlink (instant)",
    opt_mode_download: "Real download (local copy)",
    btn_remove: "Remove",

    lbl_del_dl_done: "Automatically delete magnet on provider as soon as Real Download completes (does not affect Symlinks)",
    lbl_auto_clean: "Automatically purge downloads list and temporary local files/symlinks after *arr import",
    lbl_del_prov: "Also delete magnet on provider upon post-import purge (including for Symlinks)",

    lbl_username: "Username (Web & *arr Apps — optional)",
    hint_username: "If set, must match qBittorrent credentials in Sonarr/Radarr.",
    lbl_password: "Password (Web & *arr Apps — optional)",
    hint_password: "Protects Web UI access and qBittorrent API.",

    lbl_poll_interval: "API Polling Interval (seconds)",
    hint_poll_interval: "Provider query frequency (default: 3.0s).",
    lbl_theme_choice: "Interface Theme",
    hint_theme_choice: "Toggle between dark mode and light mode.",
    lbl_language: "Interface Language",
    hint_language: "Choose French or English for display.",
    title_display_options: "Display & Privacy Options:",

    btn_save_settings: "Save settings",
    alert_saved: "Settings saved and applied immediately.",
    tip_switch_light: "Switch to light mode",
    tip_switch_dark: "Switch to dark mode",
    home_tip: "Home (Queue)",

    // Scanner & Dead Links
    tab_scanner: "Library & Links",
    sc_title: "🧲 AllDebrid & Dead Links Manager",
    sc_last_scan_unknown: "Last scan: Unknown",
    btn_scan_now: "🔄 Scan (Fast)",
    btn_scan_force: "⚡ Full scan",
    sc_stat_dead: "⚠️ Local Dead Links",
    sc_stat_magnets: "🧲 Total AD Magnets",
    sc_stat_duplicates: "📑 AD Duplicates",
    sc_stat_unlinked: "❓ Not Symlinked",
    sc_stat_links: "🔗 Detected Files",
    sc_dead_head: "⚠️ Dead Links in Media Library",
    btn_research_all: "⚡ Trigger Search in Radarr / Sonarr & Purge",
    btn_clean_all_dead: "🗑️ Delete all dead links",
    msg_no_dead_links: "No dead links detected in your media library. Run a scan to check.",
    th_sc_media: "Radarr / Sonarr Media",
    th_sc_deadpath: "Dead Symbolic Link",
    th_sc_target: "Missing Target (Rclone / AD)",
    th_sc_actions: "Actions",
    sc_magnets_head: "🧲 AllDebrid Magnets & Duplicates",
    btn_filter_all: "All",
    btn_filter_duplicates: "Duplicates only",
    btn_filter_dead: "API Dead Links",
    btn_filter_unlinked: "Not symlinked",
    ph_search_magnets: "🔍 Filter magnets by title...",
    btn_expand_all: "↕️ Expand all",
    btn_select_visible: "☑ Check visible",
    btn_clean_duplicates: "🧹 Clean duplicates",
    btn_delete_checked: "🗑️ Delete checked",
    msg_loading_magnets: "Loading magnets...",
    btn_scan_stop: "Stop Scan",
    hint_enable_scanner_tab: "Enable or disable access to the Media Library tab and dashboard.",
    hint_webhook_info: "Configure in Sonarr/Radarr (Settings > Connect > Webhook, trigger: On Download / On Import) to automatically scan after a download.",
    sec_arr_integration: "🔗 Radarr & Sonarr Integration (Auto-trigger search on dead links)",
    lbl_enable_scanner_tab: "Show Media Library & Links tab in navigation bar",
    lbl_radarr_url: "Radarr URL",
    lbl_radarr_key: "Radarr API Key",
    lbl_sonarr_url: "Sonarr URL",
    lbl_sonarr_key: "Sonarr API Key",
    lbl_scan_paths: "Media Library folders to scan",
    btn_add_scan_path: "+ Add folder",
    ph_scan_path_single: "Ex: /mnt/virtual/Medias/Movies",
    hint_scan_paths: "Folders scanned to detect broken symlinks / missing targets.",
    lbl_speed_limit: "Download Speed Limit (MB/s)",
    hint_speed_limit: "Limits physical download rate (0 = unlimited).",
    lbl_hide_last_dl_name: "Hide last download name by default",
    hint_hide_last_dl_name: "Keeps speed visible, but hides media title until clicked.",
    lbl_last_download: "Last download:",
    lbl_avg_speed: "Average speed:",
    lbl_show_last_dl: "Show name",
    lbl_hide_last_dl: "Hide",

    // Telegram Notifications
    lbl_tg_enable: "Enable Telegram Notifications",
    hint_tg_enable: "Sends real-time alerts to your Telegram bot upon scans, dead links, downloads, and errors.",
    lbl_tg_bot_token: "Telegram Bot Token",
    hint_tg_bot_token: "Secret token obtained from @BotFather.",
    lbl_tg_chat_id: "Chat ID / Channel ID",
    hint_tg_chat_id: "Your Telegram Chat ID (obtained via @userinfobot or @GetMyChatID_Bot).",
    btn_test_tg: "📲 Send Test Message",
    testing_tg: "Sending test message...",
    title_tg_events: "Events to notify:",
    lbl_tg_scan_start: "Media library scan started",
    lbl_tg_scan_complete: "Media library scan completed (full summary)",
    lbl_tg_dead_link: "Alert: Dead links detected in media library",
    lbl_tg_dl_complete: "Real Download or Symlink completed (with size and speed)",
    lbl_tg_clean_dead: "Dead links deletion / purge performed",
    lbl_tg_error: "Critical errors (debrid, rclone timeout, copy failure)",
    tg_test_ok: "Test notification received successfully!",
    tg_test_err: "Telegram sending failed.",

    // Onboarding
    ob_title: "Welcome to PyRDT 🚀",
    ob_subtitle: "Step-by-step first-time setup wizard",
    ob_tab_styles: "1. Styles",
    ob_tab_provider: "2. Provider",
    ob_tab_storage: "3. Storage",
    ob_tab_services: "4. Services",
    ob_tab_automation: "5. Automation",
    ob_tab_notifications: "6. Notifications",
    ob_tab_bondl: "7. Happy DL",
    ob_btn_prev: "← Previous",
    ob_btn_next: "Next →",
    ob_btn_skip: "Skip setup",
    ob_btn_finish: "🚀 Save & Finish (Happy DL!)",
    ob_relaunch_title: "Initial setup wizard (Onboarding)",
    ob_relaunch_btn: "🚀 Relaunch wizard",
    ob_relaunch_hint: "Relaunches the step-by-step guide to review or edit all your settings.",
    ob_summary_title: "🎉 All set! Happy Downloading",
    ob_summary_desc: "Your PyRDT configuration is ready. Click below to apply your settings and start downloading.",
    ob_hint_step1: "Customize the appearance and visual comfort of PyRDT. You can change theme and language at any time.",
    ob_hint_step2: "Connect your Debrid account to debrid and download files at maximum speed.",
    ob_hint_step3: "Configure the paths where Rclone mounts the cloud drive and where PyRDT stores downloads and symlinks.",
    ob_hint_step4: "Configure categories for Sonarr, Radarr, etc. Choose Symlink mode (instant) or Real Download mode (disk copy).",
    ob_hint_step5: "Adjust automatic cleanup behavior and secure access to PyRDT.",
    ob_hint_step6: "Enable dead links monitoring in your media library and receive real-time Telegram alerts.",
    sec_reset: "Reset & Wizard Zone",
    title_reset_settings: "Delete all settings & Redisplay Onboarding",
    btn_reset_settings: "🗑️ Delete & Relaunch Onboarding",
    hint_reset_settings: "Resets all PyRDT settings back to factory defaults and redisplays the initial setup wizard.",
    confirm_reset_settings: "Are you sure you want to delete all settings, restore defaults, and restart the onboarding wizard?",
    opt_theme_dark: "🌙 Dark Mode",
    opt_theme_light: "☀️ Light Mode",
    opt_lang_fr: "🇫🇷 Français (French)",
    opt_lang_en: "🇬🇧 English",
    title_clean_options: "Cleanup Options:",
    title_auth_options: "Authentication (Optional):",
    title_medialib_surveillance: "Media Library & Radarr / Sonarr Monitoring:",
    title_webhook_info: "ℹ️ Sonarr / Radarr Webhook URL:",
    recap_provider_title: "🔑 Debrid Provider:",
    recap_dl_dir_title: "📁 Downloads Folder:",
    recap_services_title: "🎬 Configured *arr Services:",
    recap_tg_title: "🔔 Telegram Notifications:",
    ob_btn_finish_alt: "Happy DL! Launch PyRDT 🚀",
    ob_active: "Active",
    ob_disabled: "Disabled",
    ob_services_count: "{n} service(s)",
    ph_auth_empty: "Leave empty = no auth",
    ph_api_key: "API Key or Token",
    ph_speed_unlimited: "0 = unlimited",
    ph_scan_paths: "/mnt/virtual/Medias/Movies,/mnt/virtual/Medias/Series,...",
    tip_toggle_name: "Click to show / hide name",
    tip_scan_fast: "Fast incremental scan using cache",
    tip_scan_force: "Force complete reindexing of all folders",
    tip_close: "Close / Skip",
    scan_starting: "Starting scan...",
    missing_target: "Missing target",
    btn_purge: "🗑️ Purge",
    btn_retrigger_radarr: "🔍 Retrigger Radarr",
    btn_retrigger_sonarr: "🔍 Retrigger Sonarr",
    media_unknown: "❓ Unidentified",
    tag_symlinked: "🔗 Symlinked",
    tag_not_symlinked: "Not symlinked",
    tag_dead_api: "⚠️ Dead API",
    tag_kept_default: "(Kept by default)",
    meta_size: "Size:",
    meta_status: "Status:",
    msg_no_magnets: "No magnets found. Run a scan to refresh.",
    no_dead_to_delete: "No dead links to delete.",
    no_dead_arr: "No dead links associated with Radarr or Sonarr.",
    confirm_delete_magnet: "Delete this magnet on provider and purge its associated local links?\n\n{name}",
    confirm_delete_checked_mags: "Permanently delete {n} selected magnet(s) on provider and their local symlinks?",
    confirm_clean_duplicates: "Delete {n} unnecessary duplicates on provider?\n\nThe best file in each group will be kept intact.",
    confirm_clean_all_dead: "Delete all {n} dead links detected on disk?",
    confirm_delete_from_arr: "{n} of the dead links are associated with Radarr or Sonarr.\n\nDo you ALSO want to delete these media from your Radarr / Sonarr library?",
    confirm_research_dead: "Retrigger a search in {mediaType} and purge the local dead link?",
    confirm_research_all_dead: "Do you want to retrigger search in Radarr / Sonarr for the {n} detected media and purge dead links?",
    tip_brand_home: "Home (Queue)",
    tip_theme_toggle: "Toggle theme (Light / Dark)",
    ph_api_key_secret: "Your secret API key...",
    confirm_clean_single_dead: "Permanently delete this dead symbolic link on disk?",
    confirm_delete_media_arr: "This media is associated with {mediaType}{mediaTitle}.\n\nDo you ALSO want to delete this title from your {mediaType} library?",
    no_mags_selected: "No magnet selected.",
    no_dup_mags: "No provider duplicates detected to clean.",
    last_scan_prefix: "Last scan: ",
    btn_collapse_all: "↕️ Collapse all",
    btn_expand_all: "↕️ Expand all",
    btn_check_visible: "☑ Check visible",
    btn_uncheck_all: "☐ Uncheck all",
    scan_finished_success: "Scan completed successfully!",
    scan_interrupted_user: "Scan interrupted by user.",
    ph_chat_id: "Ex: 123456789 or -100123456789",
  }
};

const PROVIDER_METAS = {
  alldebrid: {
    name: "AllDebrid",
    api_base: "https://api.alldebrid.com/v4",
    key_label_fr: "Clé API AllDebrid",
    key_label_en: "AllDebrid API Key",
    key_hint_fr: "Clé générée sur AllDebrid > Apikeys",
    key_hint_en: "Key generated on AllDebrid > Apikeys",
  },
  realdebrid: {
    name: "Real-Debrid",
    api_base: "https://api.real-debrid.com/rest/1.0",
    key_label_fr: "Token API Real-Debrid",
    key_label_en: "Real-Debrid API Token",
    key_hint_fr: "Token secret disponible sur https://real-debrid.com/apitoken",
    key_hint_en: "Secret token available on https://real-debrid.com/apitoken",
  },
  premiumize: {
    name: "Premiumize.me",
    api_base: "https://www.premiumize.me/api",
    key_label_fr: "Clé API Premiumize",
    key_label_en: "Premiumize API Key",
    key_hint_fr: "Clé API disponible sur https://www.premiumize.me/account",
    key_hint_en: "API key available on https://www.premiumize.me/account",
  },
  debridlink: {
    name: "Debrid-Link",
    api_base: "https://debrid-link.com/api/v2",
    key_label_fr: "Clé API Debrid-Link",
    key_label_en: "Debrid-Link API Key",
    key_hint_fr: "Clé API disponible sur https://debrid-link.com/webapp/account",
    key_hint_en: "API key available on https://debrid-link.com/webapp/account",
  },
  torbox: {
    name: "TorBox",
    api_base: "https://api.torbox.app/v1/api",
    key_label_fr: "Clé API TorBox",
    key_label_en: "TorBox API Key",
    key_hint_fr: "Clé API disponible sur https://torbox.app/settings",
    key_hint_en: "API key available on https://torbox.app/settings",
  },
  highway: {
    name: "High-Way.me",
    api_base: "https://cloud.high-way.me/center-api",
    key_label_fr: "API Token High-Way",
    key_label_en: "High-Way API Token",
    key_hint_fr: "Token disponible dans votre espace Download Center > Sitzungen",
    key_hint_en: "Token available in your Download Center > Sitzungen",
  },
};

function onProviderChange(provId) {
  const meta = PROVIDER_METAS[provId] || PROVIDER_METAS['alldebrid'];
  const baseInput = document.getElementById('api_base_input');
  if (baseInput) {
    baseInput.value = meta.api_base;
  }
  const lblKey = document.getElementById('lbl-api-key');
  if (lblKey) {
    lblKey.textContent = currentLang === 'en' ? meta.key_label_en : meta.key_label_fr;
  }
  const hintKey = document.getElementById('hint-api-key');
  if (hintKey) {
    hintKey.textContent = currentLang === 'en' ? meta.key_hint_en : meta.key_hint_fr;
  }
  const testBtn = document.getElementById('btn-test-api');
  if (testBtn) {
    testBtn.textContent = (currentLang === 'en' ? 'Test API ' : "Tester l'API ") + meta.name;
  }
}

let currentTab = 'queue';
let currentLang = localStorage.getItem('pyrdt_lang') || 'fr';
let pendingDeleteHashes = [];
let modalOpen = false;
let isFetching = false;

function t(key, params = {}) {
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS['fr'];
  let text = dict[key] || TRANSLATIONS['fr'][key] || key;
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  }
  return text;
}

function setLanguage(lang) {
  if (lang !== 'fr' && lang !== 'en') lang = 'fr';
  currentLang = lang;
  localStorage.setItem('pyrdt_lang', lang);
  document.documentElement.lang = lang;

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  const hiddenLangInput = document.getElementById('ui_language');
  if (hiddenLangInput) hiddenLangInput.value = lang;
  const langSelect = document.getElementById('lang-select');
  if (langSelect) langSelect.value = lang;
  const obLangSelect = document.getElementById('ob_lang');
  if (obLangSelect) obLangSelect.value = lang;

  // Mise à jour de tous les éléments balisés avec data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    el.placeholder = t(key);
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.dataset.i18nTitle;
    el.title = t(key);
  });

  // Mettre à jour le texte du data-attribute pour le responsive
  const thFirst = document.querySelector('thead th:first-child');
  if (thFirst) thFirst.setAttribute('data-text-all', t('select_all'));

  const provSelect = document.getElementById('provider-select');
  if (provSelect) {
    onProviderChange(provSelect.value);
  }

  const themeBtn = document.getElementById('theme-btn');
  if (themeBtn) {
    themeBtn.title = currentTheme === 'light' ? t('tip_switch_dark') : t('tip_switch_light');
  }

  const brandEl = document.querySelector('.brand');
  if (brandEl) {
    brandEl.title = t('home_tip');
  }

  if (typeof scannerData !== 'undefined' && scannerData) {
    renderScannerView();
  }
  if (typeof updateObRecap === 'function') {
    updateObRecap();
  }

  updateSelection();
  updateLastDlDisplay();
  refreshQueue();
}

let currentTheme = document.documentElement.getAttribute('data-theme') || localStorage.getItem('pyrdt_theme') || 'dark';

function applyTheme(theme) {
  currentTheme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  try {
    localStorage.setItem('pyrdt_theme', currentTheme);
  } catch (e) {}
  const icon = document.getElementById('theme-icon');
  const btn = document.getElementById('theme-btn');
  if (icon) {
    icon.textContent = currentTheme === 'light' ? '🌙' : '☀️';
  }
  if (btn) {
    btn.title = currentTheme === 'light' ? t('tip_switch_dark') : t('tip_switch_light');
  }
  const sel = document.getElementById('theme-select');
  if (sel) {
    sel.value = currentTheme;
  }
  const obSel = document.getElementById('ob_theme');
  if (obSel) {
    obSel.value = currentTheme;
  }
  const hiddenInput = document.getElementById('ui_theme');
  if (hiddenInput) {
    hiddenInput.value = currentTheme;
  }
}

function toggleTheme() {
  applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showTab(tab) {
  const btnScanner = document.getElementById('btn-scanner');
  if (tab === 'scanner' && btnScanner && (btnScanner.style.display === 'none' || getComputedStyle(btnScanner).display === 'none')) {
    tab = 'queue';
  }
  currentTab = tab;
  document.getElementById('tab-queue').style.display = tab === 'queue' ? 'block' : 'none';
  const tabFinder = document.getElementById('tab-finder');
  if (tabFinder) tabFinder.style.display = tab === 'finder' ? 'block' : 'none';
  document.getElementById('tab-settings').style.display = tab === 'settings' ? 'block' : 'none';
  const tabScanner = document.getElementById('tab-scanner');
  if (tabScanner) tabScanner.style.display = tab === 'scanner' ? 'block' : 'none';

  document.getElementById('btn-queue').classList.toggle('active', tab === 'queue');
  const btnFinder = document.getElementById('btn-finder');
  if (btnFinder) btnFinder.classList.toggle('active', tab === 'finder');
  document.getElementById('btn-settings').classList.toggle('active', tab === 'settings');
  if (btnScanner) btnScanner.classList.toggle('active', tab === 'scanner');

  if (window.location.search) {
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) {}
  }

  if (tab === 'queue') refreshQueue();
  if (tab === 'finder') loadFinderSettings();
  if (tab === 'scanner') {
    loadScannerData();
    checkScannerStatusOnLoad();
  }
}

function goHome() {
  showTab('queue');
  if (window.location.search) {
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) {}
  }
}

function showSettingsPage(pageId) {
  const pages = ['alldebrid', 'storage', 'services', 'scanner', 'automation', 'security', 'appearance', 'notifications', 'system'];
  if (!pages.includes(pageId)) pageId = 'alldebrid';
  sessionStorage.setItem('pyrdt_settings_page', pageId);

  pages.forEach(p => {
    const pageEl = document.getElementById('setpage-' + p);
    if (pageEl) pageEl.style.display = p === pageId ? 'block' : 'none';
    const navBtn = document.getElementById('snav-' + p);
    if (navBtn) navBtn.classList.toggle('active', p === pageId);
  });

  const whEl = document.getElementById('webhook-url-display');
  if (whEl) whEl.textContent = window.location.origin + '/api/scanner/webhook';

  const tgChk = document.getElementById('telegram_enabled');
  if (tgChk) toggleTelegramOptions(tgChk.checked);

  const themeSel = document.getElementById('theme-select');
  if (themeSel) themeSel.value = currentTheme;

  const langSel = document.getElementById('lang-select');
  if (langSel) langSel.value = currentLang;
}

function addServiceRow(svcName = '', svcMode = 'download', svcSubpath = '') {
  const container = document.getElementById('services-list');
  const row = document.createElement('div');
  row.className = 'svc-row';
  const selSym = svcMode !== 'download' ? 'selected' : '';
  const selDl = svcMode === 'download' ? 'selected' : '';

  row.innerHTML = `
    <input type="text" name="service_names" value="${esc(svcName)}" placeholder="${esc(t('th_svc_cat'))}" oninput="if(!this.dataset.edited) this.parentElement.querySelector('[name=service_subpaths]').value = this.value" required>
    <select name="service_modes_list">
      <option value="symlink" ${selSym}>${esc(t('opt_mode_symlink'))}</option>
      <option value="download" ${selDl}>${esc(t('opt_mode_download'))}</option>
    </select>
    <input type="text" name="service_subpaths" value="${esc(svcSubpath)}" placeholder="${esc(t('th_svc_subpath'))}" oninput="this.dataset.edited='1'">
    <button type="button" class="btn-del" onclick="this.parentElement.remove()">${esc(t('btn_remove'))}</button>
  `;
  container.appendChild(row);
}

function addScanPathRow(path = '') {
  const container = document.getElementById('scan-paths-list');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'scan-path-row';
  row.innerHTML = `
    <input type="text" name="media_scan_paths" value="${esc(path)}" placeholder="${esc(t('ph_scan_path_single'))}" style="flex:1;" required>
    <button type="button" class="btn-del" onclick="this.parentElement.remove()" style="padding:7px 12px;" title="${esc(t('btn_remove'))}">✕</button>
  `;
  container.appendChild(row);
  const input = row.querySelector('input');
  if (input && !path) input.focus();
}

function updateHeaderStatus(items, apiHealth) {
  const orb = document.getElementById('status-orb');
  const sub = document.getElementById('api-sub');
  if (!orb || !sub) return;

  const activeStates = new Set(['downloading', 'checkingDL', 'copying']);
  const activeItems = (items || []).filter(t => activeStates.has(t.state));
  const activeDl = activeItems.filter(t => t.transfer_mode === 'download');
  const activeSym = activeItems.filter(t => t.transfer_mode !== 'download');

  const apiOk = Boolean(apiHealth && apiHealth.ok);
  const apiBaseLabel = (apiHealth && apiHealth.label) || (apiOk ? t('api_test_ok') : t('api_test_err'));
  const apiDetail = (apiHealth && apiHealth.detail) || '';

  orb.className = 'status-orb';
  sub.className = 'api-sub';
  orb.title = apiDetail;
  sub.title = apiDetail;

  if (activeDl.length > 0) {
    orb.classList.add('dl');
    sub.classList.add('dl');
    sub.textContent = t('status_dl', { n: activeDl.length }) + ' — ' + apiBaseLabel;
  } else if (activeSym.length > 0) {
    orb.classList.add('sym');
    sub.classList.add('sym');
    sub.textContent = t('status_sym', { n: activeSym.length }) + ' — ' + apiBaseLabel;
  } else if (apiOk) {
    orb.classList.add('ok');
    sub.classList.add('ok');
    sub.textContent = apiBaseLabel;
  } else {
    orb.classList.add('err');
    sub.classList.add('err');
    sub.textContent = apiBaseLabel;
  }
}

function getSelectedHashes() {
  return Array.from(document.querySelectorAll('.row-chk:checked')).map(c => c.value);
}

function updateSelection() {
  const selected = getSelectedHashes();
  const total = document.querySelectorAll('.row-chk').length;
  document.getElementById('sel-count').textContent = t('sel_count', { n: selected.length });
  document.getElementById('bulk-retry').disabled = selected.length === 0;
  document.getElementById('bulk-pause').disabled = selected.length === 0;
  document.getElementById('bulk-del').disabled = selected.length === 0;
  document.getElementById('chk-all').checked = total > 0 && selected.length === total;
}

function toggleAll(master) {
  document.querySelectorAll('.row-chk').forEach(c => c.checked = master.checked);
  updateSelection();
}

function copyId(txt) {
  if (navigator.clipboard) navigator.clipboard.writeText(txt);
}

function formatSpeed(bytesPerSec) {
  if (!bytesPerSec || bytesPerSec <= 0) return currentLang === 'en' ? '0 MB/s' : '0 Mo/s';
  const mbs = bytesPerSec / (1024 * 1024);
  const uMB = currentLang === 'en' ? 'MB/s' : 'Mo/s';
  const uKB = currentLang === 'en' ? 'KB/s' : 'Ko/s';
  if (mbs < 1) {
    const kbs = bytesPerSec / 1024;
    return kbs.toFixed(1) + ' ' + uKB;
  }
  return mbs.toFixed(2) + ' ' + uMB;
}

let lastDlNameRevealed = null;
let serverHideLastDlName = true;

function updateLastDlDisplay() {
  const isRevealed = lastDlNameRevealed !== null ? lastDlNameRevealed : !serverHideLastDlName;
  const infoEl = document.getElementById('last-dl-info-revealed');
  const iconEl = document.getElementById('last-dl-toggle-icon');
  const textEl = document.getElementById('last-dl-toggle-text');
  if (infoEl) infoEl.style.display = isRevealed ? 'inline-flex' : 'none';
  if (iconEl) iconEl.textContent = isRevealed ? '🙈' : '👁️';
  if (textEl) textEl.textContent = isRevealed ? t('lbl_hide_last_dl') : t('lbl_show_last_dl');
}

function toggleLastDlName() {
  const currentRevealed = lastDlNameRevealed !== null ? lastDlNameRevealed : !serverHideLastDlName;
  lastDlNameRevealed = !currentRevealed;
  updateLastDlDisplay();
}

function renderQueue(items) {
  const tbody = document.getElementById('queue-tbody');
  const checkedSet = new Set(getSelectedHashes());

  if (!items || items.length === 0) {
    tbody.innerHTML = `<tr><td colspan='6' style='color:#8b949e;text-align:center'>${esc(t('no_torrents'))}</td></tr>`;
    updateSelection();
    return;
  }

  tbody.innerHTML = items.map(item => {
    const pct = Math.round((Number(item.progress) || 0) * 100);
    const state = item.state || 'downloading';
    const isDl = item.transfer_mode === 'download';
    const isDdl = Boolean(item.is_ddl);
    const modeBadge = isDdl
      ? `<span class="tag dl" style="background:#8957e5;color:#fff;">${esc(t('tag_ddl') || 'DDL')}</span>`
      : (isDl
        ? `<span class="tag dl">${esc(t('tag_dl'))}</span>`
        : `<span class="tag sym">${esc(t('tag_sym'))}</span>`);

    let badgeCls = 'run';
    let stateTxt = `${esc(t('st_downloading'))} (${pct}%)`;

    if (state === 'pausedUP' || state === 'stalledUP') {
      badgeCls = 'ok';
      stateTxt = `${esc(t('st_completed'))} (${pct}%)`;
    } else if (state === 'pausedDL') {
      badgeCls = 'pause';
      stateTxt = `${esc(t('st_paused'))} (${pct}%)`;
    } else if (state === 'error') {
      badgeCls = 'err';
      stateTxt = `${esc(t('st_error'))} — ${esc(item.error_msg)}`;
    } else if (state === 'resolving') {
      badgeCls = 'run';
      stateTxt = `${esc(t('st_resolving') || 'Débridage AllDebrid...')}`;
    } else if (state === 'queued') {
      badgeCls = 'pause';
      stateTxt = `${esc(t('st_queued') || 'En attente (slot DL)')}`;
    } else if (state === 'checkingDL') {
      badgeCls = 'run';
      stateTxt = `${esc(t('st_rclone_wait'))} (${pct}%)`;
    } else if (state === 'copying') {
      badgeCls = 'run';
      stateTxt = `${esc(t('st_copying'))} (${pct}%)`;
      if (item.dlspeed && item.dlspeed > 0) {
        stateTxt += ` • ${formatSpeed(item.dlspeed)}`;
      }
    } else if (isDl && item.dlspeed && item.dlspeed > 0) {
      stateTxt += ` • ${formatSpeed(item.dlspeed)}`;
    }

    const fullId = esc(item.hash);
    const shortId = esc(String(item.hash).slice(0, 8));
    const adId = isDdl ? 'DDL' : esc(item.ad_id);
    const isChecked = checkedSet.has(item.hash) ? 'checked' : '';
    const pauseBtn = state === 'pausedDL'
      ? `<button class="btn-sec" onclick="batchAction('resume', ['${fullId}'])">${esc(t('btn_resume'))}</button>`
      : `<button class="btn-warn" onclick="batchAction('pause', ['${fullId}'])">${esc(t('btn_pause'))}</button>`;

    return `<tr>
      <td class="col-chk"><input type="checkbox" class="row-chk" value="${fullId}" ${isChecked} onchange="updateSelection()"></td>
      <td class="mono col-id"><div>#${adId}</div><small title="${fullId}" onclick="copyId('${fullId}')" style="cursor:pointer;color:#8b949e">${shortId} 📋</small></td>
      <td class="col-name">${esc(item.name)}<div style="color:#8b949e;font-size:11px;margin-top:2px;">${esc(item.save_path)}</div></td>
      <td class="col-cat"><span class="tag">${esc(item.category)}</span> ${modeBadge}</td>
      <td class="col-status">
        <span class="badge ${badgeCls}">${stateTxt}</span>
        <div class="pbar"><div class="pbar-fill ${badgeCls}" style="width:${pct}%"></div></div>
      </td>
      <td class="actions col-actions">
        <button class="btn-sec" onclick="batchAction('retry', ['${fullId}'])">${esc(t('btn_retry'))}</button>
        ${pauseBtn}
        <button class="btn-del" onclick="openDeleteModal(['${fullId}'])">${esc(t('btn_delete'))}</button>
      </td>
    </tr>`;
  }).join('');

  // Rendu dans le tableau dédié DDL
  const ddlTbody = document.getElementById('ddl-queue-tbody');
  if (ddlTbody) {
    const ddlItems = items.filter(it => it.is_ddl);
    if (ddlItems.length === 0) {
      ddlTbody.innerHTML = `<tr><td colspan='4' style='color:#8b949e;text-align:center;'>Aucun téléchargement DDL</td></tr>`;
    } else {
      ddlTbody.innerHTML = ddlItems.map(item => {
        const pct = Math.round((Number(item.progress) || 0) * 100);
        const state = item.state || 'downloading';
        let badgeCls = 'run';
        let stateTxt = `${esc(t('st_downloading'))} (${pct}%)`;

        if (state === 'pausedUP' || state === 'stalledUP') {
          badgeCls = 'ok';
          stateTxt = `${esc(t('st_completed'))} (${pct}%)`;
        } else if (state === 'pausedDL') {
          badgeCls = 'pause';
          stateTxt = `${esc(t('st_paused'))} (${pct}%)`;
        } else if (state === 'error') {
          badgeCls = 'err';
          stateTxt = `${esc(t('st_error'))} — ${esc(item.error_msg)}`;
        } else if (state === 'resolving') {
          badgeCls = 'run';
          stateTxt = `${esc(t('st_resolving') || 'Débridage AllDebrid...')}`;
        } else if (state === 'queued') {
          badgeCls = 'pause';
          stateTxt = `${esc(t('st_queued') || 'En attente (slot DL)')}`;
        } else if (state === 'copying' || item.dlspeed > 0) {
          badgeCls = 'run';
          stateTxt = `${esc(t('st_downloading'))} (${pct}%)`;
          if (item.dlspeed > 0) stateTxt += ` • ${formatSpeed(item.dlspeed)}`;
        }

        const fullId = esc(item.hash);
        const pauseBtn = state === 'pausedDL'
          ? `<button class="btn-sec" onclick="batchAction('resume', ['${fullId}'])">${esc(t('btn_resume'))}</button>`
          : `<button class="btn-warn" onclick="batchAction('pause', ['${fullId}'])">${esc(t('btn_pause'))}</button>`;

        return `<tr>
          <td class="col-name"><strong>${esc(item.name)}</strong><div style="color:#8b949e;font-size:11px;margin-top:2px;">${item.size > 0 ? formatSize(item.size) : ''}</div></td>
          <td class="col-cat"><span class="tag">${esc(item.category)}</span><div style="color:#8b949e;font-size:11px;margin-top:2px;">${esc(item.save_path)}</div></td>
          <td class="col-status">
            <span class="badge ${badgeCls}">${stateTxt}</span>
            <div class="pbar"><div class="pbar-fill ${badgeCls}" style="width:${pct}%"></div></div>
          </td>
          <td class="actions col-actions" style="text-align:right;">
            <button class="btn-sec" onclick="batchAction('retry', ['${fullId}'])">${esc(t('btn_retry'))}</button>
            ${pauseBtn}
            <button class="btn-del" onclick="openDeleteModal(['${fullId}'])">${esc(t('btn_delete'))}</button>
          </td>
        </tr>`;
      }).join('');
    }
  }

  updateSelection();
}

async function refreshQueue() {
  if (isFetching || modalOpen) return;
  isFetching = true;
  try {
    const res = await fetch('/api/ui/queue', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const items = data.items || [];
      updateHeaderStatus(items, data.api_health);
      if (currentTab === 'queue' || currentTab === 'ddl') {
        renderQueue(items);
      }
      const activeCountEl = document.getElementById('ddl-active-count-txt');
      if (activeCountEl && data.max_concurrent_downloads !== undefined) {
        const act = data.active_downloads_count || 0;
        const maxDl = data.max_concurrent_downloads || 3;
        activeCountEl.textContent = `Téléchargements simultanés actifs : ${act} / ${maxDl}`;
      }
      if (data.hide_last_download_name !== undefined) {
        serverHideLastDlName = Boolean(data.hide_last_download_name);
      }
      const lastStat = data.last_download_stat;
      const statBar = document.getElementById('last-download-stat-bar');
      if (statBar) {
        if (lastStat && lastStat.name && lastStat.avg_speed) {
          statBar.style.display = 'flex';
          const nameEl = document.getElementById('last-dl-name');
          const detailsEl = document.getElementById('last-dl-details');
          const speedEl = document.getElementById('last-dl-speed');
          if (nameEl) nameEl.textContent = lastStat.name;
          if (detailsEl) {
            const sizeStr = formatSize(lastStat.size || 0);
            const durStr = lastStat.duration ? `${lastStat.duration}s` : '';
            detailsEl.textContent = `(${sizeStr}${durStr ? (currentLang === 'en' ? ' in ' : ' en ') + durStr : ''})`;
          }
          if (speedEl) speedEl.textContent = formatSpeed(lastStat.avg_speed);
          updateLastDlDisplay();
        } else {
          statBar.style.display = 'none';
        }
      }
    }
  } catch (e) {
    updateHeaderStatus([], { ok: false, label: t('api_test_err'), detail: t('status_unreachable') });
  } finally {
    isFetching = false;
  }
}

async function batchAction(action, hashes) {
  if (!hashes.length) return;
  const fd = new FormData();
  fd.append('hashes', hashes.join('|'));
  await fetch('/api/v2/torrents/' + action, { method: 'POST', body: fd });
  await refreshQueue();
}

function batchSelected(action) {
  batchAction(action, getSelectedHashes());
}

function openDeleteModal(hashes) {
  if (!hashes.length) return;
  pendingDeleteHashes = hashes;
  modalOpen = true;
  document.getElementById('del-modal-desc').textContent = t('modal_desc', { n: hashes.length });
  document.getElementById('del-modal').style.display = 'flex';
}

function deleteSelected() {
  openDeleteModal(getSelectedHashes());
}

function closeDeleteModal() {
  modalOpen = false;
  pendingDeleteHashes = [];
  document.getElementById('del-modal').style.display = 'none';
}

async function confirmDelete() {
  if (!pendingDeleteHashes.length) return;
  const delFiles = document.getElementById('opt-del-files').checked ? 'true' : 'false';
  const delAd = document.getElementById('opt-del-ad').checked ? 'true' : 'false';
  const fd = new FormData();
  fd.append('hashes', pendingDeleteHashes.join('|'));
  fd.append('deleteFiles', delFiles);
  fd.append('deleteProvider', delAd);
  await fetch('/api/v2/torrents/delete', { method: 'POST', body: fd });
  closeDeleteModal();
  await refreshQueue();
}

let currentUploadTab = 'magnet';
let selectedTorrentFiles = [];

function openUploadModal(initialTab = 'magnet') {
  modalOpen = true;
  const modal = document.getElementById('upload-modal');
  if (!modal) return;

  const magnetInput = document.getElementById('upload-magnet-text');
  if (magnetInput) magnetInput.value = '';
  const fileInput = document.getElementById('upload-torrent-files');
  if (fileInput) fileInput.value = '';
  const ddlInput = document.getElementById('upload-ddl-text');
  if (ddlInput) ddlInput.value = '';
  const ddlPwd = document.getElementById('upload-ddl-password');
  if (ddlPwd) ddlPwd.value = '';
  selectedTorrentFiles = [];
  updateDropzoneFileList();

  const statusMsg = document.getElementById('upload-status-msg');
  if (statusMsg) {
    statusMsg.style.display = 'none';
    statusMsg.textContent = '';
    statusMsg.className = '';
  }

  const spinner = document.getElementById('upload-spinner');
  if (spinner) spinner.style.display = 'none';
  const submitBtn = document.getElementById('btn-submit-upload');
  if (submitBtn) submitBtn.disabled = false;
  const btnText = document.getElementById('upload-btn-text');
  if (btnText) btnText.textContent = t('btn_send_debrid');

  switchUploadTab(initialTab || 'magnet');
  onUploadCategoryChange();

  modal.style.display = 'flex';
}

function closeUploadModal() {
  modalOpen = false;
  const modal = document.getElementById('upload-modal');
  if (modal) modal.style.display = 'none';
}

function switchUploadTab(tab) {
  currentUploadTab = tab;
  const tabBtnMag = document.getElementById('tab-btn-magnet');
  const tabBtnFile = document.getElementById('tab-btn-file');
  const tabBtnDdl = document.getElementById('tab-btn-ddl');
  const secMag = document.getElementById('upload-sec-magnet');
  const secFile = document.getElementById('upload-sec-file');
  const secDdl = document.getElementById('upload-sec-ddl');

  if (tabBtnMag) tabBtnMag.classList.toggle('active', tab === 'magnet');
  if (tabBtnFile) tabBtnFile.classList.toggle('active', tab === 'file');
  if (tabBtnDdl) tabBtnDdl.classList.toggle('active', tab === 'ddl');

  if (secMag) secMag.style.display = tab === 'magnet' ? 'block' : 'none';
  if (secFile) secFile.style.display = tab === 'file' ? 'block' : 'none';
  if (secDdl) secDdl.style.display = tab === 'ddl' ? 'block' : 'none';

  const modeSel = document.getElementById('upload-transfer-mode');
  if (tab === 'ddl' && modeSel) {
    modeSel.value = 'download';
  }
}

function onUploadCategoryChange() {
  const catSel = document.getElementById('upload-category');
  const preview = document.getElementById('upload-dest-preview');
  if (!catSel || !preview) return;

  const opt = catSel.options[catSel.selectedIndex];
  if (!opt) return;

  const sub = opt.getAttribute('data-subpath') || opt.value;
  const mode = opt.getAttribute('data-mode') || 'download';
  const baseInput = document.getElementById('download_base_dir');
  const baseDir = (baseInput ? baseInput.value.trim() : '') || '/mnt/virtual/Medias/DL';
  const target = sub.startsWith('/') ? sub : `${baseDir.replace(/\/+$/, '')}/${sub}`;
  const modeTag = mode === 'download' ? `<span class="tag dl">${t('tag_dl')}</span>` : `<span class="tag sym">${t('tag_sym')}</span>`;

  preview.innerHTML = `<span style="font-weight:600;color:var(--text-bright);">${t('lbl_destination')}</span> <code>${esc(target)}</code> <span style="margin-left:6px;">${modeTag}</span>`;
}

function onTorrentFilesSelected(input) {
  if (input && input.files) {
    selectedTorrentFiles = Array.from(input.files);
    updateDropzoneFileList();
  }
}

function updateDropzoneFileList() {
  const listEl = document.getElementById('dropzone-file-list');
  const promptEl = document.getElementById('dropzone-text');
  if (!listEl) return;

  if (selectedTorrentFiles.length > 0) {
    if (promptEl) promptEl.style.display = 'none';
    listEl.innerHTML = `<div style="color:#58a6ff;margin-bottom:4px;">${t('dropzone_files_selected', { n: selectedTorrentFiles.length })}</div>` +
      selectedTorrentFiles.map(f => `<div>📄 ${esc(f.name)} <span style="color:var(--text-muted);font-weight:normal;">(${formatSize(f.size)})</span></div>`).join('');
  } else {
    if (promptEl) promptEl.style.display = 'block';
    listEl.innerHTML = '';
  }
}

async function submitTorrentUpload() {
  const statusMsg = document.getElementById('upload-status-msg');
  const submitBtn = document.getElementById('btn-submit-upload');
  const spinner = document.getElementById('upload-spinner');
  const btnText = document.getElementById('upload-btn-text');

  const catSel = document.getElementById('upload-category');
  const modeSel = document.getElementById('upload-transfer-mode');
  const magnetInput = document.getElementById('upload-magnet-text');
  const ddlInput = document.getElementById('upload-ddl-text');
  const ddlPwd = document.getElementById('upload-ddl-password');

  const category = catSel ? catSel.value : 'torrent-direct';
  const transferMode = modeSel ? modeSel.value : 'auto';
  const magnetVal = magnetInput ? magnetInput.value.trim() : '';
  const ddlVal = ddlInput ? ddlInput.value.trim() : '';

  if (currentUploadTab === 'magnet' && !magnetVal) {
    if (statusMsg) {
      statusMsg.className = 'upload-msg-error';
      statusMsg.textContent = t('err_no_input');
      statusMsg.style.display = 'block';
    }
    return;
  }

  if (currentUploadTab === 'file' && (!selectedTorrentFiles || selectedTorrentFiles.length === 0)) {
    if (statusMsg) {
      statusMsg.className = 'upload-msg-error';
      statusMsg.textContent = t('err_no_input');
      statusMsg.style.display = 'block';
    }
    return;
  }

  if (currentUploadTab === 'ddl' && !ddlVal) {
    if (statusMsg) {
      statusMsg.className = 'upload-msg-error';
      statusMsg.textContent = 'Veuillez saisir au moins un lien direct à débrider.';
      statusMsg.style.display = 'block';
    }
    return;
  }

  const fd = new FormData();
  fd.append('category', category);
  fd.append('transfer_mode', transferMode);

  if (currentUploadTab === 'magnet') {
    fd.append('magnet', magnetVal);
  } else if (currentUploadTab === 'file') {
    for (const file of selectedTorrentFiles) {
      fd.append('torrent_files', file, file.name);
    }
  } else if (currentUploadTab === 'ddl') {
    fd.append('ddl_links', ddlVal);
    if (ddlPwd && ddlPwd.value.trim()) fd.append('ddl_password', ddlPwd.value.trim());
  }

  if (submitBtn) submitBtn.disabled = true;
  if (spinner) spinner.style.display = 'inline-block';
  if (btnText) btnText.textContent = t('upload_sending');
  if (statusMsg) {
    statusMsg.style.display = 'none';
    statusMsg.textContent = '';
  }

  try {
    const res = await fetch('/api/torrents/upload', {
      method: 'POST',
      body: fd,
    });
    const data = await res.json();
    if (res.ok && (data.status === 'success' || data.status === 'ok')) {
      closeUploadModal();
      await refreshQueue();
    } else {
      const err = data.message || data.detail || t('err_upload_failed');
      if (statusMsg) {
        statusMsg.className = 'upload-msg-error';
        statusMsg.textContent = err;
        statusMsg.style.display = 'block';
      }
    }
  } catch (err) {
    if (statusMsg) {
      statusMsg.className = 'upload-msg-error';
      statusMsg.textContent = `${t('err_upload_failed')} (${err.message || err})`;
      statusMsg.style.display = 'block';
    }
  } finally {
    if (submitBtn) submitBtn.disabled = false;
    if (spinner) spinner.style.display = 'none';
    if (btnText) btnText.textContent = t('btn_send_debrid');
  }
}

async function submitDdlPageUpload() {
  const linksEl = document.getElementById('ddl-page-links');
  const pwdEl = document.getElementById('ddl-page-password');
  const catEl = document.getElementById('ddl-page-category');
  const statusEl = document.getElementById('ddl-page-status-msg');
  const btnEl = document.getElementById('btn-submit-ddl-page');
  const spinnerEl = document.getElementById('ddl-page-spinner');

  const linksVal = linksEl ? linksEl.value.trim() : '';
  if (!linksVal) {
    if (statusEl) {
      statusEl.className = 'upload-msg-error';
      statusEl.textContent = 'Veuillez saisir au moins un lien direct à débrider.';
      statusEl.style.display = 'block';
    }
    return;
  }

  const fd = new FormData();
  fd.append('links', linksVal);
  if (pwdEl && pwdEl.value.trim()) fd.append('password', pwdEl.value.trim());
  if (catEl) fd.append('category', catEl.value);

  if (btnEl) btnEl.disabled = true;
  if (spinnerEl) spinnerEl.style.display = 'inline-block';
  if (statusEl) statusEl.style.display = 'none';

  try {
    const res = await fetch('/api/ddl/upload', {
      method: 'POST',
      body: fd,
    });
    const data = await res.json();
    if (res.ok && data.status === 'ok') {
      if (statusEl) {
        statusEl.className = 'upload-msg-success';
        statusEl.textContent = data.message || `${data.added} lien(s) DDL ajouté(s) !`;
        statusEl.style.display = 'block';
      }
      if (linksEl) linksEl.value = '';
      if (pwdEl) pwdEl.value = '';
      await refreshQueue();
    } else {
      if (statusEl) {
        statusEl.className = 'upload-msg-error';
        statusEl.textContent = data.message || 'Erreur lors de l\'ajout des liens DDL.';
        statusEl.style.display = 'block';
      }
    }
  } catch (err) {
    if (statusEl) {
      statusEl.className = 'upload-msg-error';
      statusEl.textContent = 'Erreur réseau : ' + err.message;
      statusEl.style.display = 'block';
    }
  } finally {
    if (btnEl) btnEl.disabled = false;
    if (spinnerEl) spinnerEl.style.display = 'none';
  }
}

async function testApi() {
  const btn = document.getElementById('btn-test-api');
  const box = document.getElementById('test-result');
  btn.disabled = true;
  btn.textContent = t('testing_api');
  box.className = 'test-box';
  try {
    const fd = new FormData(document.getElementById('settings-form'));
    const res = await fetch('/api/test', { method: 'POST', body: fd });
    const data = await res.json();
    box.textContent = data.message;
    box.className = 'test-box ' + (data.ok ? 'ok' : 'err');
    await refreshQueue();
  } catch (e) {
    box.textContent = t('status_unreachable') + ' : ' + e;
    box.className = 'test-box err';
  } finally {
    btn.disabled = false;
    const provSelect = document.getElementById('provider-select');
    const pId = provSelect ? provSelect.value : 'alldebrid';
    const meta = PROVIDER_METAS[pId] || PROVIDER_METAS['alldebrid'];
    btn.textContent = (currentLang === 'en' ? 'Test API ' : "Tester l'API ") + meta.name;
  }
}

async function purgeCompleted() {
  const res = await fetch('/api/v2/torrents/info', { cache: 'no-store' });
  const list = await res.json();
  const done = list.filter(t => t.state === 'pausedUP' || t.state === 'stalledUP').map(t => t.hash);
  if (!done.length) return;
  const fd = new FormData();
  fd.append('hashes', done.join('|'));
  fd.append('deleteFiles', 'false');
  fd.append('deleteProvider', 'false');
  await fetch('/api/v2/torrents/delete', { method: 'POST', body: fd });
  await refreshQueue();
}

function toggleTelegramOptions(enabled) {
  const container = document.getElementById('tg-details-container');
  if (container) {
    container.style.opacity = enabled ? '1' : '0.4';
    container.style.pointerEvents = enabled ? 'auto' : 'none';
  }
}

async function testTelegramNotification() {
  const btn = document.getElementById('btn-test-tg');
  const box = document.getElementById('tg-test-result');
  const botToken = (document.getElementById('telegram_bot_token')?.value || '').trim();
  const chatId = (document.getElementById('telegram_chat_id')?.value || '').trim();

  if (!botToken || !chatId) {
    if (box) {
      box.style.display = 'block';
      box.style.background = 'rgba(248, 81, 73, 0.15)';
      box.style.color = '#f85149';
      box.style.border = '1px solid rgba(248, 81, 73, 0.4)';
      box.textContent = currentLang === 'en' ? 'Please fill in Bot Token and Chat ID.' : 'Veuillez renseigner le Token du Bot et le Chat ID.';
    }
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = t('testing_tg');
  }
  if (box) box.style.display = 'none';

  try {
    const fd = new FormData();
    fd.append('bot_token', botToken);
    fd.append('chat_id', chatId);
    const res = await fetch('/api/settings/test-telegram', { method: 'POST', body: fd });
    const data = await res.json();
    if (box) {
      box.style.display = 'block';
      if (data.ok) {
        box.style.background = 'rgba(63, 185, 80, 0.15)';
        box.style.color = '#3fb950';
        box.style.border = '1px solid rgba(63, 185, 80, 0.4)';
        box.textContent = data.message || t('tg_test_ok');
      } else {
        box.style.background = 'rgba(248, 81, 73, 0.15)';
        box.style.color = '#f85149';
        box.style.border = '1px solid rgba(248, 81, 73, 0.4)';
        box.textContent = data.error || t('tg_test_err');
      }
    }
  } catch (err) {
    if (box) {
      box.style.display = 'block';
      box.style.background = 'rgba(248, 81, 73, 0.15)';
      box.style.color = '#f85149';
      box.style.border = '1px solid rgba(248, 81, 73, 0.4)';
      box.textContent = t('tg_test_err') + ' : ' + err;
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = t('btn_test_tg');
    }
  }
}

// ==========================================
// ASSISTANT ONBOARDING (PREMIER LANCEMENT)
// ==========================================
let currentObStep = 1;

function openOnboarding(force = false) {
  const modal = document.getElementById('onboarding-modal');
  if (!modal) return;

  const getVal = (name, fallback = '') => {
    const el = document.querySelector(`[name="${name}"]`);
    return el ? el.value : fallback;
  };
  const getChk = (id) => {
    const el = document.getElementById(id);
    return el ? el.checked : false;
  };

  // Step 1: Styles & Affichage
  const obTheme = document.getElementById('ob_theme');
  if (obTheme) obTheme.value = currentTheme;
  const obLang = document.getElementById('ob_lang');
  if (obLang) obLang.value = currentLang;
  const obHideDl = document.getElementById('ob_hide_last_download_name');
  if (obHideDl) obHideDl.checked = getChk('hide_last_download_name');
  const obScanner = document.getElementById('ob_enable_scanner');
  if (obScanner) obScanner.checked = getChk('chk_enable_scanner');

  // Step 2: Fournisseur
  const provEl = document.getElementById('provider-select');
  const obProv = document.getElementById('ob_provider');
  if (obProv && provEl) {
    obProv.value = provEl.value || 'alldebrid';
    onObProviderChange(obProv.value);
  }
  const obApiKey = document.getElementById('ob_api_key');
  if (obApiKey) obApiKey.value = getVal('api_key');
  const obAgent = document.getElementById('ob_agent');
  if (obAgent) obAgent.value = getVal('agent', 'PyRDT-Billou');
  const obApiBase = document.getElementById('ob_api_base');
  if (obApiBase) obApiBase.value = getVal('api_base');

  // Step 3: Stockage
  const obRclone = document.getElementById('ob_rclone_mount_dir');
  if (obRclone) obRclone.value = getVal('rclone_mount_dir', '/mnt/alldebrid/magnets');
  const obDl = document.getElementById('ob_download_base_dir');
  if (obDl) obDl.value = getVal('download_base_dir', '/mnt/virtual/Medias/DL');
  const obMountTimeout = document.getElementById('ob_mount_timeout');
  if (obMountTimeout) obMountTimeout.value = getVal('mount_timeout', '60');
  const obSpeedLimit = document.getElementById('ob_download_speed_limit');
  if (obSpeedLimit) obSpeedLimit.value = getVal('download_speed_limit', '0');
  const obConcurrent = document.getElementById('ob_max_concurrent_downloads');
  if (obConcurrent) obConcurrent.value = getVal('max_concurrent_downloads', '3');
  const obPoll = document.getElementById('ob_poll_interval');
  if (obPoll) obPoll.value = getVal('poll_interval', '3.0');
  const obExts = document.getElementById('ob_allowed_exts');
  if (obExts) obExts.value = getVal('allowed_exts', '.mkv,.mp4,.avi,.mov,.wmv,.m4v,.ts,.webm,.srt,.ass,.ssa,.sub,.vtt');

  // Step 4: Services
  const obSvcContainer = document.getElementById('ob-services-list');
  if (obSvcContainer) {
    obSvcContainer.innerHTML = '';
    const mainRows = document.querySelectorAll('#services-list .svc-row');
    if (mainRows.length > 0) {
      mainRows.forEach(row => {
        const nameInput = row.querySelector('[name="service_names"]');
        const modeSelect = row.querySelector('[name="service_modes_list"]');
        const subInput = row.querySelector('[name="service_subpaths"]');
        addObServiceRow(
          nameInput ? nameInput.value : '',
          modeSelect ? modeSelect.value : 'download',
          subInput ? subInput.value : ''
        );
      });
    } else {
      addObServiceRow('tv-sonarr', 'symlink', 'tv-sonarr');
      addObServiceRow('radarr', 'symlink', 'radarr');
      addObServiceRow('tv-whisparr', 'download', 'tv-whisparr');
      addObServiceRow('torrent-direct', 'download', 'Torrent-Direct');
    }
  }

  // Step 5: Automatisation & Sécurité
  const obDelDl = document.getElementById('ob_del_dl_done');
  if (obDelDl) obDelDl.checked = getChk('del_dl_done');
  const obAutoClean = document.getElementById('ob_auto_clean');
  if (obAutoClean) obAutoClean.checked = getChk('auto_clean');
  const obDelProv = document.getElementById('ob_del_prov');
  if (obDelProv) obDelProv.checked = getChk('del_prov');
  const obUser = document.getElementById('ob_username');
  if (obUser) obUser.value = getVal('username');
  const obPass = document.getElementById('ob_password');
  if (obPass) obPass.value = getVal('password');

  // Step 6: Médiathèque & Notifications
  const obScanList = document.getElementById('ob-scan-paths-list');
  if (obScanList) {
    obScanList.innerHTML = '';
    const mainPaths = Array.from(document.querySelectorAll('#scan-paths-list input[name="media_scan_paths"]')).map(i => i.value.trim()).filter(Boolean);
    if (mainPaths.length > 0) {
      mainPaths.forEach(p => addObScanPathRow(p));
    } else {
      addObScanPathRow('/mnt/virtual/Medias/Films');
      addObScanPathRow('/mnt/virtual/Medias/Series');
    }
  }
  const obRadarrUrl = document.getElementById('ob_radarr_url');
  if (obRadarrUrl) obRadarrUrl.value = getVal('radarr_url', 'http://127.0.0.1:7878');
  const obRadarrKey = document.getElementById('ob_radarr_api_key');
  if (obRadarrKey) obRadarrKey.value = getVal('radarr_api_key');
  const obSonarrUrl = document.getElementById('ob_sonarr_url');
  if (obSonarrUrl) obSonarrUrl.value = getVal('sonarr_url', 'http://127.0.0.1:8989');
  const obSonarrKey = document.getElementById('ob_sonarr_api_key');
  if (obSonarrKey) obSonarrKey.value = getVal('sonarr_api_key');

  const obTgEnabled = document.getElementById('ob_telegram_enabled');
  if (obTgEnabled) {
    obTgEnabled.checked = getChk('telegram_enabled');
    toggleObTelegramOptions(obTgEnabled.checked);
  }
  const obTgBot = document.getElementById('ob_telegram_bot_token');
  if (obTgBot) obTgBot.value = getVal('telegram_bot_token');
  const obTgChat = document.getElementById('ob_telegram_chat_id');
  if (obTgChat) obTgChat.value = getVal('telegram_chat_id');

  showObStep(1);
  modal.style.display = 'flex';
}

function closeOnboarding() {
  const modal = document.getElementById('onboarding-modal');
  if (modal) modal.style.display = 'none';
}

function showObStep(step) {
  if (step < 1) step = 1;
  if (step > 7) step = 7;
  currentObStep = step;

  // Pages
  for (let i = 1; i <= 7; i++) {
    const page = document.getElementById(`ob-page-${i}`);
    if (page) page.classList.toggle('active', i === step);
    const navBtn = document.getElementById(`ob-nav-${i}`);
    if (navBtn) {
      navBtn.classList.toggle('active', i === step);
      navBtn.classList.toggle('completed', i < step);
    }
  }

  // Progress bar
  const progressBar = document.getElementById('ob-progress-bar');
  if (progressBar) {
    progressBar.style.width = ((step / 7) * 100) + '%';
  }

  // Buttons
  const btnPrev = document.getElementById('ob-btn-prev');
  if (btnPrev) btnPrev.style.display = step > 1 ? 'inline-block' : 'none';

  const btnNext = document.getElementById('ob-btn-next');
  if (btnNext) btnNext.style.display = step < 7 ? 'inline-block' : 'none';

  const btnFinish = document.getElementById('ob-btn-finish');
  if (btnFinish) btnFinish.style.display = step === 7 ? 'inline-block' : 'none';

  if (step === 7) {
    updateObRecap();
  }
}

function nextObStep() {
  showObStep(currentObStep + 1);
}

function prevObStep() {
  showObStep(currentObStep - 1);
}

function onObProviderChange(pId) {
  const meta = PROVIDER_METAS[pId] || PROVIDER_METAS['alldebrid'];
  const lbl = document.getElementById('ob-key-label');
  const hint = document.getElementById('ob-key-hint');
  const baseInput = document.getElementById('ob_api_base');
  const btnTest = document.getElementById('ob-btn-test-api');

  if (lbl) lbl.textContent = currentLang === 'en' ? meta.key_label_en : meta.key_label_fr;
  if (hint) hint.textContent = currentLang === 'en' ? meta.key_hint_en : meta.key_hint_fr;
  if (baseInput) baseInput.value = meta.api_base;
  if (btnTest) btnTest.textContent = (currentLang === 'en' ? 'Test API ' : "Tester l'API ") + meta.name;
}

function addObServiceRow(svcName = '', svcMode = 'download', svcSubpath = '') {
  const container = document.getElementById('ob-services-list');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'svc-row';
  const selSym = svcMode !== 'download' ? 'selected' : '';
  const selDl = svcMode === 'download' ? 'selected' : '';

  row.innerHTML = `
    <input type="text" class="ob-svc-name" value="${esc(svcName)}" placeholder="${esc(t('th_svc_cat'))}" oninput="if(!this.dataset.edited) this.parentElement.querySelector('.ob-svc-sub').value = this.value" required>
    <select class="ob-svc-mode">
      <option value="symlink" ${selSym}>${esc(t('opt_mode_symlink'))}</option>
      <option value="download" ${selDl}>${esc(t('opt_mode_download'))}</option>
    </select>
    <input type="text" class="ob-svc-sub" value="${esc(svcSubpath || svcName)}" placeholder="${esc(t('th_svc_subpath'))}" oninput="this.dataset.edited=true">
    <button type="button" class="btn-del" onclick="this.parentElement.remove()" style="padding:6px 10px;" title="${esc(t('btn_remove'))}">✕</button>
  `;
  container.appendChild(row);
}

function addObScanPathRow(path = '') {
  const container = document.getElementById('ob-scan-paths-list');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'scan-path-row';
  row.innerHTML = `
    <input type="text" class="ob-scan-path-val" value="${esc(path)}" placeholder="${esc(t('ph_scan_path_single'))}" style="flex:1;" required>
    <button type="button" class="btn-del" onclick="this.parentElement.remove()" style="padding:7px 12px;" title="${esc(t('btn_remove'))}">✕</button>
  `;
  container.appendChild(row);
  const input = row.querySelector('input');
  if (input && !path) input.focus();
}

function toggleObTelegramOptions(enabled) {
  const details = document.getElementById('ob-tg-details');
  if (details) {
    details.style.opacity = enabled ? '1' : '0.4';
    details.style.pointerEvents = enabled ? 'auto' : 'none';
  }
}

async function testObApi() {
  const btn = document.getElementById('ob-btn-test-api');
  const box = document.getElementById('ob-test-result');
  if (btn) {
    btn.disabled = true;
    btn.textContent = t('testing_api');
  }
  if (box) box.style.display = 'none';

  try {
    const fd = new FormData();
    fd.append('provider', document.getElementById('ob_provider').value);
    fd.append('api_key', document.getElementById('ob_api_key').value);
    fd.append('api_base', document.getElementById('ob_api_base').value);
    fd.append('agent', document.getElementById('ob_agent').value);
    fd.append('rclone_mount_dir', document.getElementById('ob_rclone_mount_dir').value);

    const res = await fetch('/api/test', { method: 'POST', body: fd });
    const data = await res.json();
    if (box) {
      box.style.display = 'inline-block';
      box.textContent = data.message;
      box.className = 'test-box ' + (data.ok ? 'ok' : 'err');
    }
  } catch (e) {
    if (box) {
      box.style.display = 'inline-block';
      box.textContent = t('status_unreachable') + ' : ' + e;
      box.className = 'test-box err';
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      const pId = document.getElementById('ob_provider').value;
      const meta = PROVIDER_METAS[pId] || PROVIDER_METAS['alldebrid'];
      btn.textContent = (currentLang === 'en' ? 'Test API ' : "Tester l'API ") + meta.name;
    }
  }
}

async function testObTelegram() {
  const btn = document.getElementById('ob-btn-test-tg');
  const box = document.getElementById('ob-tg-test-result');
  const botToken = document.getElementById('ob_telegram_bot_token').value.trim();
  const chatId = document.getElementById('ob_telegram_chat_id').value.trim();

  if (!botToken || !chatId) {
    if (box) {
      box.style.display = 'inline-block';
      box.className = 'test-box err';
      box.textContent = currentLang === 'en' ? 'Please fill in Bot Token and Chat ID.' : 'Veuillez renseigner le Token et le Chat ID.';
    }
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = t('testing_tg');
  }
  if (box) box.style.display = 'none';

  try {
    const fd = new FormData();
    fd.append('bot_token', botToken);
    fd.append('chat_id', chatId);
    const res = await fetch('/api/settings/test-telegram', { method: 'POST', body: fd });
    const data = await res.json();
    if (box) {
      box.style.display = 'inline-block';
      box.className = 'test-box ' + (data.ok ? 'ok' : 'err');
      box.textContent = data.ok ? (data.message || t('tg_test_ok')) : (data.error || t('tg_test_err'));
    }
  } catch (err) {
    if (box) {
      box.style.display = 'inline-block';
      box.className = 'test-box err';
      box.textContent = t('tg_test_err') + ' : ' + err;
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = t('btn_test_tg');
    }
  }
}

function updateObRecap() {
  const pId = document.getElementById('ob_provider').value;
  const meta = PROVIDER_METAS[pId] || PROVIDER_METAS['alldebrid'];
  const recapProv = document.getElementById('ob-recap-provider');
  if (recapProv) recapProv.textContent = meta.name;

  const recapDl = document.getElementById('ob-recap-dl-dir');
  if (recapDl) recapDl.textContent = document.getElementById('ob_download_base_dir').value || '/mnt/virtual/Medias/DL';

  const svcsCount = document.querySelectorAll('#ob-services-list .svc-row').length;
  const recapSvc = document.getElementById('ob-recap-services');
  if (recapSvc) recapSvc.textContent = t('ob_services_count', { n: svcsCount });

  const tgOn = document.getElementById('ob_telegram_enabled').checked;
  const recapTg = document.getElementById('ob-recap-tg');
  if (recapTg) {
    recapTg.textContent = tgOn ? t('ob_active') : t('ob_disabled');
    recapTg.style.color = tgOn ? '#3fb950' : 'var(--text-muted)';
  }
}

async function skipOnboarding() {
  closeOnboarding();
  try {
    localStorage.setItem('pyrdt_onboarding_completed', 'true');
  } catch (e) {}
  fetch('/api/settings/onboarding-complete', { method: 'POST' });
}

function finishOnboarding() {
  const setVal = (name, val) => {
    const el = document.querySelector(`[name="${name}"]`);
    if (el) el.value = val;
  };
  const setChk = (id, checked) => {
    const el = document.getElementById(id);
    if (el) el.checked = checked;
  };

  applyTheme(document.getElementById('ob_theme').value);
  setLanguage(document.getElementById('ob_lang').value);
  setChk('hide_last_download_name', document.getElementById('ob_hide_last_download_name').checked);
  setChk('chk_enable_scanner', document.getElementById('ob_enable_scanner').checked);

  const provSelect = document.getElementById('provider-select');
  if (provSelect) {
    provSelect.value = document.getElementById('ob_provider').value;
    onProviderChange(provSelect.value);
  }
  setVal('api_key', document.getElementById('ob_api_key').value);
  setVal('agent', document.getElementById('ob_agent').value);
  setVal('api_base', document.getElementById('ob_api_base').value);

  setVal('rclone_mount_dir', document.getElementById('ob_rclone_mount_dir').value);
  setVal('download_base_dir', document.getElementById('ob_download_base_dir').value);
  setVal('mount_timeout', document.getElementById('ob_mount_timeout').value);
  setVal('download_speed_limit', document.getElementById('ob_download_speed_limit').value);
  const obConcurrentEl = document.getElementById('ob_max_concurrent_downloads');
  if (obConcurrentEl) setVal('max_concurrent_downloads', obConcurrentEl.value);
  setVal('poll_interval', document.getElementById('ob_poll_interval').value);
  setVal('allowed_exts', document.getElementById('ob_allowed_exts').value);

  const mainSvcContainer = document.getElementById('services-list');
  if (mainSvcContainer) {
    mainSvcContainer.innerHTML = '';
    const obRows = document.querySelectorAll('#ob-services-list .svc-row');
    obRows.forEach(r => {
      const name = r.querySelector('.ob-svc-name').value;
      const mode = r.querySelector('.ob-svc-mode').value;
      const sub = r.querySelector('.ob-svc-sub').value;
      addServiceRow(name, mode, sub);
    });
  }

  setChk('del_dl_done', document.getElementById('ob_del_dl_done').checked);
  setChk('auto_clean', document.getElementById('ob_auto_clean').checked);
  setChk('del_prov', document.getElementById('ob_del_prov').checked);
  setVal('username', document.getElementById('ob_username').value);
  setVal('password', document.getElementById('ob_password').value);

  const mainScanContainer = document.getElementById('scan-paths-list');
  if (mainScanContainer) {
    mainScanContainer.innerHTML = '';
    const obPaths = Array.from(document.querySelectorAll('#ob-scan-paths-list .ob-scan-path-val')).map(i => i.value.trim()).filter(Boolean);
    if (obPaths.length > 0) {
      obPaths.forEach(p => addScanPathRow(p));
    } else {
      addScanPathRow('/mnt/virtual/Medias/Films');
      addScanPathRow('/mnt/virtual/Medias/Series');
    }
  }
  setVal('radarr_url', document.getElementById('ob_radarr_url').value);
  setVal('radarr_api_key', document.getElementById('ob_radarr_api_key').value);
  setVal('sonarr_url', document.getElementById('ob_sonarr_url').value);
  setVal('sonarr_api_key', document.getElementById('ob_sonarr_api_key').value);

  const tgOn = document.getElementById('ob_telegram_enabled').checked;
  setChk('telegram_enabled', tgOn);
  toggleTelegramOptions(tgOn);
  setVal('telegram_bot_token', document.getElementById('ob_telegram_bot_token').value);
  setVal('telegram_chat_id', document.getElementById('ob_telegram_chat_id').value);

  const obCompletedInput = document.getElementById('onboarding_completed');
  if (obCompletedInput) obCompletedInput.value = 'on';

  try {
    localStorage.setItem('pyrdt_onboarding_completed', 'true');
  } catch (e) {}

  closeOnboarding();

  const form = document.getElementById('settings-form');
  if (form) form.submit();
}

async function resetSettingsAndRelaunchOnboarding() {
  const confirmMsg = t('confirm_reset_settings');
  if (!confirm(confirmMsg)) return;

  try {
    const res = await fetch('/api/settings/reset', { method: 'POST' });
    const data = await res.json();
    if (data.ok) {
      try {
        localStorage.removeItem('pyrdt_onboarding_completed');
      } catch (e) {}
      window.location.href = '/?onboarding=1';
    } else {
      alert((currentLang === 'en' ? 'Error: ' : 'Erreur : ') + (data.error || data.message || (currentLang === 'en' ? 'Unable to reset' : 'Impossible de réinitialiser')));
    }
  } catch (e) {
    alert((currentLang === 'en' ? 'Network error: ' : 'Erreur réseau : ') + e);
  }
}

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
  const serverLang = document.documentElement.lang || localStorage.getItem('pyrdt_lang') || 'fr';
  setLanguage(serverLang);

  const serverTheme = document.documentElement.getAttribute('data-theme') || localStorage.getItem('pyrdt_theme') || 'dark';
  applyTheme(serverTheme);

  const urlParams = new URLSearchParams(window.location.search);
  const activeSubPage = sessionStorage.getItem('pyrdt_settings_page') || 'alldebrid';
  showSettingsPage(activeSubPage);

  if (urlParams.has('saved')) {
    showTab('settings');
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) {}

    const alertEl = document.querySelector('.alert');
    if (alertEl) {
      setTimeout(() => {
        alertEl.style.transition = 'opacity 0.6s ease';
        alertEl.style.opacity = '0';
        setTimeout(() => {
          alertEl.style.display = 'none';
        }, 600);
      }, 4000);
    }
  }

  const autoOb = (document.body.dataset.onboardingAuto === 'true' && !localStorage.getItem('pyrdt_onboarding_completed')) || urlParams.has('onboarding');
  if (autoOb && !urlParams.has('saved')) {
    openOnboarding(false);
    if (urlParams.has('onboarding')) {
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {}
    }
  }

  const dropzone = document.getElementById('torrent-dropzone');
  if (dropzone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      });
    });
    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      });
    });
    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length > 0) {
        selectedTorrentFiles = Array.from(dt.files).filter(f => f.name.endsWith('.torrent') || f.size > 0);
        updateDropzoneFileList();
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOpen) {
      closeUploadModal();
      closeDeleteModal();
    }
  });

  const finderQueryInput = document.getElementById('finder_query');
  if (finderQueryInput) {
    finderQueryInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        runFinderSearch();
      }
    });
  }

  setInterval(refreshQueue, 2000);
  setInterval(() => {
    if (currentTab === 'scanner') {
      checkScannerStatusOnLoad();
    }
  }, 4000);
});

// ==========================================
// SCANNER & GESTIONNAIRE DE LIENS MORTS
// ==========================================
let scannerData = null;
let currentMagnetsFilter = 'all';
let isScanning = false;
let allMagnetsExpanded = false;
let scannerPollTimer = null;

function setScanButtonScanning(scanning, percent = 0, stage = '') {
  const btn = document.getElementById('btn-start-scan');
  const btnForce = document.getElementById('btn-force-scan');
  const btnStop = document.getElementById('btn-stop-scan');
  const spinner = document.getElementById('scan-btn-spinner');
  const text = document.getElementById('scan-btn-text');
  const progContainer = document.getElementById('scanner-progress-container');
  const progStage = document.getElementById('scanner-progress-stage');
  const progPercent = document.getElementById('scanner-progress-percent');
  const progFill = document.getElementById('scanner-progress-fill');

  if (btn) btn.disabled = scanning;
  if (btnForce) btnForce.disabled = scanning;
  if (btnStop) btnStop.style.display = scanning ? 'inline-block' : 'none';
  if (spinner) spinner.style.display = scanning ? 'inline' : 'none';
  if (text) text.textContent = scanning ? (percent > 0 ? (currentLang === 'en' ? `Scanning... (${percent}%)` : `Scan en cours... (${percent}%)`) : (currentLang === 'en' ? 'Scanning...' : 'Scan en cours...')) : t('btn_scan_now');

  if (progContainer) {
    if (scanning) {
      progContainer.style.display = 'block';
      if (progStage) progStage.textContent = stage || (currentLang === 'en' ? 'Starting scan...' : 'Démarrage du scan...');
      if (progPercent) progPercent.textContent = (percent || 0) + '%';
      if (progFill) progFill.style.width = (percent || 0) + '%';
    } else {
      if (progPercent) progPercent.textContent = '100%';
      if (progFill) progFill.style.width = '100%';
      if (progStage) progStage.textContent = t('scan_finished_success');
      setTimeout(() => {
        if (!isScanning) progContainer.style.display = 'none';
      }, 1500);
    }
  }
}

async function triggerScannerScan(forceFull = false) {
  setScanButtonScanning(true, 5, forceFull ? (currentLang === 'en' ? 'Starting full scan...' : 'Démarrage du scan complet...') : (currentLang === 'en' ? 'Starting scan...' : 'Démarrage du scan...'));
  try {
    const url = forceFull ? '/api/scanner/start?force=true&force_full=true' : '/api/scanner/start?force=true';
    await fetch(url, { method: 'POST' });
    isScanning = true;
    pollScannerStatus();
  } catch (err) {
    alert((currentLang === 'en' ? 'Error starting scan: ' : 'Erreur lors du lancement du scan : ') + err);
    setScanButtonScanning(false);
  }
}

async function stopScannerScan() {
  const btnStop = document.getElementById('btn-stop-scan');
  if (btnStop) {
    btnStop.disabled = true;
    btnStop.innerHTML = '<span>⏳ </span>' + t('btn_scan_stop');
  }
  try {
    await fetch('/api/scanner/stop', { method: 'POST' });
    isScanning = false;
    setScanButtonScanning(false);
    if (scannerPollTimer) clearTimeout(scannerPollTimer);
    const progStage = document.getElementById('scanner-progress-stage');
    if (progStage) progStage.textContent = t('scan_interrupted_user');
    const progContainer = document.getElementById('scanner-progress-container');
    setTimeout(() => {
      if (!isScanning && progContainer) progContainer.style.display = 'none';
    }, 2000);
    await loadScannerData();
  } catch (err) {
    alert((currentLang === 'en' ? 'Error interrupting scan: ' : 'Erreur lors de l\'interruption du scan : ') + err);
  } finally {
    if (btnStop) {
      btnStop.disabled = false;
      btnStop.innerHTML = '<span>⏹️ </span>' + t('btn_scan_stop');
    }
  }
}

async function pollScannerStatus() {
  if (scannerPollTimer) clearTimeout(scannerPollTimer);
  try {
    const res = await fetch('/api/scanner/status');
    const data = await res.json();
    if (data.status === 'scanning') {
      isScanning = true;
      const prog = data.progress || {};
      const pct = prog.percent || 0;
      const stage = prog.stage || (currentLang === 'en' ? 'Scanning...' : 'Scan en cours...');
      setScanButtonScanning(true, pct, stage);
      scannerPollTimer = setTimeout(pollScannerStatus, 1000);
    } else {
      isScanning = false;
      setScanButtonScanning(false);
      await loadScannerData();
    }
  } catch (e) {
    scannerPollTimer = setTimeout(pollScannerStatus, 2000);
  }
}

async function checkScannerStatusOnLoad() {
  try {
    const res = await fetch('/api/scanner/status');
    const data = await res.json();
    if (data.status === 'scanning') {
      isScanning = true;
      const prog = data.progress || {};
      setScanButtonScanning(true, prog.percent || 0, prog.stage || '');
      pollScannerStatus();
    } else {
      if (isScanning) {
        isScanning = false;
        setScanButtonScanning(false);
        await loadScannerData();
      }
    }
  } catch (e) {}
}

async function loadScannerData() {
  try {
    const res = await fetch('/api/scanner/data');
    scannerData = await res.json();
    renderScannerView();
  } catch (err) {
    console.error('Erreur chargement données scanner :', err);
  }
}

function renderScannerView() {
  if (!scannerData) return;
  const stats = scannerData.stats || {};

  // Compteurs statistiques
  const deadCount = (scannerData.dead_symlinks || []).length;
  const elDead = document.getElementById('sc-val-dead');
  if (elDead) elDead.textContent = deadCount;
  const elMags = document.getElementById('sc-val-magnets');
  if (elMags) elMags.textContent = stats.total_magnets || 0;
  const elDups = document.getElementById('sc-val-duplicates');
  if (elDups) elDups.textContent = stats.duplicates || 0;
  const elUnlinked = document.getElementById('sc-val-unlinked');
  if (elUnlinked) elUnlinked.textContent = stats.unlinked || 0;
  const elLinks = document.getElementById('sc-val-links');
  if (elLinks) elLinks.textContent = stats.local_links || 0;

  const elBadgeCount = document.getElementById('dead-links-badge-count');
  if (elBadgeCount) elBadgeCount.textContent = deadCount;

  // Date du dernier scan
  const lastTimeEl = document.getElementById('scan-last-time');
  if (lastTimeEl && scannerData.last_update) {
    const d = new Date(scannerData.last_update * 1000);
    lastTimeEl.textContent = `${t('last_scan_prefix')}${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  }

  // Rendu des Liens Morts
  renderDeadLinks(scannerData.dead_symlinks || []);

  // Rendu de la liste des Magnets
  renderMagnetsList(scannerData.grouped_magnets || {});
}

function renderDeadLinks(deadList) {
  const table = document.getElementById('dead-links-table');
  const tbody = document.getElementById('dead-links-tbody');
  const emptyMsg = document.getElementById('no-dead-links-msg');
  const btnResearchAll = document.getElementById('btn-research-all');
  const btnCleanAll = document.getElementById('btn-clean-all-dead');

  if (!deadList || deadList.length === 0) {
    if (table) table.style.display = 'none';
    if (emptyMsg) emptyMsg.style.display = 'block';
    if (btnResearchAll) btnResearchAll.style.display = 'none';
    if (btnCleanAll) btnCleanAll.style.display = 'none';
    return;
  }

  if (table) table.style.display = 'table';
  if (emptyMsg) emptyMsg.style.display = 'none';
  if (btnResearchAll) btnResearchAll.style.display = 'inline-block';
  if (btnCleanAll) btnCleanAll.style.display = 'inline-block';

  tbody.innerHTML = deadList.map(item => {
    let mediaBadge = `<span class="badge-tag unlinked">${esc(t('media_unknown'))}</span>`;
    let researchBtn = '';

    if (item.media_type === 'radarr' && item.media_id) {
      mediaBadge = `<span class="badge-tag radarr">🎬 Radarr</span> <strong>${esc(item.media_title || item.filename)}</strong>`;
      researchBtn = `<button type="button" class="btn-sec" style="color:#f5a623;border-color:#f5a623;" onclick="researchDeadLink('radarr', ${item.media_id}, '${esc(item.path)}')">${esc(t('btn_retrigger_radarr'))}</button>`;
    } else if (item.media_type === 'sonarr' && item.media_id) {
      mediaBadge = `<span class="badge-tag sonarr">📺 Sonarr</span> <strong>${esc(item.media_title || item.filename)}</strong>`;
      researchBtn = `<button type="button" class="btn-sec" style="color:#58a6ff;border-color:#58a6ff;" onclick="researchDeadLink('sonarr', ${item.media_id}, '${esc(item.path)}')">${esc(t('btn_retrigger_sonarr'))}</button>`;
    }

    return `<tr>
      <td>${mediaBadge}</td>
      <td style="font-family:monospace;font-size:12px;word-break:break-all;">${esc(item.path)}</td>
      <td style="font-family:monospace;font-size:11px;color:#f85149;word-break:break-all;">${esc(item.target || t('missing_target'))}</td>
      <td style="display:flex;gap:6px;align-items:center;">
        ${researchBtn}
        <button type="button" class="btn-del" onclick="cleanDeadSymlink('${esc(item.path)}')">${esc(t('btn_purge'))}</button>
      </td>
    </tr>`;
  }).join('');
}

async function researchDeadLink(mediaType, mediaId, path) {
  if (!confirm(t('confirm_research_dead', { mediaType: mediaType.toUpperCase() }))) return;
  try {
    const res = await fetch('/api/scanner/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ media_type: mediaType, media_id: mediaId, dead_path: path })
    });
    const data = await res.json();
    if (data.status === 'success') {
      alert(currentLang === 'en' ? `Search successfully retriggered in ${mediaType.toUpperCase()}!` : `Recherche relancée avec succès dans ${mediaType.toUpperCase()} !`);
      loadScannerData();
    } else {
      alert((currentLang === 'en' ? 'Error: ' : 'Erreur : ') + data.message);
    }
  } catch (e) {
    alert((currentLang === 'en' ? 'Network error during search: ' : 'Erreur réseau lors de la relance : ') + e);
  }
}

async function cleanDeadSymlink(path) {
  const item = (scannerData.dead_symlinks || []).find(d => d.path === path);
  const mediaType = item && item.media_type && item.media_type !== 'unknown' ? item.media_type.toUpperCase() : null;
  const mediaTitle = item && item.media_title ? ` (${item.media_title})` : '';

  if (!confirm(t('confirm_clean_single_dead'))) return;

  let deleteFromArr = false;
  if (mediaType) {
    deleteFromArr = confirm(
      t('confirm_delete_media_arr', { mediaType: mediaType, mediaTitle: mediaTitle })
    );
  }

  try {
    const res = await fetch('/api/scanner/clean_dead_symlinks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths: [path], delete_from_arr: deleteFromArr })
    });
    const data = await res.json();
    let msg = currentLang === 'en' ? `${data.deleted} link(s) deleted on disk.` : `${data.deleted} lien(s) supprimé(s) sur le disque.`;
    if (data.deleted_ad > 0) {
      msg += currentLang === 'en' ? `\n${data.deleted_ad} orphaned magnet(s) purged on provider.` : `\n${data.deleted_ad} magnet(s) orphelin(s) purgé(s) sur le fournisseur.`;
    }
    if (data.deleted_arr > 0) {
      msg += currentLang === 'en' ? `\n${data.deleted_arr} item(s) deleted in ${mediaType || 'Radarr/Sonarr'}.` : `\n${data.deleted_arr} élément(s) supprimé(s) dans ${mediaType || 'Radarr/Sonarr'}.`;
    }
    alert(msg);
    loadScannerData();
  } catch (e) {
    alert((currentLang === 'en' ? 'Error: ' : 'Erreur : ') + e);
  }
}

async function researchAllDeadLinks() {
  const matched = (scannerData.dead_symlinks || []).filter(d => d.media_type === 'radarr' || d.media_type === 'sonarr');
  if (matched.length === 0) return alert(t('no_dead_arr'));
  if (!confirm(t('confirm_research_all_dead', { n: matched.length }))) return;

  const btn = document.getElementById('btn-research-all');
  if (btn) { btn.disabled = true; btn.textContent = currentLang === 'en' ? 'Processing...' : 'Traitement en cours...'; }

  try {
    const res = await fetch('/api/scanner/research_all_dead', { method: 'POST' });
    const data = await res.json();
    alert(data.message || (currentLang === 'en' ? `${data.count} search(es) retriggered!` : `${data.count} recherche(s) relancée(s) !`));
    loadScannerData();
  } catch (e) {
    alert((currentLang === 'en' ? 'Error: ' : 'Erreur : ') + e);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = t('btn_research_all'); }
  }
}

async function cleanAllDeadSymlinks() {
  const total = (scannerData.dead_symlinks || []).length;
  if (total === 0) return alert(t('no_dead_to_delete'));
  if (!confirm(t('confirm_clean_all_dead', { n: total }))) return;

  const arrItems = (scannerData.dead_symlinks || []).filter(d => d.media_type === 'radarr' || d.media_type === 'sonarr');
  let deleteFromArr = false;
  if (arrItems.length > 0) {
    deleteFromArr = confirm(t('confirm_delete_from_arr', { n: arrItems.length }));
  }

  try {
    const res = await fetch('/api/scanner/clean_dead_symlinks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delete_from_arr: deleteFromArr })
    });
    const data = await res.json();
    let msg = currentLang === 'en' ? `${data.deleted} dead link(s) purged on disk!` : `${data.deleted} lien(s) mort(s) purgé(s) sur le disque !`;
    if (data.deleted_ad > 0) {
      msg += currentLang === 'en' ? `\n${data.deleted_ad} orphaned magnet(s) purged on provider.` : `\n${data.deleted_ad} magnet(s) orphelin(s) purgé(s) sur le fournisseur.`;
    }
    if (data.deleted_arr > 0) {
      msg += currentLang === 'en' ? `\n${data.deleted_arr} media deleted in Radarr / Sonarr.` : `\n${data.deleted_arr} média(s) supprimé(s) dans Radarr / Sonarr.`;
    }
    alert(msg);
    loadScannerData();
  } catch (e) {
    alert((currentLang === 'en' ? 'Error: ' : 'Erreur : ') + e);
  }
}

function formatSize(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
}

function renderMagnetsList(grouped) {
  const container = document.getElementById('magnets-list-container');
  const groupKeys = Object.keys(grouped);

  if (groupKeys.length === 0) {
    container.innerHTML = `<div style="color:var(--text-muted);text-align:center;padding:25px;">${esc(t('msg_no_magnets'))}</div>`;
    return;
  }

  let html = '';
  groupKeys.forEach((normTitle, gIdx) => {
    const mags = grouped[normTitle];
    const isSingle = mags.length === 1;
    const groupId = 'group-' + gIdx;

    if (isSingle) {
      const mag = mags[0];
      const localBadge = mag.is_local ? `<span class="badge-tag local">${esc(t('tag_symlinked'))}</span>` : `<span class="badge-tag unlinked">${esc(t('tag_not_symlinked'))}</span>`;
      const deadBadge = mag.is_dead ? `<span class="badge-tag dead">${esc(t('tag_dead_api'))}</span>` : '';

      html += `<div class="mag-group sc-mag-card" id="mag-single-${mag.id}" data-title="${esc(normTitle.toLowerCase())} ${esc(mag.name.toLowerCase())}" data-dead="${mag.is_dead ? '1':'0'}" data-local="${mag.is_local ? '1':'0'}" data-dup="0">
        <div class="mag-item" data-dead="${mag.is_dead ? '1':'0'}" data-local="${mag.is_local ? '1':'0'}">
          <div class="mag-info-left">
            <input type="checkbox" class="sc-mag-chk" value="${mag.id}" data-name="${esc(mag.name)}">
            <div>
              <div style="font-weight:600;font-size:13px;word-break:break-word;overflow-wrap:anywhere;">${esc(mag.name)}</div>
              <div class="mag-meta">
                <span>ID: #${mag.id}</span>
                <span>${esc(t('meta_size'))} ${formatSize(mag.size)}</span>
                <span>${esc(t('meta_status'))} ${mag.statusCode}</span>
                ${localBadge} ${deadBadge}
              </div>
            </div>
          </div>
          <div class="mag-actions">
            <button type="button" class="btn-del" onclick="deleteSingleMagnet(${mag.id}, '${esc(mag.name)}')">${esc(t('btn_delete'))}</button>
          </div>
        </div>
      </div>`;
    } else {
      let childrenHtml = '';
      mags.forEach((mag, idx) => {
        const isBest = idx === 0 ? `<span style="color:#58a6ff;font-size:11px;">${esc(t('tag_kept_default'))}</span>` : '';
        const localBadge = mag.is_local ? `<span class="badge-tag local">${esc(t('tag_symlinked'))}</span>` : `<span class="badge-tag unlinked">${esc(t('tag_not_symlinked'))}</span>`;
        const deadBadge = mag.is_dead ? `<span class="badge-tag dead">${esc(t('tag_dead_api'))}</span>` : '';

        childrenHtml += `<div class="mag-item sc-mag-child" id="mag-child-${mag.id}" data-dead="${mag.is_dead ? '1':'0'}" data-local="${mag.is_local ? '1':'0'}">
          <div class="mag-info-left">
            <input type="checkbox" class="sc-mag-chk" value="${mag.id}" data-name="${esc(mag.name)}" ${idx > 0 ? 'data-isdup="1"' : ''}>
            <div>
              <div style="font-weight:500;font-size:13px;word-break:break-word;overflow-wrap:anywhere;">${esc(mag.name)} ${isBest}</div>
              <div class="mag-meta">
                <span>ID: #${mag.id}</span>
                <span>${esc(t('meta_size'))} ${formatSize(mag.size)}</span>
                <span>${esc(t('meta_status'))} ${mag.statusCode}</span>
                ${localBadge} ${deadBadge}
              </div>
            </div>
          </div>
          <div class="mag-actions">
            <button type="button" class="btn-del" onclick="deleteSingleMagnet(${mag.id}, '${esc(mag.name)}')">${esc(t('btn_delete'))}</button>
          </div>
        </div>`;
      });

      html += `<div class="mag-group sc-mag-card" id="${groupId}" data-title="${esc(normTitle.toLowerCase())}" data-dup="1">
        <div class="mag-group-header" onclick="document.getElementById('${groupId}').classList.toggle('open')">
          <div class="mag-group-title">
            <span class="mag-chevron">▶</span>
            <span>${esc(normTitle)}</span>
            <span class="badge" style="background:#d29922;color:#121212;">${mags.length} versions</span>
          </div>
        </div>
        <div class="mag-children">${childrenHtml}</div>
      </div>`;
    }
  });

  container.innerHTML = html;
  filterMagnetsDisplay();
}

function setMagnetsFilter(filter) {
  currentMagnetsFilter = filter;
  document.querySelectorAll('.sc-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  filterMagnetsDisplay();
}

function filterMagnetsDisplay() {
  const search = (document.getElementById('magnet-search-input')?.value || '').toLowerCase().trim();

  document.querySelectorAll('.sc-mag-card').forEach(card => {
    const title = card.getAttribute('data-title') || '';
    const isDup = card.getAttribute('data-dup') === '1';
    let matchFilter = true;

    if (currentMagnetsFilter === 'duplicates') {
      matchFilter = isDup;
    } else if (currentMagnetsFilter === 'dead') {
      const hasDead = card.getAttribute('data-dead') === '1' || card.querySelector('[data-dead="1"]') !== null;
      matchFilter = hasDead;
    } else if (currentMagnetsFilter === 'unlinked') {
      const hasUnlinked = card.getAttribute('data-local') === '0' || card.querySelector('[data-local="0"]') !== null;
      matchFilter = hasUnlinked;
    }

    const matchSearch = !search || title.includes(search);
    const visible = matchFilter && matchSearch;
    card.style.display = visible ? 'block' : 'none';

    if (visible && isDup && (currentMagnetsFilter === 'dead' || currentMagnetsFilter === 'unlinked')) {
      card.classList.add('open');
    }
  });
}

function toggleExpandAllGroups() {
  allMagnetsExpanded = !allMagnetsExpanded;
  document.querySelectorAll('.mag-group').forEach(g => {
    g.classList.toggle('open', allMagnetsExpanded);
  });
  const btn = document.getElementById('btn-expand-groups');
  if (btn) btn.textContent = allMagnetsExpanded ? t('btn_collapse_all') : t('btn_expand_all');
}

function toggleSelectAllVisibleMagnets() {
  const visibleChks = Array.from(document.querySelectorAll('.sc-mag-chk')).filter(chk => {
    const card = chk.closest('.sc-mag-card');
    return card && card.style.display !== 'none';
  });
  if (visibleChks.length === 0) return;
  const allChecked = visibleChks.every(c => c.checked);
  visibleChks.forEach(c => c.checked = !allChecked);
  const btn = document.getElementById('btn-select-all-mags');
  if (btn) btn.textContent = allChecked ? t('btn_check_visible') : t('btn_uncheck_all');
}

async function deleteSingleMagnet(id, name) {
  if (!confirm(t('confirm_delete_magnet', { name: name }))) return;
  try {
    const res = await fetch('/api/scanner/delete_magnets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ id, name }] })
    });
    const data = await res.json();
    if (data.status === 'success') {
      const singleEl = document.getElementById(`mag-single-${id}`);
      if (singleEl) singleEl.remove();
      const childEl = document.getElementById(`mag-child-${id}`);
      if (childEl) childEl.remove();
      await loadScannerData();
      pollScannerStatus();
    } else {
      alert((currentLang === 'en' ? 'Error: ' : 'Erreur : ') + (data.message || (currentLang === 'en' ? 'Deletion failed' : 'Échec de la suppression')));
    }
  } catch (e) {
    alert((currentLang === 'en' ? 'Error during deletion: ' : 'Erreur lors de la suppression : ') + e);
  }
}

async function deleteSelectedMagnets() {
  const checked = Array.from(document.querySelectorAll('.sc-mag-chk:checked')).map(c => ({
    id: c.value,
    name: c.dataset.name || ''
  }));
  if (checked.length === 0) return alert(t('no_mags_selected'));
  if (!confirm(t('confirm_delete_checked_mags', { n: checked.length }))) return;

  const btn = document.getElementById('btn-del-selected-mags');
  if (btn) { btn.disabled = true; btn.textContent = currentLang === 'en' ? 'Deleting...' : 'Suppression...'; }

  try {
    const res = await fetch('/api/scanner/delete_magnets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: checked })
    });
    const data = await res.json();
    if (data.status === 'success') {
      checked.forEach(item => {
        const singleEl = document.getElementById(`mag-single-${item.id}`);
        if (singleEl) singleEl.remove();
        const childEl = document.getElementById(`mag-child-${item.id}`);
        if (childEl) childEl.remove();
      });
      await loadScannerData();
      pollScannerStatus();
    } else {
      alert((currentLang === 'en' ? 'Error: ' : 'Erreur : ') + (data.message || (currentLang === 'en' ? 'Deletion failed' : 'Échec de la suppression')));
    }
  } catch (e) {
    alert((currentLang === 'en' ? 'Error: ' : 'Erreur : ') + e);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = t('btn_delete_checked'); }
  }
}

async function cleanAllDuplicateMagnets() {
  const duplicates = [];
  document.querySelectorAll('.sc-mag-card[data-dup="1"]').forEach(card => {
    const children = card.querySelectorAll('.sc-mag-child');
    for (let i = 1; i < children.length; i++) {
      const chk = children[i].querySelector('.sc-mag-chk');
      if (chk) duplicates.push({ id: chk.value, name: chk.dataset.name || '' });
    }
  });

  if (duplicates.length === 0) return alert(t('no_dup_mags'));
  if (!confirm(t('confirm_clean_duplicates', { n: duplicates.length }))) return;

  try {
    const res = await fetch('/api/scanner/delete_magnets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: duplicates, delete_local: false })
    });
    const data = await res.json();
    if (data.status === 'success') {
      await loadScannerData();
      pollScannerStatus();
    } else {
      alert((currentLang === 'en' ? 'Error: ' : 'Erreur : ') + (data.message || (currentLang === 'en' ? 'Cleanup failed' : 'Échec du nettoyage')));
    }
  } catch (e) {
    alert((currentLang === 'en' ? 'Error: ' : 'Erreur : ') + e);
  }
}

// ==========================================
// RECHERCHE MULTI-MOTEURS (FINDER)
// ==========================================
let finderLastResults = [];
let finderLastRejected = [];

async function loadFinderSettings() {
  try {
    const res = await fetch('/api/finder/config');
    if (!res.ok) return;
    const data = await res.json();
    const cfg = data.config || {};

    const engines = cfg.engines || ['brave', 'yandex', 'yahoo', 'lite'];
    document.querySelectorAll('.finder-engine-cb').forEach(cb => {
      cb.checked = engines.includes(cb.value);
    });

    const modeSel = document.getElementById('finder_search_mode');
    if (modeSel && cfg.search_mode) modeSel.value = cfg.search_mode;

    const siteInput = document.getElementById('finder_site_filter');
    if (siteInput && cfg.site_filter) siteInput.value = cfg.site_filter;

    const regSel = document.getElementById('finder_region');
    if (regSel && cfg.region) regSel.value = cfg.region;

    const safeSel = document.getElementById('finder_safesearch');
    if (safeSel && cfg.safesearch) safeSel.value = cfg.safesearch;

    const maxRes = document.getElementById('finder_max_results');
    if (maxRes && cfg.max_results) maxRes.value = cfg.max_results;

    const maxScrape = document.getElementById('finder_max_scrape');
    if (maxScrape && cfg.max_pages_to_scrape) maxScrape.value = cfg.max_pages_to_scrape;

    const minSim = document.getElementById('finder_min_sim');
    if (minSim && cfg.min_similarity !== undefined) minSim.value = cfg.min_similarity;

    const timeoutInput = document.getElementById('finder_timeout');
    if (timeoutInput && cfg.timeout) timeoutInput.value = cfg.timeout;

    const verifyCb = document.getElementById('finder_verify_links');
    if (verifyCb && cfg.verify_links !== undefined) verifyCb.checked = !!cfg.verify_links;

  } catch (err) {
    console.error('Erreur chargement config finder:', err);
  }
}

function getFinderParams() {
  const selectedEngines = [];
  document.querySelectorAll('.finder-engine-cb:checked').forEach(cb => {
    selectedEngines.push(cb.value);
  });

  return {
    query: (document.getElementById('finder_query')?.value || '').trim(),
    search_mode: document.getElementById('finder_search_mode')?.value || 'torrent',
    site_filter: (document.getElementById('finder_site_filter')?.value || '').trim(),
    region: document.getElementById('finder_region')?.value || 'fr-fr',
    safesearch: document.getElementById('finder_safesearch')?.value || 'off',
    max_results: parseInt(document.getElementById('finder_max_results')?.value || '25', 10),
    max_pages_to_scrape: parseInt(document.getElementById('finder_max_scrape')?.value || '18', 10),
    min_similarity: parseInt(document.getElementById('finder_min_sim')?.value || '10', 10),
    timeout: parseInt(document.getElementById('finder_timeout')?.value || '8', 10),
    verify_links: !!document.getElementById('finder_verify_links')?.checked,
    engines: selectedEngines
  };
}

async function saveFinderDefaultSettings() {
  const p = getFinderParams();
  const payload = {
    search_mode: p.search_mode,
    site_filter: p.site_filter,
    region: p.region,
    safesearch: p.safesearch,
    max_results: p.max_results,
    max_pages_to_scrape: p.max_pages_to_scrape,
    min_similarity: p.min_similarity,
    timeout: p.timeout,
    verify_links: p.verify_links,
    engines: p.engines
  };

  const msgEl = document.getElementById('finder-save-msg');
  if (msgEl) msgEl.textContent = 'Enregistrement...';

  try {
    const res = await fetch('/api/finder/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      if (msgEl) {
        msgEl.textContent = '✓ ' + (currentLang === 'en' ? 'Saved as default!' : 'Enregistré comme défaut !');
        setTimeout(() => { if (msgEl) msgEl.textContent = ''; }, 3000);
      }
    } else {
      if (msgEl) msgEl.textContent = '❌ Erreur';
    }
  } catch (err) {
    if (msgEl) msgEl.textContent = '❌ ' + err;
  }
}

async function runFinderSearch() {
  const params = getFinderParams();
  if (!params.query) {
    alert(currentLang === 'en' ? 'Please enter a search query' : 'Veuillez saisir un terme de recherche');
    document.getElementById('finder_query')?.focus();
    return;
  }
  if (!params.engines || params.engines.length === 0) {
    alert(currentLang === 'en' ? 'Please select at least one search engine' : 'Veuillez cocher au moins un moteur de recherche');
    return;
  }

  const btn = document.getElementById('btn-finder-search');
  const spinner = document.getElementById('finder-spinner');
  const loader = document.getElementById('finder-loader');
  const resultsCard = document.getElementById('finder-results-card');

  if (btn) btn.disabled = true;
  if (spinner) spinner.style.display = 'inline-block';
  if (loader) loader.style.display = 'block';
  if (resultsCard) resultsCard.style.display = 'none';

  const startTime = Date.now();

  try {
    const res = await fetch('/api/finder/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    const data = await res.json();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!res.ok) {
      alert((currentLang === 'en' ? 'Search error: ' : 'Erreur de recherche : ') + (data.error || res.statusText));
      return;
    }

    finderLastResults = data.results || [];
    finderLastRejected = data.rejected || [];

    const statsEl = document.getElementById('finder-stats');
    if (statsEl) {
      const okCount = finderLastResults.length;
      const rejCount = finderLastRejected.length;
      const pagesCount = data.pages_scanned || 0;
      statsEl.innerHTML = `<span>🎯 <strong>${okCount}</strong> ${currentLang === 'en' ? 'valid results' : 'résultat(s) valide(s)'}</span> &nbsp;|&nbsp; <span>⚠️ ${rejCount} ${currentLang === 'en' ? 'rejected' : 'écarté(s)'}</span> &nbsp;|&nbsp; <span>📄 ${pagesCount} ${currentLang === 'en' ? 'pages analyzed' : 'pages analysées'}</span> &nbsp;|&nbsp; <span style="color:var(--text-muted);">${elapsed}s</span>`;
    }

    const warnBanner = document.getElementById('finder-warn-banner');
    if (warnBanner) {
      const errs = Object.entries(data.engine_errors || {});
      if (errs.length > 0) {
        warnBanner.style.display = 'block';
        warnBanner.innerHTML = '⚠️ ' + errs.map(([eng, msg]) => `<strong>${esc(eng)}:</strong> ${esc(msg)}`).join(' ; ');
      } else {
        warnBanner.style.display = 'none';
        warnBanner.textContent = '';
      }
    }

    const toggleRejBtn = document.getElementById('btn-finder-toggle-rejected');
    if (toggleRejBtn) {
      if (finderLastRejected.length > 0) {
        toggleRejBtn.style.display = 'inline-block';
        toggleRejBtn.textContent = (currentLang === 'en' ? 'Show rejected (' : 'Voir écartés (') + finderLastRejected.length + ')';
      } else {
        toggleRejBtn.style.display = 'none';
      }
    }

    const rejBox = document.getElementById('finder-rejected-box');
    if (rejBox) rejBox.style.display = 'none';

    renderFinderResultsList(finderLastResults);
    renderFinderRejectedList(finderLastRejected);

    if (resultsCard) resultsCard.style.display = 'block';

  } catch (err) {
    alert((currentLang === 'en' ? 'Search failed: ' : 'Échec de la recherche : ') + err);
  } finally {
    if (btn) btn.disabled = false;
    if (spinner) spinner.style.display = 'none';
    if (loader) loader.style.display = 'none';
  }
}

function renderFinderItemCard(item, index, isRejected = false) {
  const kind = (item.kind || 'hoster').toLowerCase();
  let kindBadge = '';
  if (kind === 'magnet') kindBadge = `<span class="finder-badge badge-magnet">🧲 Magnet</span>`;
  else if (kind === 'torrent') kindBadge = `<span class="finder-badge badge-torrent">📦 Torrent</span>`;
  else kindBadge = `<span class="finder-badge badge-hoster">🔗 DDL</span>`;

  const score = item.similarity || 0;
  const scoreBadge = `<span class="finder-badge badge-score">${score}%</span>`;

  const engines = (item.engines || []).map(e => `<span class="finder-badge badge-engine">${esc(e)}</span>`).join(' ');

  let statusBadge = '';
  if (item.verified) {
    const isOk = (item.status || '').toLowerCase().includes('ok') || (item.status || '').includes('200') || item.status === 'Valide';
    statusBadge = `<span class="finder-badge ${isOk ? 'badge-status-ok' : 'badge-status-warn'}">● ${esc(item.status || 'Vérifié')}</span>`;
  }

  const rejectBadge = isRejected && item.reject_reason ? `<span class="finder-badge badge-status-err">❌ ${esc(item.reject_reason)}</span>` : '';

  const rawUrl = item.url || '';
  const safeUrl = esc(rawUrl);
  const isMagnet = rawUrl.startsWith('magnet:?');
  const displayLink = isMagnet ? `${rawUrl.substring(0, 75)}...` : safeUrl;

  const title = esc(item.display_name || rawUrl || 'Lien trouvé');
  const snippet = item.snippet ? `<div class="finder-card-snippet">${esc(item.snippet)}</div>` : '';

  return `
    <div class="finder-card-item ${isRejected ? 'rejected' : ''}">
      ${!isRejected ? `<input type="checkbox" class="finder-card-cb finder-item-chk" data-idx="${index}">` : ''}
      <div class="finder-card-body">
        <div class="finder-card-header">
          ${kindBadge}
          ${scoreBadge}
          ${engines}
          ${statusBadge}
          ${rejectBadge}
        </div>
        <div class="finder-card-title">${title}</div>
        <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="finder-card-url" title="${safeUrl}">${displayLink}</a>
        ${snippet}
      </div>
      <div class="finder-card-actions">
        <button type="button" class="btn-sec" onclick="copyFinderByIndex(${index}, ${isRejected})" title="${currentLang === 'en' ? 'Copy link' : 'Copier le lien'}" style="padding:6px 10px; font-size:12px;">📋</button>
        <button type="button" class="btn-main" onclick="downloadFinderByIndex(${index}, this, ${isRejected})" style="padding:6px 12px; font-size:12px; display:inline-flex; align-items:center; gap:4px;">
          <span>⚡</span> <span>${currentLang === 'en' ? 'Download' : 'Télécharger'}</span>
        </button>
      </div>
    </div>
  `;
}

function renderFinderResultsList(results) {
  const container = document.getElementById('finder-results-list');
  if (!container) return;

  if (!results || results.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted); background:var(--bg-subpanel); border-radius:8px;">${currentLang === 'en' ? 'No valid results matching your criteria.' : 'Aucun résultat valide correspondant à vos critères.'}</div>`;
    return;
  }

  container.innerHTML = results.map((item, idx) => renderFinderItemCard(item, idx, false)).join('');
}

function renderFinderRejectedList(rejected) {
  const container = document.getElementById('finder-rejected-list');
  if (!container) return;

  container.innerHTML = rejected.map((item, idx) => renderFinderItemCard(item, idx, true)).join('');
}

function setFinderSelection(mode) {
  const checkboxes = document.querySelectorAll('.finder-item-chk');
  checkboxes.forEach(cb => {
    const idx = parseInt(cb.dataset.idx, 10);
    const item = finderLastResults[idx];
    if (!item) return;

    if (mode === 'all') cb.checked = true;
    else if (mode === 'none') cb.checked = false;
    else if (mode === 'magnet') cb.checked = (item.kind === 'magnet' || item.kind === 'torrent');
    else if (mode === 'ddl') cb.checked = (item.kind === 'hoster');
  });
}

function toggleFinderRejected() {
  const box = document.getElementById('finder-rejected-box');
  const btn = document.getElementById('btn-finder-toggle-rejected');
  if (!box) return;

  if (box.style.display === 'none' || !box.style.display) {
    box.style.display = 'block';
    if (btn) btn.textContent = (currentLang === 'en' ? 'Hide rejected' : 'Masquer écartés');
  } else {
    box.style.display = 'none';
    if (btn) btn.textContent = (currentLang === 'en' ? 'Show rejected (' : 'Voir écartés (') + (finderLastRejected.length) + ')';
  }
}

function copyFinderByIndex(index, isRejected = false) {
  const item = isRejected ? finderLastRejected[index] : finderLastResults[index];
  if (!item || !item.url) return;

  navigator.clipboard.writeText(item.url).then(() => {
    alert(currentLang === 'en' ? 'Link copied to clipboard!' : 'Lien copié dans le presse-papiers !');
  }).catch(() => {
    prompt(currentLang === 'en' ? 'Copy link:' : 'Copiez le lien :', item.url);
  });
}

function copyFinderSelected() {
  const checked = document.querySelectorAll('.finder-item-chk:checked');
  if (checked.length === 0) {
    alert(currentLang === 'en' ? 'Please select at least one item' : 'Veuillez cocher au moins un élément');
    return;
  }
  const urls = Array.from(checked).map(cb => {
    const idx = parseInt(cb.dataset.idx, 10);
    return finderLastResults[idx]?.url;
  }).filter(Boolean);

  navigator.clipboard.writeText(urls.join('\n')).then(() => {
    alert(currentLang === 'en' ? `${urls.length} link(s) copied!` : `${urls.length} lien(s) copié(s) dans le presse-papiers !`);
  }).catch(() => {
    prompt(currentLang === 'en' ? 'Copy links:' : 'Copiez les liens :', urls.join('\n'));
  });
}

async function downloadFinderByIndex(index, btn, isRejected = false) {
  const item = isRejected ? finderLastRejected[index] : finderLastResults[index];
  if (!item || !item.url) return;

  const catSel = document.getElementById('finder-dest-category');
  const category = catSel ? catSel.value : 'torrent-direct';

  const origText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> ' + (currentLang === 'en' ? 'Adding...' : 'Ajout...');
  }

  try {
    const res = await fetch('/api/finder/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: category,
        items: [{ url: item.url, kind: item.kind, name: item.display_name }]
      })
    });
    const data = await res.json();
    if (res.ok && data.status === 'ok') {
      if (btn) {
        btn.innerHTML = '<span>✓</span> ' + (currentLang === 'en' ? 'Added!' : 'Ajouté !');
        btn.classList.remove('btn-main');
        btn.classList.add('btn-sec');
      }
      refreshQueue();
    } else {
      alert((currentLang === 'en' ? 'Error: ' : 'Erreur : ') + (data.message || data.detail || 'Failed'));
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = origText;
      }
    }
  } catch (err) {
    alert((currentLang === 'en' ? 'Error: ' : 'Erreur : ') + err);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origText;
    }
  }
}

async function downloadFinderSelected() {
  const checked = document.querySelectorAll('.finder-item-chk:checked');
  if (checked.length === 0) {
    alert(currentLang === 'en' ? 'Please select at least one item' : 'Veuillez sélectionner au moins un élément');
    return;
  }

  const items = Array.from(checked).map(cb => {
    const idx = parseInt(cb.dataset.idx, 10);
    const it = finderLastResults[idx];
    return it ? { url: it.url, kind: it.kind, name: it.display_name } : null;
  }).filter(Boolean);

  const catSel = document.getElementById('finder-dest-category');
  const category = catSel ? catSel.value : 'torrent-direct';

  const btn = document.getElementById('btn-finder-bulk-dl');
  const origText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> ' + (currentLang === 'en' ? 'Adding to PyRDT...' : 'Ajout en cours...');
  }

  try {
    const res = await fetch('/api/finder/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: category,
        items: items
      })
    });
    const data = await res.json();
    if (res.ok && data.status === 'ok') {
      alert(data.message || (currentLang === 'en' ? 'Downloads added to PyRDT!' : 'Téléchargements ajoutés à PyRDT !'));
      refreshQueue();
    } else {
      alert((currentLang === 'en' ? 'Error: ' : 'Erreur : ') + (data.message || data.detail || 'Failed'));
    }
  } catch (err) {
    alert((currentLang === 'en' ? 'Error: ' : 'Erreur : ') + err);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origText;
    }
  }
}


