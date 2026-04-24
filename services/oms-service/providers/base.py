from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from datetime import datetime
from models.unified_models import MultiPlatformOrder, MultiPlatformSKU

class BasePlatformProvider(ABC):
    """
    Abstract base class defining the contract for platform adapters (Douyin, PDD, Xianyu, etc.).
    """

    @abstractmethod
    async def pull_orders(self, shop_id: str, start_time: datetime, end_time: datetime) -> List[MultiPlatformOrder]:
        """Pull orders from the platform within the specified time range."""
        pass

    @abstractmethod
    async def pull_products(self, shop_id: str) -> List[MultiPlatformSKU]:
        """Pull product/SKU list from the platform."""
        pass

    @abstractmethod
    async def sync_stock(self, shop_id: str, platform_sku_id: str, quantity: int) -> bool:
        """Sync/update stock to the platform for a specific SKU."""
        pass
