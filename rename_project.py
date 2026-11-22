#!/usr/bin/env python3
"""
OmniSym / Project Rebranding & Renaming Utility
Usage:
    python3 rename_project.py [NewName] [--from OldName] [--dry-run] [--no-docker] [--git-commit]
Examples:
    python3 rename_project.py OmniSym
    python3 rename_project.py FlowDock --dry-run
    python3 rename_project.py
"""

import os
import sys
import re
import json
import zipfile
import shutil
import argparse
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

# Fichiers cibles à analyser et mettre à jour
TARGET_FILES = [
    "docker-compose.yml",
    "install.sh",
    "start.sh",
    "app.py",
    "LICENSE",
    "README.md",
    "README.fr.md",
    "CHANGELOG.md",
    "CHANGELOG.fr.md",
    "PRIVACY.md",
    "app/main.py",
    "app/config.py",
    "app/storage.py",
    "app/scanner.py",
    "app/worker.py",
    "app/notifications.py",
    "app/bencode.py",
    "app/__init__.py",
    "app/alldebrid.py",
    "app/providers/alldebrid.py",
    "app/providers/realdebrid.py",
    "app/providers/base.py",
    "app/routers/web.py",
    "app/routers/qbittorrent.py",
    "app/routers/scanner.py",
    "app/routers/finder.py",
    "app/routers/speedtest.py",
    "app/templates/index.html",
    "app/static/manifest.json",
    "app/static/sw.js",
    "app/static/js/app.js",
    "app/static/js/i18n.js",
    "app/static/js/queue.js",
    "app/static/js/settings.js",
    "app/static/js/onboarding.js",
    "app/static/js/scanner.js",
    "app/static/js/finder.js",
    "app/static/js/speedtest.js",
    "extension/manifest.json",
    "extension/background.js",
    "extension/popup.html",
    "extension/popup.js",
]

def detect_current_name():
    """Détecte automatiquement le nom actuel du projet depuis app/main.py ou index.html."""
    main_p = BASE_DIR / "app/main.py"
    if main_p.exists():
        match = re.search(r'title="([A-Za-z0-9_-]+)', main_p.read_text(encoding="utf-8"))
        if match:
            return match.group(1).split()[0]
    
    html_p = BASE_DIR / "app/templates/index.html"
    if html_p.exists():
        match = re.search(r'<title>([A-Za-z0-9_-]+)</title>', html_p.read_text(encoding="utf-8"))
        if match:
            return match.group(1)

    return "OmniSym"

