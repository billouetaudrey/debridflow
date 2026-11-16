import os
import shutil
from pathlib import Path
from typing import Any, Dict, List, Tuple

from app.bencode import sanitize_filename
from app.state import get_allowed_exts, settings_db


def _collect_from_folder(folder: Path, allowed_exts: set, expected_set: set) -> List[Path]:
    found: List[Path] = []
    for root, _, files in os.walk(folder):
        for f in files:
            p = Path(root) / f
            if p.suffix.lower() in allowed_exts or f in expected_set:
                found.append(p)
    return found


def find_mounted_files(magnet_name: str, expected_files: List[str]) -> List[Path]:
    mount_dir = Path(settings_db["rclone_mount_dir"])
    allowed_exts = get_allowed_exts()
    expected_set = {Path(f).name for f in expected_files if f}
    stem_name = Path(magnet_name).stem

    # 1. Forcer un readdir sur la racine pour invalider les caches négatifs FUSE
    target_lowers = {magnet_name.lower(), stem_name.lower()}
    try:
        with os.scandir(mount_dir) as it:
            for entry in it:
                if entry.name.lower() in target_lowers:
                    p = Path(entry.path)
                    try:
                        if entry.is_file():
                            return [p]
                        if entry.is_dir():
                            matched = _collect_from_folder(p, allowed_exts, expected_set)
                            if matched:
                                return matched
                    except OSError:
                        continue
    except OSError:
        pass

    # 2. Accès direct forcé par listdir() / stat() sur les chemins probables
    for cand in [mount_dir / magnet_name, mount_dir / stem_name]:
        try:
            if cand.is_file():
                return [cand]
            os.listdir(cand)
            matched = _collect_from_folder(cand, allowed_exts, expected_set)
            if matched:
                return matched
        except OSError:
            continue

    # 3. Test direct <dossier_candidat>/<fichier_attendu>
    for exp in expected_set:
        for base_cand in [mount_dir, mount_dir / magnet_name, mount_dir / stem_name]:
            direct_file = base_cand / exp
            try:
                if direct_file.is_file():
                    return [direct_file]
            except OSError:
                continue

    return []


def materialize_files_for_torrent(
    entry: Dict[str, Any], source_files: List[Path], mode: str, dest_dir: Path
) -> Tuple[str, List[str]]:
    dest_dir.mkdir(parents=True, exist_ok=True)
    clean_root_name = sanitize_filename(entry["name"])
    created_paths: List[str] = []

    def _transfer(src: Path, dst: Path) -> None:
        if dst.exists() or dst.is_symlink():
            dst.unlink()
        if mode == "download":
            tmp_dst = dst.with_name(f".{dst.name}.part")
            if tmp_dst.exists():
                tmp_dst.unlink()
            shutil.copyfile(src, tmp_dst)
            os.replace(tmp_dst, dst)
        else:
            os.symlink(src, dst)

    if len(source_files) == 1:
        src = source_files[0]
        dst = dest_dir / src.name
        _transfer(src, dst)
        return str(dst), [str(dst)]

    release_dir = dest_dir / clean_root_name
    release_dir.mkdir(parents=True, exist_ok=True)
    for src in source_files:
        dst = release_dir / src.name
        _transfer(src, dst)
        created_paths.append(str(dst))

    return str(release_dir), created_paths


def remove_local_artifacts(item: Dict[str, Any]) -> None:
    for lp in item.get("linked_paths", []):
        try:
            p = Path(lp)
            if p.is_symlink() or p.is_file():
                p.unlink(missing_ok=True)
        except OSError:
            pass
    cpath = Path(item.get("content_path", ""))
    save_root = str(item.get("save_path") or settings_db["download_base_dir"])
    if cpath.is_symlink() or cpath.is_file():
        cpath.unlink(missing_ok=True)
    elif cpath.is_dir() and str(cpath).startswith(save_root) and str(cpath) != save_root:
        for child in cpath.iterdir():
            if child.is_symlink() or child.is_file():
                child.unlink(missing_ok=True)
        try:
            cpath.rmdir()
        except OSError:
            pass


def is_already_imported_by_arr(item: Dict[str, Any]) -> bool:
    linked_paths = item.get("linked_paths") or []
    if linked_paths:
        return all(not os.path.lexists(p) for p in linked_paths)
    cpath_str = item.get("content_path", "")
    if not cpath_str:
        return False
    cpath = Path(cpath_str)
    if not os.path.lexists(cpath):
        return True
    if cpath.is_dir():
        return len(list(cpath.iterdir())) == 0
    return False
