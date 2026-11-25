import os
import re
import shutil
import time
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple

import httpx

from app.bencode import sanitize_filename
from app.config import logger
from app.state import get_allowed_exts, get_ignored_exts, settings_db


def simplify_name(name: str) -> str:
    """Normalise un nom de fichier/dossier pour comparaison souple (minuscules, sans ponctuation)."""
    if not name:
        return ""
    s = Path(name).stem.lower()
    return re.sub(r"[^a-z0-9]", "", s)


async def refresh_rclone_vfs(dir_name: str = "magnets") -> bool:
    """
    Déclenche une invalidation immédiate du cache VFS de rclone via son API Remote Control (RC).
    Permet à rclone de rafraîchir l'arborescence AllDebrid sans attendre l'expiration du dir-cache-time.
    """
    rc_url = settings_db.get("rclone_rc_url", "http://127.0.0.1:5572").rstrip("/")
    if not rc_url:
        return False
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.post(
                f"{rc_url}/vfs/refresh",
                json={"dir": dir_name, "recursive": "false"},
            )
            if resp.status_code == 200:
                logger.debug(f"Rclone VFS refresh OK pour le dossier '{dir_name}'")
                return True
            else:
                logger.warning(f"Rclone VFS refresh HTTP {resp.status_code} ({dir_name}): {resp.text}")
                return False
    except Exception as exc:
        logger.debug(f"Impossible de contacter l'API rclone RC ({rc_url}): {exc}")
        return False


def copy_chunked_with_limit(
    src: Path,
    dst: Path,
    speed_limit_bytes: int = 0,
    progress_callback: Optional[Callable[[int, int, float], None]] = None,
    total_expected: int = 0,
    already_copied: int = 0,
) -> int:
    """
    Copie src vers dst par blocs (chunks) avec limitation de vitesse et callback de progression.
    Retourne le nombre d'octets copiés pour ce fichier.
    """
    chunk_size = 256 * 1024  # 256 KB
    copied = 0
    t_start = time.time()
    last_callback_time = t_start
    last_callback_bytes = 0

    with open(src, "rb") as fsrc, open(dst, "wb") as fdst:
        while True:
            chunk_start = time.time()
            buf = fsrc.read(chunk_size)
            if not buf:
                break
            fdst.write(buf)
            buf_len = len(buf)
            copied += buf_len

            # Limitation de vitesse si active
            if speed_limit_bytes > 0:
                elapsed_chunk = time.time() - chunk_start
                expected_chunk_time = buf_len / speed_limit_bytes
                if elapsed_chunk < expected_chunk_time:
                    time.sleep(expected_chunk_time - elapsed_chunk)

            # Notification de progression périodique (toutes les 0.5s)
            now = time.time()
            if progress_callback and (now - last_callback_time >= 0.5):
                interval_bytes = copied - last_callback_bytes
                interval_time = max(0.001, now - last_callback_time)
                instant_speed = interval_bytes / interval_time
                progress_callback(already_copied + copied, total_expected, instant_speed)
                last_callback_time = now
                last_callback_bytes = copied

    if progress_callback:
        total_time = max(0.001, time.time() - t_start)
        instant_speed = copied / total_time
        progress_callback(already_copied + copied, total_expected, instant_speed)

    return copied


def _collect_from_folder(
    folder: Path, allowed_exts: set, expected_set: set, ignored_exts: Optional[set] = None
) -> List[Path]:
    if ignored_exts is None:
        ignored_exts = get_ignored_exts()
    found: List[Path] = []
    for root, _, files in os.walk(folder):
        for f in files:
            p = Path(root) / f
            sfx = p.suffix.lower()
            if sfx in ignored_exts:
                continue
            if sfx in allowed_exts or f in expected_set:
                found.append(p)
    return found