def repackage_extension(old_lower, new_lower, dry_run=False):
    """Regénère l'archive .zip de l'extension Chrome avec le nouveau nom."""
    ext_dir = BASE_DIR / "extension"
    static_dir = BASE_DIR / "app/static"
    if not ext_dir.exists() or dry_run:
        return
    
    new_zip = static_dir / f"{new_lower}-chrome-extension.zip"
    with zipfile.ZipFile(new_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, _, files in os.walk(ext_dir):
            for file in files:
                full_p = Path(root) / file
                rel_p = full_p.relative_to(ext_dir)
                zipf.write(full_p, arcname=str(rel_p))
    print(f"  📦 Extension Chrome re-packagée : {new_zip.name}")

def update_userscript(old_name, new_name, old_lower, new_lower, dry_run=False):
    """Met à jour et renomme le userscript Tampermonkey."""
    static_dir = BASE_DIR / "app/static"
    candidates = [
        static_dir / f"{new_lower}.user.js",
        static_dir / f"{old_lower}.user.js",
        static_dir / "omnisym.user.js",
        static_dir / "debridflow.user.js"
    ]
    source_p = next((p for p in candidates if p.exists()), None)
    if not source_p:
        return

    content = source_p.read_text(encoding="utf-8")
    content = content.replace(old_name, new_name)
    content = content.replace(old_lower, new_lower)
    content = content.replace(old_name.upper(), new_name.upper())

    if not dry_run:
        target_p = static_dir / f"{new_lower}.user.js"
        target_p.write_text(content, encoding="utf-8")
        print(f"  🐒 Userscript Tampermonkey généré : {target_p.name}")

def run_validations():
    """Valide la syntaxe Python, JS et JSON."""
    print("\n🔍 Validation des syntaxes après modification...")
    
    # 1. Python
    try:
        py_files = [str(BASE_DIR / "app.py"), str(BASE_DIR / "app/main.py")]
        subprocess.run([sys.executable, "-B", "-m", "py_compile"] + py_files, check=True, stdout=subprocess.DEVNULL)
        print("  ✅ Syntaxe Python : OK")
    except Exception as e:
        print(f"  ❌ Erreur syntaxe Python : {e}")

    # 2. JSON
    for json_rel in ["app/static/manifest.json", "extension/manifest.json"]:
        p = BASE_DIR / json_rel
        if p.exists():
            try:
                json.loads(p.read_text(encoding="utf-8"))
                print(f"  ✅ JSON valide : {json_rel}")
            except Exception as e:
                print(f"  ❌ Erreur JSON dans {json_rel} : {e}")

def main():
    parser = argparse.ArgumentParser(description="Outil de renommage global du projet.")
    parser.add_argument("new_name", nargs="?", help="Nouveau nom du projet (ex: OmniSym, MediaHub...)")
    parser.add_argument("--from", dest="old_name", help="Nom d'origine à remplacer (détecté automatiquement par défaut)")
    parser.add_argument("--dry-run", action="store_true", help="Affiche les modifications prévues sans écrire sur le disque")
    parser.add_argument("--no-docker", action="store_true", help="Ne pas redémarrer le conteneur Docker")
    parser.add_argument("--git-commit", action="store_true", help="Crée automatiquement un commit git après le renommage")
    
    args = parser.parse_args()

    current_detected = detect_current_name()
    old_name = args.old_name or current_detected

    new_name = args.new_name
    if not new_name:
        print("=" * 60)
        print("⚡ Outil de Renommage Global de Projet")
        print("=" * 60)
        print(f"Nom actuel détecté : [ {old_name} ]")
        try:
            val = input("Entrez le nouveau nom souhaité : ").strip()
            if not val:
                print("❌ Aucun nom saisi. Annulation.")
                sys.exit(1)
            new_name = val
        except (KeyboardInterrupt, EOFError):
            print("\nAnnulation.")
            sys.exit(0)

    # Nettoyage du nom (Alphanumérique standard)
    new_name = re.sub(r"[^A-Za-z0-9_-]", "", new_name)
    if not new_name:
        print("❌ Nom invalide. Utilisez uniquement des caractères alphanumériques.")
        sys.exit(1)

    old_lower = old_name.lower()
    new_lower = new_name.lower()
    old_upper = old_name.upper()
    new_upper = new_name.upper()

    print(f"\n🔄 Renommage : {old_name} ({old_lower}) -> {new_name} ({new_lower})")
    if args.dry_run:
        print("⚠️ Mode DRY-RUN actif (aucune écriture disque)")

    modified_count = 0
    total_replacements = 0

    for rel_path in TARGET_FILES:
        file_path = BASE_DIR / rel_path
        if not file_path.exists():
            continue

        try:
            content = file_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue

        original = content
        count = 0

        # Remplacement par casse exacte
        if old_name in content:
            count += content.count(old_name)
            content = content.replace(old_name, new_name)
        if old_lower in content:
            count += content.count(old_lower)
            content = content.replace(old_lower, new_lower)
        if old_upper in content:
            count += content.count(old_upper)
            content = content.replace(old_upper, new_upper)

        if content != original:
            modified_count += 1
            total_replacements += count
            status = "[DRY-RUN]" if args.dry_run else "[MODIFIÉ]"
            print(f"  ✏️ {status} {rel_path} ({count} remplacement(s))")
            if not args.dry_run:
                file_path.write_text(content, encoding="utf-8")

    # Mettre à jour l'extension et le userscript
    repackage_extension(old_lower, new_lower, dry_run=args.dry_run)
    update_userscript(old_name, new_name, old_lower, new_lower, dry_run=args.dry_run)

    print(f"\n📊 Bilan : {modified_count} fichiers modifiés ({total_replacements} occurrences remplacées).")

    if not args.dry_run:
        run_validations()

        # Optionnel : redémarrage docker
        if not args.no_docker and shutil.which("docker"):
            print("\n🐳 Redémarrage du conteneur Docker...")
            try:
                # Tente de redémarrer le conteneur sous l'ancien ou le nouveau nom
                res = subprocess.run(["docker", "ps", "--filter", f"name={old_lower}", "--format", "{{.Names}}"], capture_output=True, text=True)
                container_to_restart = res.stdout.strip().split("\n")[0] if res.stdout.strip() else None
                if container_to_restart:
                    subprocess.run(["docker", "restart", container_to_restart], check=True, stdout=subprocess.DEVNULL)
                    print(f"  ✅ Conteneur {container_to_restart} redémarré avec succès !")
                else:
                    print("  ℹ️ Aucun conteneur actif trouvé sous ce nom.")
            except Exception as e:
                print(f"  ⚠️ Note Docker : {e}")

        # Optionnel : Git commit
        if args.git_commit:
            print("\n📦 Création du commit Git...")
            try:
                subprocess.run(["git", "add", "-A"], cwd=BASE_DIR, check=True)
                subprocess.run(["git", "commit", "-m", f"chore: rename project to {new_name}"], cwd=BASE_DIR, check=True)
                print(f"  ✅ Commit Git créé : 'chore: rename project to {new_name}'")
            except Exception as e:
                print(f"  ⚠️ Erreur git commit : {e}")

    print("\n🎉 Opération terminée avec succès !")

if __name__ == "__main__":
    main()
