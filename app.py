"""OmniSym - Multi-Debrid Symlink & Download Client.

Point d'entrée principal pour compatibilité avec Uvicorn et Docker Compose.
Architecture modulaire organisée dans le package `app/`.
"""

from app.main import app

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=6505, reload=True)