def find_mounted_files(
    magnet_name: str,
    expected_files: List[str],
    ad_id: Optional[int] = None,
) -> List[Path]:
    mount_dir = Path(settings_db["rclone_mount_dir"])
    allowed_exts = get_allowed_exts()
    ignored_exts = get_ignored_exts()
    expected_set = {
        Path(f).name
        for f in expected_files
        if f and Path(f).suffix.lower() not in ignored_exts
    }
    stem_name = Path(magnet_name).stem
    sim_target = simplify_name(magnet_name)

    # Candidats directs avec ad_id si AllDebrid a suffixé le dossier (ex: "<nom> (<ad_id>)")
    id_candidates: List[Path] = []
    if ad_id:
        id_candidates.extend([
            mount_dir / f"{magnet_name} ({ad_id})",
            mount_dir / f"{stem_name} ({ad_id})",
        ])
        for cand in id_candidates:
            try:
                if cand.is_file():
                    if cand.suffix.lower() not in ignored_exts:
                        return [cand]
                    continue
                if cand.is_dir():
                    matched = _collect_from_folder(cand, allowed_exts, expected_set, ignored_exts)
                    if matched:
                        return matched
            except OSError:
                continue

    # 1. Forcer un readdir sur la racine pour invalider les caches négatifs FUSE
    target_lowers = {magnet_name.lower(), stem_name.lower()}
    if ad_id:
        target_lowers.add(f"{magnet_name.lower()} ({ad_id})")
        target_lowers.add(f"{stem_name.lower()} ({ad_id})")

    try:
        with os.scandir(mount_dir) as it:
            for entry in it:
                entry_sim = simplify_name(entry.name)
                if entry.name.lower() in target_lowers or (sim_target and entry_sim == sim_target):
                    p = Path(entry.path)
                    try:
                        if entry.is_file():
                            if p.suffix.lower() not in ignored_exts:
                                return [p]
                            continue
                        if entry.is_dir():
                            matched = _collect_from_folder(p, allowed_exts, expected_set, ignored_exts)
                            if matched:
                                return matched
                    except OSError:
                        continue
    except OSError:
        pass

    # 2. Accès direct forcé par listdir() / stat() sur les chemins probables
    for cand in [mount_dir / magnet_name, mount_dir / stem_name] + id_candidates:
        try:
            if cand.is_file():
                if cand.suffix.lower() not in ignored_exts:
                    return [cand]
                continue
            os.listdir(cand)
            matched = _collect_from_folder(cand, allowed_exts, expected_set, ignored_exts)
            if matched:
                return matched
        except OSError:
            continue

    # 3. Test direct <dossier_candidat>/<fichier_attendu> ou sous-chemin attendu
    candidates = [mount_dir, mount_dir / magnet_name, mount_dir / stem_name] + id_candidates
    for exp_raw in expected_files:
        if not exp_raw:
            continue
        exp_path = Path(exp_raw)
        if exp_path.suffix.lower() in ignored_exts:
            continue
        for base_cand in candidates:
            for test_target in [base_cand / exp_path, base_cand / exp_path.name]:
                try:
                    if test_target.is_file():
                        if base_cand != mount_dir and base_cand.is_dir():
                            matched = _collect_from_folder(base_cand, allowed_exts, expected_set, ignored_exts)
                            if matched:
                                return matched
                        if test_target.suffix.lower() not in ignored_exts:
                            return [test_target]
                except OSError:
                    continue

    return []


