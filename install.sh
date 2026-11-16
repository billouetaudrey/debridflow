#!/usr/bin/env bash
# ==============================================================================
# PyRDT - Script d'installation automatique Bare-Metal (sans Docker)
# Compatible Debian, Ubuntu, Raspberry Pi OS, Fedora, Arch Linux, Alpine
# ==============================================================================

set -e

# Couleurs pour le terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${CYAN}${BOLD}"
echo "=========================================================="
echo "          PyRDT - Installation Autonome (Bare-Metal)      "
echo "=========================================================="
echo -e "${NC}"

# 1. Vérification des droits sudo / root
SUDO=""
if [ "$(id -u)" -ne 0 ]; then
  if command -v sudo >/dev/null 2>&1; then
    SUDO="sudo"
  else
    echo -e "${YELLOW}[!] Ce script nécessite les privilèges root ou sudo pour installer les dépendances système.${NC}"
  fi
fi

# 2. Détection de l'OS et du gestionnaire de paquets
echo -e "${BLUE}[*] Détection du système d'exploitation...${NC}"
PKG_MANAGER=""
OS_NAME=""

if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS_NAME="$ID"
fi

if command -v apt-get >/dev/null 2>&1; then
  PKG_MANAGER="apt"
elif command -v dnf >/dev/null 2>&1; then
  PKG_MANAGER="dnf"
elif command -v pacman >/dev/null 2>&1; then
  PKG_MANAGER="pacman"
elif command -v apk >/dev/null 2>&1; then
  PKG_MANAGER="apk"
fi

# 3. Vérification de Python 3 et du module venv
NEED_PYTHON_INSTALL=0

if ! command -v python3 >/dev/null 2>&1; then
  echo -e "${YELLOW}[!] Python 3 n'est pas installé sur le système.${NC}"
  NEED_PYTHON_INSTALL=1
else
  PY_VER=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
  PY_MAJOR=$(python3 -c "import sys; print(sys.version_info.major)")
  PY_MINOR=$(python3 -c "import sys; print(sys.version_info.minor)")
  
  if [ "$PY_MAJOR" -lt 3 ] || ([ "$PY_MAJOR" -eq 3 ] && [ "$PY_MINOR" -lt 10 ]); then
    echo -e "${YELLOW}[!] Python $PY_VER détecté. PyRDT requiert Python 3.10 ou supérieur.${NC}"
    NEED_PYTHON_INSTALL=1
  else
    echo -e "${GREEN}[✓] Python $PY_VER détecté (compatible).${NC}"
  fi
fi

# Vérifier si python3 -m venv fonctionne
if [ "$NEED_PYTHON_INSTALL" -eq 0 ]; then
  if ! python3 -m venv --help >/dev/null 2>&1; then
    echo -e "${YELLOW}[!] Le module python3-venv est manquant.${NC}"
    NEED_PYTHON_INSTALL=1
  fi
fi

# 4. Installation des paquets système requis si nécessaire
if [ "$NEED_PYTHON_INSTALL" -eq 1 ]; then
  echo -e "${BLUE}[*] Installation des dépendances Python requises...${NC}"
  case "$PKG_MANAGER" in
    apt)
      $SUDO apt-get update -y
      $SUDO apt-get install -y python3 python3-pip python3-venv python3-full
      ;;
    dnf)
      $SUDO dnf install -y python3 python3-pip
      ;;
    pacman)
      $SUDO pacman -Sy --noconfirm python python-pip
      ;;
    apk)
      $SUDO apk add --no-cache python3 py3-pip py3-virtualenv
      ;;
    *)
      echo -e "${RED}[ERROR] Impossible de déterminer le gestionnaire de paquets.${NC}"
      echo "Veuillez installer manuellement Python 3.10+, pip et venv sur votre système."
      exit 1
      ;;
  esac
fi

# 5. Création de l'environnement virtuel (venv)
echo -e "${BLUE}[*] Configuration de l'environnement virtuel isolé (venv)...${NC}"
if [ ! -d "venv" ]; then
  python3 -m venv venv
  echo -e "${GREEN}[✓] Environnement virtuel créé dans ./venv${NC}"
else
  echo -e "${GREEN}[✓] Environnement virtuel existant réutilisé.${NC}"
fi

# 6. Installation des dépendances Python
echo -e "${BLUE}[*] Installation des paquets Python (FastAPI, Uvicorn, HTTPX)...${NC}"
./venv/bin/pip install --upgrade pip --quiet
./venv/bin/pip install -r requirements.txt --quiet
echo -e "${GREEN}[✓] Dépendances Python installées avec succès.${NC}"

# 7. Création du dossier de données
mkdir -p "$SCRIPT_DIR/data"
echo -e "${GREEN}[✓] Dossier de persistance configuré : $SCRIPT_DIR/data${NC}"

# 8. Génération du script de lancement rapide start.sh
cat << 'EOF' > "$SCRIPT_DIR/start.sh"
#!/usr/bin/env bash
cd "$(dirname "$0")"
source venv/bin/activate
exec uvicorn app.main:app --host 0.0.0.0 --port 6505
EOF
chmod +x "$SCRIPT_DIR/start.sh"
echo -e "${GREEN}[✓] Script de démarrage généré : ./start.sh${NC}"

# 9. Proposition d'installation en service systemd
if command -v systemctl >/dev/null 2>&1 && [ -n "$SUDO" -o "$(id -u)" -eq 0 ]; then
  echo ""
  echo -e "${CYAN}Voulez-vous installer PyRDT en tant que service système systemd ?${NC}"
  echo "(Permet de lancer PyRDT en arrière-plan et au démarrage de la machine)"
  read -r -p "Installer le service systemd ? [o/N] : " INSTALL_SYSTEMD
  
  if [[ "$INSTALL_SYSTEMD" =~ ^[oOyY]$ ]]; then
    CURRENT_USER="$(logname 2>/dev/null || echo "$SUDO_USER" | grep -v root || whoami)"
    SERVICE_FILE="/etc/systemd/system/pyrdt.service"
    
    echo -e "${BLUE}[*] Création du service systemd dans $SERVICE_FILE...${NC}"
    $SUDO bash -c "cat << EOF > $SERVICE_FILE
[Unit]
Description=PyRDT - Multi-Debrid Symlink & Download Client
After=network.target

[Service]
Type=simple
User=$CURRENT_USER
WorkingDirectory=$SCRIPT_DIR
ExecStart=$SCRIPT_DIR/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 6505
Restart=always
RestartSec=5
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
EOF"

    $SUDO systemctl daemon-reload
    $SUDO systemctl enable pyrdt.service
    $SUDO systemctl restart pyrdt.service
    
    echo -e "${GREEN}[✓] Service systemd 'pyrdt' activé et démarré !${NC}"
    echo "    - Voir les logs : sudo journalctl -u pyrdt -f"
    echo "    - Statut        : sudo systemctl status pyrdt"
    echo "    - Arrêter       : sudo systemctl stop pyrdt"
  fi
fi

echo ""
echo -e "${GREEN}${BOLD}==========================================================${NC}"
echo -e "${GREEN}${BOLD}           Installation de PyRDT terminée avec succès !    ${NC}"
echo -e "${GREEN}${BOLD}==========================================================${NC}"
echo ""
echo -e "Pour démarrer PyRDT manuellement :"
echo -e "  ${CYAN}./start.sh${NC}"
echo ""
echo -e "Accès Web : ${BOLD}http://localhost:6505${NC} ou ${BOLD}http://<IP_DE_VOTRE_MACHINE>:6505${NC}"
echo ""
