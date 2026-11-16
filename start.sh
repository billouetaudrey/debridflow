#!/usr/bin/env bash
cd "$(dirname "$0")"

if [ ! -d "venv" ]; then
  echo "[!] Environnement virtuel non trouvé. Lancez d'abord ./install.sh"
  exit 1
fi

source venv/bin/activate
exec uvicorn app.main:app --host 0.0.0.0 --port 6505
