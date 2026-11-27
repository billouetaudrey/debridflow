import base64
import hashlib
import re
import urllib.parse
from typing import Any, Tuple


def _bdecode(data: bytes, idx: int = 0) -> Tuple[Any, int]:
    token = data[idx : idx + 1]
    if token == b"i":
        end = data.index(b"e", idx)
        return int(data[idx + 1 : end]), end + 1
    if token == b"l":
        idx += 1
        items = []
        while data[idx : idx + 1] != b"e":
            val, idx = _bdecode(data, idx)
            items.append(val)
        return items, idx + 1
    if token == b"d":
        idx += 1
        mapping = {}
        while data[idx : idx + 1] != b"e":
            key, idx = _bdecode(data, idx)
            val, idx = _bdecode(data, idx)
            mapping[key] = val
        return mapping, idx + 1
    if token.isdigit():
        colon = data.index(b":", idx)
        length = int(data[idx:colon])
        start = colon + 1
        return data[start : start + length], start + length
    raise ValueError("Bencode invalide")


def _bencode(obj: Any) -> bytes:
    if isinstance(obj, int):
        return f"i{obj}e".encode()
    if isinstance(obj, bytes):
        return f"{len(obj)}:".encode() + obj
    if isinstance(obj, str):
        raw = obj.encode("utf-8")
        return f"{len(raw)}:".encode() + raw
    if isinstance(obj, list):
        return b"l" + b"".join(_bencode(i) for i in obj) + b"e"
    if isinstance(obj, dict):
        items = sorted(obj.items(), key=lambda kv: kv[0] if isinstance(kv[0], bytes) else kv[0].encode())
        return b"d" + b"".join(_bencode(k) + _bencode(v) for k, v in items) + b"e"
    raise TypeError(f"Type bencode non supporté : {type(obj)}")


def parse_torrent_bytes(raw_bytes: bytes) -> Tuple[str, str]:
    """Extrait le hash SHA1 et le nom d'un fichier .torrent brut."""
    decoded, _ = _bdecode(raw_bytes, 0)
    info = decoded[b"info"]
    info_hash = hashlib.sha1(_bencode(info)).hexdigest().lower()
    raw_name = info.get(b"name.utf-8") or info.get(b"name") or info_hash.encode()
    name = raw_name.decode("utf-8", errors="replace")
    return info_hash, name


def parse_magnet_uri(magnet: str) -> Tuple[str, str]:
    """Extrait le hash et le nom (dn) d'un URI magnet ou d'un hash brut."""
    raw = magnet.strip()
    if len(raw) == 40 and all(c in "0123456789abcdefABCDEF" for c in raw):
        return raw.lower(), raw.lower()

    parsed = urllib.parse.urlparse(raw)
    params = urllib.parse.parse_qs(parsed.query)
    xt_list = params.get("xt", [])
    info_hash = ""
    for xt in xt_list:
        if xt.lower().startswith("urn:btih:"):
            info_hash = xt.split(":")[-1].strip().lower()
            break
    if info_hash and len(info_hash) == 32:
        try:
            info_hash = base64.b32decode(info_hash.upper()).hex().lower()
        except Exception:
            pass
    if not info_hash:
        info_hash = hashlib.sha1(raw.encode()).hexdigest().lower()
    dn = params.get("dn", [info_hash])[0]
    name = urllib.parse.unquote_plus(dn).strip() or info_hash
    return info_hash, name


def sanitize_filename(name: str) -> str:
    """Nettoie les caractères interdits pour les systèmes de fichiers Linux / Windows."""
    return re.sub(r'[<>:"/\\|?*\x00-\x1f]', "_", name).strip()


def get_subfolder_name(name: str) -> str:
    """
    Retourne un nom de sous-dossier propre basé sur le nom du fichier / release / torrent.
    Si le nom se termine par une extension de fichier connue (.mkv, .mp4, .zip, etc.),
    celle-ci est retirée afin d'obtenir un nom de dossier élégant.
    """
    clean = sanitize_filename(name).strip()
    if not clean:
        return "telechargement"
    from pathlib import Path
    p = Path(clean)
    common_exts = {
        ".mkv", ".mp4", ".avi", ".mov", ".wmv", ".m4v", ".ts", ".webm",
        ".rar", ".zip", ".7z", ".tar", ".gz", ".iso", ".exe", ".pdf",
        ".mp3", ".flac", ".wav", ".aac", ".ogg"
    }
    if p.suffix.lower() in common_exts and p.stem:
        return p.stem
    return clean