def materialize_files_for_torrent(
    entry: Dict[str, Any],
    source_files: List[Path],
    mode: str,
    dest_dir: Path,
    speed_limit_bytes: int = 0,
    progress_callback: Optional[Callable[[int, int, float], None]] = None,
) -> Tuple[str, List[str], int, float]:
    dest_dir.mkdir(parents=True, exist_ok=True)
    ignored_exts = get_ignored_exts()
    source_files = [f for f in source_files if f.suffix.lower() not in ignored_exts]
    if not source_files:
        return str(dest_dir), [], 0, 0.0

    clean_root_name = sanitize_filename(entry["name"])
    created_paths: List[str] = []
    total_copied_bytes = 0
    t_transfer_start = time.time()
    info_h = str(entry.get("hash") or "")[:8]

    total_expected_bytes = int(entry.get("size") or sum(f.stat().st_size for f in source_files if f.exists()))

    def _transfer(src: Path, dst: Path, already_copied: int) -> int:
        dst.parent.mkdir(parents=True, exist_ok=True)
        # Si le fichier de destination existe déjà et possède exactement la même taille que la source, il est complet
        if mode == "download" and dst.exists() and not dst.is_symlink():
            try:
                src_sz = src.stat().st_size
                if dst.stat().st_size == src_sz:
                    if progress_callback:
                        progress_callback(already_copied + src_sz, total_expected_bytes, 0.0)
                    return src_sz
            except OSError:
                pass

        if dst.exists() or dst.is_symlink():
            try:
                dst.unlink()
            except OSError:
                pass

        if mode == "download":
            part_name = f".{dst.name}.{info_h}.part" if info_h else f".{dst.name}.part"
            tmp_dst = dst.with_name(part_name)
            if tmp_dst.exists():
                try:
                    tmp_dst.unlink()
                except OSError:
                    pass
            bytes_copied = copy_chunked_with_limit(
                src,
                tmp_dst,
                speed_limit_bytes=speed_limit_bytes,
                progress_callback=progress_callback,
                total_expected=total_expected_bytes,
                already_copied=already_copied,
            )
            if tmp_dst.exists():
                os.replace(tmp_dst, dst)
            elif dst.exists() and dst.stat().st_size == src.stat().st_size:
                pass
            else:
                raise FileNotFoundError(f"Fichier temporaire disparu après copie : {tmp_dst}")
            return bytes_copied
        else:
            os.symlink(src, dst)
            return 0

    if len(source_files) == 1:
        src = source_files[0]
        dst = dest_dir / src.name
        bytes_copied = _transfer(src, dst, 0)
        total_copied_bytes += bytes_copied
        duration = max(0.001, time.time() - t_transfer_start)
        return str(dst), [str(dst)], total_copied_bytes, duration

    release_dir = dest_dir / clean_root_name
    release_dir.mkdir(parents=True, exist_ok=True)
    for src in source_files:
        dst = release_dir / src.name
        bytes_copied = _transfer(src, dst, total_copied_bytes)
        total_copied_bytes += bytes_copied
        created_paths.append(str(dst))

    duration = max(0.001, time.time() - t_transfer_start)
    return str(release_dir), created_paths, total_copied_bytes, duration


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


def download_http_file_chunked(
    url: str,
    dst: Path,
    tmp_dst: Path,
    speed_limit_bytes: int = 0,
    total_expected: int = 0,
    progress_callback: Optional[Callable[[int, int, float], None]] = None,
) -> Tuple[int, float]:
    """
    Télécharge un fichier HTTP/HTTPS en streaming par blocs avec limitation de vitesse
    et callback de progression vers un fichier temporaire tmp_dst avant renommage en dst.
    """
    chunk_size = 256 * 1024  # 256 KB
    copied = 0
    t_start = time.time()
    last_callback_time = t_start
    last_callback_bytes = 0

    if tmp_dst.exists():
        tmp_dst.unlink()

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) OmniSym",
    }

    with httpx.Client(follow_redirects=True, timeout=60.0) as client:
        with client.stream("GET", url, headers=headers) as resp:
            resp.raise_for_status()
            content_len = resp.headers.get("content-length")
            if content_len and content_len.isdigit():
                exp = int(content_len)
                if exp > 0:
                    total_expected = exp

            with open(tmp_dst, "wb") as fdst:
                for chunk in resp.iter_bytes(chunk_size=chunk_size):
                    chunk_start = time.time()
                    if not chunk:
                        continue
                    fdst.write(chunk)
                    buf_len = len(chunk)
                    copied += buf_len

                    if speed_limit_bytes > 0:
                        elapsed_chunk = time.time() - chunk_start
                        expected_chunk_time = buf_len / speed_limit_bytes
                        if elapsed_chunk < expected_chunk_time:
                            time.sleep(expected_chunk_time - elapsed_chunk)

                    now = time.time()
                    if progress_callback and (now - last_callback_time >= 0.5):
                        interval_bytes = copied - last_callback_bytes
                        interval_time = max(0.001, now - last_callback_time)
                        instant_speed = interval_bytes / interval_time
                        progress_callback(copied, total_expected, instant_speed)
                        last_callback_time = now
                        last_callback_bytes = copied

    if progress_callback:
        total_time = max(0.001, time.time() - t_start)
        instant_speed = copied / total_time
        progress_callback(copied, total_expected, instant_speed)

    if dst.exists() or dst.is_symlink():
        dst.unlink()
    os.replace(tmp_dst, dst)
    duration = max(0.001, time.time() - t_start)
    return copied, duration
