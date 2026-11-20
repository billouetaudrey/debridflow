import asyncio
import base64
import hashlib
import secrets
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.responses import PlainTextResponse

from app.routers import finder, qbittorrent, scanner, web
from app.state import load_state, settings_db
from app.worker import background_worker


@asynccontextmanager
async def lifespan(app_instance: FastAPI):
    load_state()
    task = asyncio.create_task(background_worker())
    yield
    task.cancel()


app = FastAPI(title="PyRDT - Fast AllDebrid Symlink & Download Client", lifespan=lifespan)


# --- AUTHENTIFICATION OPTIONNELLE (UI + API QBITTORRENT) ---
@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    req_user = settings_db.get("username", "").strip()
    req_pass = settings_db.get("password", "").strip()
    if not req_user or not req_pass:
        return await call_next(request)

    if request.url.path == "/api/v2/auth/login":
        return await call_next(request)

    # Autoriser les ressources statiques même si non authentifié pour afficher la page de login proprement
    if request.url.path.startswith("/static/"):
        return await call_next(request)

    if request.cookies.get("SID") == hashlib.sha256(f"{req_user}:{req_pass}".encode()).hexdigest()[:32]:
        return await call_next(request)

    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Basic "):
        try:
            decoded = base64.b64decode(auth_header[6:]).decode("utf-8")
            u, p = decoded.split(":", 1)
            if secrets.compare_digest(u, req_user) and secrets.compare_digest(p, req_pass):
                return await call_next(request)
        except Exception:
            pass

    if request.url.path.startswith("/api/"):
        return PlainTextResponse("Forbidden", status_code=403)
    return Response(
        content="Authentification requise",
        status_code=401,
        headers={"WWW-Authenticate": 'Basic realm="PyRDT"'},
    )


# Enregistrement des routeurs
app.include_router(qbittorrent.router)
app.include_router(web.router)
app.include_router(scanner.router)
app.include_router(finder.router)
