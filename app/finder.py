import asyncio
import base64
import html
import json
import os
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple
from urllib.parse import parse_qs, quote_plus, unquote, urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from ddgs import DDGS

from app.config import logger

def _get_finder_config_file() -> Path:
    env_val = os.getenv("STATE_FILE")
    if env_val:
        return Path(env_val).parent / "finder_config.json"
    if Path("/data").is_dir() and os.access("/data", os.W_OK):
        return Path("/data/finder_config.json")
    return Path(__file__).resolve().parent.parent / "data" / "finder_config.json"


CONFIG_FILE = _get_finder_config_file()

AVAILABLE_ENGINES: List[Tuple[str, str]] = [
    ("duckduckgo", "DuckDuckGo"),
    ("brave", "Brave"),
    ("bing", "Bing"),
    ("yandex", "Yandex"),
    ("google", "Google"),
    ("yahoo", "Yahoo"),
    ("mojeek", "Mojeek"),
    ("lite", "DDG Lite"),
]
ENGINE_LABELS: Dict[str, str] = dict(AVAILABLE_ENGINES)

DEFAULT_TRACKERS: List[str] = [
    "udp://tracker.opentrackr.org:1337/announce",
    "udp://open.stealth.si:80/announce",
    "udp://tracker.torrent.eu.org:451/announce",
    "udp://tracker.bittor.pw:1337/announce",
    "udp://public.popcorn-tracker.org:6969/announce",
    "udp://tracker.dler.org:6969/announce",
    "udp://exodus.desync.com:6969/announce",
    "udp://open.demonii.com:1337/announce",
]

DEFAULT_FINDER_CONFIG: Dict[str, Any] = {
    "search_mode": "torrent",
    "site_filter": "rapidgator.net",
    "engines": ["lite", "yahoo", "yandex", "brave"],
    "safesearch": "off",
    "region": "fr-fr",
    "max_results": 25,
    "max_pages_to_scrape": 18,
    "min_similarity": 10,
    "verify_links": True,
    "timeout": 8,
    "max_workers": 8,
    "user_agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    ),
}

NOISE_WORDS: Set[str] = {
    "download", "file", "fast", "and", "secure", "rapidgator", "net",
    "http", "https", "www", "html", "rar", "zip", "mp4", "mkv", "avi",
    "1080p", "720p", "2160p", "4k", "xxx", "ktr", "torrent", "magnet",
    "free", "online", "watch", "full", "hd"
}


def load_finder_config() -> Dict[str, Any]:
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                merged = dict(DEFAULT_FINDER_CONFIG)
                merged.update(data)
                if merged.get("region") == "wt-wt":
                    merged["region"] = "fr-fr"
                if not merged.get("engines"):
                    merged["engines"] = list(DEFAULT_FINDER_CONFIG["engines"])
                return merged
        except Exception as exc:
            logger.warning(f"Impossible de lire finder_config.json: {exc}")
    return dict(DEFAULT_FINDER_CONFIG)


def save_finder_config(cfg: Dict[str, Any]) -> None:
    CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2, ensure_ascii=False)


def normalize_btih(raw_hash: str) -> str:
    raw_hash = raw_hash.strip()
    if len(raw_hash) == 32:
        try:
            return base64.b32decode(raw_hash.upper()).hex().lower()
        except Exception:
            return raw_hash.lower()
    return raw_hash.lower()


def extract_btih_from_magnet(magnet_url: str) -> str:
    m = re.search(r"xt=urn:btih:([a-zA-Z0-9]{32,40})", magnet_url, flags=re.I)
    if m:
        return normalize_btih(m.group(1))
    return ""


def parse_magnet_name(magnet_url: str) -> str:
    try:
        qs = parse_qs(urlparse(magnet_url).query)
        dn = qs.get("dn", [""])[0]
        return unquote(dn).replace("+", " ").strip()
    except Exception:
        return ""


def build_magnet(btih: str, display_name: str = "") -> str:
    btih = normalize_btih(btih)
    magnet = f"magnet:?xt=urn:btih:{btih}"
    if display_name:
        magnet += f"&dn={quote_plus(display_name)}"
    for tr in DEFAULT_TRACKERS:
        magnet += f"&tr={quote_plus(tr)}"
    return magnet


