from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseOAuthProvider(ABC):
    @abstractmethod
    async def get_authorization_url(self, shop_id: str, redirect_uri: str) -> str:
        """Get the URL to redirect the user to for authorization."""
        pass

    @abstractmethod
    async def exchange_code(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Exchange the authorization code for access tokens."""
        pass

    @abstractmethod
    async def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh the access token using the refresh token."""
        pass

class MockOAuthProvider(BaseOAuthProvider):
    async def get_authorization_url(self, shop_id: str, redirect_uri: str) -> str:
        return f"{redirect_uri}?code=mock_auth_code_for_{shop_id}&state={shop_id}"

    async def exchange_code(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        return {
            "access_token": f"mock_access_token_{code}",
            "refresh_token": f"mock_refresh_token_{code}",
            "expires_in": 7200,
            "refresh_expires_in": 2592000,
            "token_type": "Bearer",
            "scope": "all"
        }

    async def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        return {
            "access_token": f"mock_new_access_token_{refresh_token}",
            "refresh_token": f"mock_new_refresh_token_{refresh_token}",
            "expires_in": 7200,
            "refresh_expires_in": 2592000
        }

def get_oauth_provider(platform: str) -> BaseOAuthProvider:
    # 暂时全部返回 mock_provider, 未来可在此处配置各真实平台 Provider (如 DouyinProvider)
    return MockOAuthProvider()
