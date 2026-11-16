"""PyRDT - Fast AllDebrid Symlink & Download Client.

Point d'entrée principal pour compatibilité avec Uvicorn et Docker Compose (uvicorn app:app).
Le code est scindé de manière modulaire dans le package `app/`.
"""

from app.main import app

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=6505, reload=True)