def enrich_magnet_trackers(magnet_url: str) -> str:
    magnet_url = html.unescape(magnet_url).strip()
    if "&tr=" not in magnet_url.lower():
        for tr in DEFAULT_TRACKERS[:5]:
            magnet_url += f"&tr={quote_plus(tr)}"
    return magnet_url


def canonical_url_key(url: str) -> str:
    if url.lower().startswith("magnet:?"):
        btih = extract_btih_from_magnet(url)
        if btih:
            return f"btih:{btih}"
    m = re.search(r"rapidgator\.net/file/([a-f0-9]{16,64})", url, flags=re.I)
    if m:
        return f"rg:{m.group(1).lower()}"
    return url.strip().rstrip("/").lower()


def extract_filename_from_url(url: str) -> str:
    if url.lower().startswith("magnet:?"):
        return parse_magnet_name(url)
    path = unquote(urlparse(url).path).strip("/")
    parts = path.split("/")
    if len(parts) >= 3 and parts[0].lower() == "file":
        name = re.sub(r"\.html?$", "", parts[2], flags=re.I)
        return name.replace("_", " ")
    if parts and parts[-1].lower().endswith(".torrent"):
        return re.sub(r"\.torrent$", "", parts[-1], flags=re.I).replace("_", " ").replace(".", " ")
    return ""


def normalize_text(text: str) -> str:
    text = unquote(text or "").lower()
    text = re.sub(r"[^a-z0-9]+", " ", text)
    tokens = [t for t in text.split() if t not in NOISE_WORDS and len(t) > 1]
    return " ".join(tokens)


def compute_similarity(query: str, candidate: str) -> int:
    q_norm = normalize_text(query)
    c_norm = normalize_text(candidate)
    if not q_norm or not c_norm:
        return 0

    q_tokens = set(q_norm.split())
    c_tokens = set(c_norm.split())

    token_coverage = len(q_tokens & c_tokens) / len(q_tokens) if q_tokens else 0.0
    seq_ratio = SequenceMatcher(None, q_norm, c_norm).ratio()

    score = (0.70 * token_coverage) + (0.30 * seq_ratio)
    return min(100, round(score * 100))


def _run_ddgs_call(backend: str, full_query: str, safesearch: str, region: str, max_results: int) -> List[Dict[str, Any]]:
    found = []
    with DDGS() as ddgs:
        raw = ddgs.text(
            full_query,
            region=region,
            safesearch=safesearch,
            max_results=max_results,
            backend=backend,
        )
        for item in raw or []:
            url = (item.get("href") or item.get("url") or "").strip()
            if not url:
                continue
            found.append({
                "url": url,
                "title": item.get("title", ""),
                "snippet": item.get("body", ""),
            })
    return found


def query_single_engine(
    backend: str,
    full_query: str,
    safesearch: str,
    region: str,
    max_results: int,
) -> Tuple[str, List[Dict[str, Any]], str]:
    last_error = ""
    for attempt in range(2):
        try:
            found = _run_ddgs_call(backend, full_query, safesearch, region, max_results)
            return backend, found, ""
        except Exception as exc:
            last_error = str(exc)
            if attempt == 0:
                time.sleep(0.8)

    if backend == "duckduckgo":
        try:
            found = _run_ddgs_call("lite", full_query, safesearch, region, max_results)
            return backend, found, ""
        except Exception as exc:
            last_error = str(exc)

    return backend, [], last_error


def run_parallel_engine_queries(
    queries: List[str],
    engines: List[str],
    safesearch: str,
    region: str,
    max_results: int,
) -> Tuple[List[Dict[str, Any]], Dict[str, int], Dict[str, str]]:
    safe_region = "fr-fr" if not region or region == "wt-wt" else region.strip()
    active_engines = [e for e in engines if e in ENGINE_LABELS] or ["lite"]

    merged_pages: Dict[str, Dict[str, Any]] = {}
    engine_counts: Dict[str, int] = {ENGINE_LABELS[e]: 0 for e in active_engines}
    engine_errors: Dict[str, str] = {}

    tasks = [(backend, q) for backend in active_engines for q in queries]

    # Limité à 3 workers simultanés pour éviter les blocages / connection reset
    with ThreadPoolExecutor(max_workers=min(3, max(1, len(tasks)))) as executor:
        futures = [
            executor.submit(query_single_engine, backend, q, safesearch, safe_region, max_results)
            for backend, q in tasks
        ]
        for fut in as_completed(futures):
            backend, items, err = fut.result()
            label = ENGINE_LABELS.get(backend, backend)
            engine_counts[label] = engine_counts.get(label, 0) + len(items)
            if err and engine_counts[label] == 0:
                engine_errors[label] = err
            elif engine_counts[label] > 0 and label in engine_errors:
                del engine_errors[label]

            for item in items:
                key = canonical_url_key(item["url"])
                if key not in merged_pages:
                    item["engines"] = [label]
                    merged_pages[key] = item
                else:
                    existing = merged_pages[key]
                    if label not in existing["engines"]:
                        existing["engines"].append(label)
                    if len(item["url"]) > len(existing["url"]):
                        existing["url"] = item["url"]
                    if len(item.get("title", "")) > len(existing.get("title", "")):
                        existing["title"] = item["title"]
                    if len(item.get("snippet", "")) > len(existing.get("snippet", "")):
                        existing["snippet"] = item["snippet"]

    return list(merged_pages.values()), engine_counts, engine_errors


