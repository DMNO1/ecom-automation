from typing import List
from datetime import datetime
import uuid
from .base import BasePlatformProvider
from models.unified_models import MultiPlatformOrder, MultiPlatformSKU, MultiPlatformOrderItem

class MockPlatformProvider(BasePlatformProvider):
    """
    Mock provider for testing order/SKU basic sync flows without real platform credentials.
    """

    def __init__(self, platform_name: str):
        self.platform = platform_name

    async def pull_orders(self, shop_id: str, start_time: datetime, end_time: datetime) -> List[MultiPlatformOrder]:
        """Simulate pulling orders."""
        mock_order_id = str(uuid.uuid4())
        mock_sku_id = str(uuid.uuid4())

        item = MultiPlatformOrderItem(
            order_id=uuid.UUID(mock_order_id), # Mock UUID
            platform_sku_id=f"mock_sku_{self.platform}_1",
            product_name=f"Mock Product from {self.platform}",
            quantity=1,
            price=99.9,
            item_amount=99.9
        )

        order = MultiPlatformOrder(
            id=uuid.UUID(mock_order_id),
            shop_id=uuid.UUID(shop_id) if isinstance(shop_id, str) and "-" in shop_id else uuid.uuid4(),
            platform=self.platform,
            platform_order_id=f"mock_order_{self.platform}_{int(datetime.now().timestamp())}",
            order_status="PAID",
            total_amount=99.9,
            pay_amount=99.9,
            postage=0.0,
            buyer_info={"name": "Mock Buyer", "phone": "13800138000"},
            receiver_info={"address": "Mock Address"},
            pay_time=datetime.now(),
            create_time=datetime.now(),
            items=[item]
        )
        return [order]

    async def pull_products(self, shop_id: str) -> List[MultiPlatformSKU]:
        """Simulate pulling products/SKUs."""
        sku = MultiPlatformSKU(
            shop_id=uuid.UUID(shop_id) if isinstance(shop_id, str) and "-" in shop_id else uuid.uuid4(),
            platform=self.platform,
            platform_sku_id=f"mock_sku_{self.platform}_1",
            platform_product_id=f"mock_prod_{self.platform}_1",
            outer_id="GLB_SKU_001",  # Global Outer ID
            sku_name=f"Mock SKU from {self.platform}",
            price=99.9,
            stock=100,
            status="online"
        )
        return [sku]

    async def sync_stock(self, shop_id: str, platform_sku_id: str, quantity: int) -> bool:
        """Simulate syncing stock to the platform."""
        # Log or simulate success
        return True

def get_platform_provider(platform: str) -> BasePlatformProvider:
    """Factory to get the correct platform provider."""
    # Temporarily returning Mock provider for all platforms
    return MockPlatformProvider(platform_name=platform)
