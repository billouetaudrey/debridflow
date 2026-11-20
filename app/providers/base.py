from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

import httpx


class BaseDebridProvider(ABC):
    """Classe de base pour tous les fournisseurs de débridage."""

    name: str = ""
    display_name: str = ""
    default_api_base: str = ""

    @abstractmethod
    async def check_health(
        self,
        client: httpx.AsyncClient,
        api_key: str,
        api_base: Optional[str] = None,
        agent: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Vérifie la validité de la clé/token et l'état du compte utilisateur."""
        pass

    @abstractmethod
    async def upload_magnet(
        self, client: httpx.AsyncClient, magnet: str, api_key: str, api_base: str, agent: str
    ) -> Dict[str, Any]:
        """Ajoute un magnet et retourne un dict standardisé {'id': ..., 'name': ..., 'size': ...}."""
        pass

    @abstractmethod
    async def upload_file(
        self,
        client: httpx.AsyncClient,
        filename: str,
        content: bytes,
        api_key: str,
        api_base: str,
        agent: str,
    ) -> Dict[str, Any]:
        """Ajoute un fichier .torrent et retourne un dict standardisé {'id': ..., 'name': ..., 'size': ...}."""
        pass

    @abstractmethod
    async def get_statuses(
        self, client: httpx.AsyncClient, ids: List[Any], api_key: str, api_base: str, agent: str
    ) -> Dict[Any, Dict[str, Any]]:
        """
        Récupère les statuts pour une liste d'identifiants.
        Retourne un dictionnaire {id: {
            'statusCode': 4 (prêt / téléchargé), 5 (erreur), 0 (en cours de DL),
            'filename': str,
            'size': int,
            'downloaded': int,
            'status': str,
            'links': List[Dict[str, str]]
        }}
        """
        pass

    @abstractmethod
    async def get_magnet_files(
        self, client: httpx.AsyncClient, item_id: Any, api_key: str, api_base: str, agent: str
    ) -> List[str]:
        """Retourne la liste des noms de fichiers attendus pour ce téléchargement."""
        pass

    @abstractmethod
    async def delete_magnet(
        self, client: httpx.AsyncClient, item_id: Any, api_key: str, api_base: str, agent: str
    ) -> None:
        """Supprime le torrent/magnet chez le fournisseur de débridage."""
        pass

    async def unlock_link(
        self,
        client: httpx.AsyncClient,
        link: str,
        password: Optional[str],
        api_key: str,
        api_base: str,
        agent: str,
    ) -> Dict[str, Any]:
        """
        Débride un lien direct (ex: Rapidgator, 1fichier, etc.) et retourne un dict
        {'link': str, 'filename': str, 'size': int, 'host': str, 'id': Any}.
        """
        raise NotImplementedError(f"Le débridage de liens direct n'est pas supporté par {self.name or self.__class__.__name__}")