def extract_torrents_from_page(page_item: Dict[str, Any], query: str, timeout: int, user_agent: str) -> List[Dict[str, Any]]:
    page_url = page_item["url"]
    engines = page_item.get("engines", [])
    page_title = page_item.get("title", "")
    extracted = []

    if page_url.lower().startswith("magnet:?"):
        clean_mag = enrich_magnet_trackers(page_url)
        extracted.append({
            "url": clean_mag,
            "kind": "magnet",
            "detected_name": parse_magnet_name(clean_mag) or page_title or "Magnet",
            "title": page_title,
            "snippet": page_item.get("snippet", ""),
            "engines": engines,
            "source_url": page_url,
            "alive": True,
            "verified": True,
            "status": "Magnet OK",
        })
        return extracted

    if re.search(r"\.torrent(?:\?|$)", page_url, flags=re.I):
        extracted.append({
            "url": page_url,
            "kind": "torrent",
            "detected_name": extract_filename_from_url(page_url) or page_title,
            "title": page_title,
            "snippet": page_item.get("snippet", ""),
            "engines": engines,
            "source_url": page_url,
        })
        return extracted

    headers = {
        "User-Agent": user_agent,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
    }

    try:
        resp = requests.get(page_url, headers=headers, timeout=timeout, allow_redirects=True)
        if resp.status_code >= 400:
            return []

        raw_html = resp.text
        soup = BeautifulSoup(raw_html, "html.parser")
        real_title = soup.title.string.strip() if (soup.title and soup.title.string) else page_title

        seen_hashes = set()

        magnet_matches = re.findall(
            r"""magnet:\?xt=urn:btih:[a-zA-Z0-9]{32,40}[^\s"'<>]*""",
            raw_html,
            flags=re.I,
        )
        for raw_mag in magnet_matches:
            clean_mag = enrich_magnet_trackers(raw_mag)
            btih = extract_btih_from_magnet(clean_mag)
            if not btih or btih in seen_hashes:
                continue
            seen_hashes.add(btih)
            mag_name = parse_magnet_name(clean_mag) or real_title or f"Magnet {btih[:10]}"
            extracted.append({
                "url": clean_mag,
                "kind": "magnet",
                "detected_name": mag_name,
                "title": real_title,
                "snippet": f"Trouvé sur : {page_url}",
                "engines": engines,
                "source_url": page_url,
                "alive": True,
                "verified": True,
                "status": "Magnet OK",
            })

        seen_torrents = set()
        for a_tag in soup.find_all("a", href=True):
            href = a_tag["href"].strip()
            if re.search(r"\.torrent(?:\?|$)", href, flags=re.I):
                full_torrent_url = urljoin(page_url, href)
                if full_torrent_url in seen_torrents:
                    continue
                seen_torrents.add(full_torrent_url)
                link_text = a_tag.get_text(" ", strip=True)
                t_name = extract_filename_from_url(full_torrent_url) or link_text or real_title
                extracted.append({
                    "url": full_torrent_url,
                    "kind": "torrent",
                    "detected_name": t_name,
                    "title": real_title,
                    "snippet": f"Trouvé sur : {page_url}",
                    "engines": engines,
                    "source_url": page_url,
                })

        if not extracted:
            hash_matches = re.findall(
                r"(?:info[\s_-]*hash|btih|hash)[^a-fA-F0-9]{0,20}([a-fA-F0-9]{40})\b",
                raw_html,
                flags=re.I,
            )
            for h in hash_matches:
                btih = h.lower()
                if btih in seen_hashes:
                    continue
                seen_hashes.add(btih)
                guess_name = real_title or query
                rebuilt_mag = build_magnet(btih, guess_name)
                extracted.append({
                    "url": rebuilt_mag,
                    "kind": "magnet",
                    "detected_name": guess_name,
                    "title": real_title,
                    "snippet": f"InfoHash reconstruit depuis : {page_url}",
                    "engines": engines,
                    "source_url": page_url,
                    "alive": True,
                    "verified": True,
                    "status": "Hash -> Magnet",
                })

    except Exception:
        return []

    return extracted


def check_link(item: Dict[str, Any], timeout: int, user_agent: str) -> Dict[str, Any]:
    url = item["url"]
    if url.lower().startswith("magnet:?"):
        item["alive"] = True
        item["status"] = item.get("status") or "Magnet OK"
        return item

    url_name = extract_filename_from_url(url)
    if url_name and not item.get("detected_name"):
        item["detected_name"] = url_name

    headers = {
        "User-Agent": user_agent,
        "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
    }
    try:
        resp = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True, stream=True)
        if resp.status_code in (404, 410):
            item["alive"] = False
            item["status"] = f"HTTP {resp.status_code}"
            return item

        if resp.status_code in (403, 429, 503):
            item["alive"] = True
            item["status"] = f"Protégé (HTTP {resp.status_code})"
            return item

        if resp.status_code >= 400:
            item["alive"] = False
            item["status"] = f"HTTP {resp.status_code}"
            return item

        if item.get("kind") == "torrent" or re.search(r"\.torrent(?:\?|$)", url, flags=re.I):
            chunk = next(resp.iter_content(chunk_size=512), b"")
            ctype = resp.headers.get("Content-Type", "").lower()
            if chunk.startswith(b"d8:announce") or chunk.startswith(b"d13:announce") or "bittorrent" in ctype or "octet-stream" in ctype:
                item["alive"] = True
                item["status"] = "Torrent OK"
            else:
                item["alive"] = True
                item["status"] = "Lien .torrent"
            return item

        html_text = resp.text
        html_lower = html_text.lower()
        dead_markers = [
            "file not found",
            "error 404",
            "file was deleted",
            "the file you are looking for is not found",
            "this file has been removed",
        ]
        if any(marker in html_lower for marker in dead_markers):
            item["alive"] = False
            item["status"] = "Fichier supprimé"
            return item

        soup = BeautifulSoup(html_text, "html.parser")
        if soup.title and soup.title.string:
            page_title = soup.title.string.strip()
            page_title = re.sub(r"^Download file\s+", "", page_title, flags=re.I)
            page_title = re.sub(r"\s*-\s*Rapidgator\.net.*$", "", page_title, flags=re.I)
            if page_title and "rapidgator" not in page_title.lower() and "just a moment" not in page_title.lower():
                item["detected_name"] = page_title

        item["alive"] = True
        item["status"] = "OK"
        return item

    except requests.Timeout:
        item["alive"] = False
        item["status"] = "Timeout"
        return item
    except Exception as exc:
        item["alive"] = False
        item["status"] = f"Erreur ({type(exc).__name__})"
        return item


def build_search_queries(query: str, mode: str, site_filter: str) -> Tuple[List[str], List[str]]:
    clean_q = query.strip()
    spaced_q = re.sub(r"[._-]+", " ", clean_q).strip()

    hoster_queries = []
    torrent_queries = []

    if mode in ("hoster", "both"):
        if site_filter:
            hoster_queries.append(f"{clean_q} site:{site_filter}")
        else:
            hoster_queries.append(clean_q)

    if mode in ("torrent", "both"):
        torrent_queries.append(f"{clean_q} torrent")
        torrent_queries.append(f"{spaced_q} magnet")
        if spaced_q.lower() != clean_q.lower():
            torrent_queries.append(f"{spaced_q} torrent")

    return hoster_queries, torrent_queries


def execute_finder_search(
    query: str,
    search_mode: str = "torrent",
    site_filter: str = "rapidgator.net",
    engines: Optional[List[str]] = None,
    region: str = "fr-fr",
    safesearch: str = "off",
    max_results: int = 25,
    max_pages_to_scrape: int = 18,
    min_similarity: int = 10,
    verify_links: bool = True,
    timeout: int = 8,
    user_agent: Optional[str] = None,
    max_workers: int = 8,
) -> Dict[str, Any]:
    cfg = load_finder_config()
    ua = user_agent or cfg.get("user_agent") or DEFAULT_FINDER_CONFIG["user_agent"]
    active_engines = engines or cfg.get("engines") or DEFAULT_FINDER_CONFIG["engines"]

    hoster_queries, torrent_queries = build_search_queries(query, search_mode, site_filter)

    merged_candidates: Dict[str, Dict[str, Any]] = {}
    engine_counts: Dict[str, int] = {}
    engine_errors: Dict[str, str] = {}
    pages_scanned = 0

    if hoster_queries:
        h_items, h_counts, h_errors = run_parallel_engine_queries(
            hoster_queries, active_engines, safesearch, region, max_results
        )
        for k, v in h_counts.items():
            engine_counts[k] = engine_counts.get(k, 0) + v
        engine_errors.update(h_errors)

        for item in h_items:
            if site_filter and site_filter.lower() not in item["url"].lower():
                continue
            pages_scanned += 1
            item["kind"] = "hoster"
            key = canonical_url_key(item["url"])
            merged_candidates[key] = item

    if torrent_queries:
        t_pages, t_counts, t_errors = run_parallel_engine_queries(
            torrent_queries, active_engines, safesearch, region, max_results
        )
        for k, v in t_counts.items():
            engine_counts[k] = engine_counts.get(k, 0) + v
        for k, v in t_errors.items():
            if engine_counts.get(k, 0) == 0:
                engine_errors[k] = v

        t_pages.sort(
            key=lambda p: compute_similarity(query, f"{p.get('title', '')} {p['url']} {p.get('snippet', '')}"),
            reverse=True,
        )
        pages_to_visit = t_pages[:max_pages_to_scrape]
        pages_scanned += len(pages_to_visit)

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [
                executor.submit(extract_torrents_from_page, page, query, timeout, ua)
                for page in pages_to_visit
            ]
            for fut in as_completed(futures):
                for found_item in fut.result():
                    key = canonical_url_key(found_item["url"])
                    if key not in merged_candidates:
                        merged_candidates[key] = found_item
                    else:
                        existing = merged_candidates[key]
                        for eng in found_item.get("engines", []):
                            if eng not in existing.get("engines", []):
                                existing.setdefault("engines", []).append(eng)
                        if len(found_item["url"]) > len(existing["url"]):
                            existing["url"] = found_item["url"]

    candidates_list = list(merged_candidates.values())
    checked_items = []

    if verify_links and candidates_list:
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [executor.submit(check_link, item, timeout, ua) for item in candidates_list]
            for fut in as_completed(futures):
                res = fut.result()
                res["verified"] = True
                checked_items.append(res)
    else:
        for item in candidates_list:
            url_name = extract_filename_from_url(item["url"])
            if url_name and not item.get("detected_name"):
                item["detected_name"] = url_name
            item["alive"] = True
            item["verified"] = item.get("verified", False)
            item["status"] = item.get("status", "Non testé")
            checked_items.append(item)

    final_results = []
    rejected_results = []

    for item in checked_items:
        display_name = item.get("detected_name") or item.get("title") or item["url"]
        combined_text = f"{display_name} {item.get('title', '')} {item.get('snippet', '')} {item['url']}"
        score = compute_similarity(query, combined_text)

        entry = {
            "url": item["url"],
            "kind": item.get("kind", "hoster"),
            "display_name": display_name,
            "snippet": item.get("snippet", ""),
            "similarity": score,
            "verified": item.get("verified", False),
            "status": item.get("status", ""),
            "engines": item.get("engines", []),
        }

        if not item.get("alive", False):
            entry["reject_reason"] = item.get("status") or "Lien mort"
            rejected_results.append(entry)
        elif score < min_similarity:
            entry["reject_reason"] = f"Score {score}% < {min_similarity}%"
            rejected_results.append(entry)
        else:
            final_results.append(entry)

    final_results.sort(key=lambda x: x["similarity"], reverse=True)
    rejected_results.sort(key=lambda x: x["similarity"], reverse=True)

    return {
        "pages_scanned": pages_scanned,
        "engine_counts": engine_counts,
        "engine_errors": engine_errors,
        "results": final_results,
        "rejected": rejected_results,
    }


async def run_finder_search_async(**kwargs) -> Dict[str, Any]:
    return await asyncio.to_thread(execute_finder_search, **kwargs)
