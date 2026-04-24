from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

# 统一鉴权模型
class ShopAuthToken(BaseModel):
    id: Optional[uuid.UUID] = None
    shop_id: uuid.UUID
    platform: str
    access_token: str
    refresh_token: Optional[str] = None
    expires_in: Optional[int] = None
    refresh_expires_in: Optional[int] = None
    token_type: Optional[str] = None
    scope: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# 统一 SKU 模型
class MultiPlatformSKU(BaseModel):
    id: Optional[uuid.UUID] = None
    shop_id: uuid.UUID
    platform: str
    platform_sku_id: str
    platform_product_id: str
    outer_id: Optional[str] = None
    sku_name: str
    price: Optional[float] = None
    stock: int = 0
    attributes: Dict[str, Any] = Field(default_factory=dict)
    status: str = "online"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# 统一订单子项模型
class MultiPlatformOrderItem(BaseModel):
    id: Optional[uuid.UUID] = None
    order_id: uuid.UUID
    sku_id: Optional[uuid.UUID] = None
    platform_sku_id: str
    product_name: str
    quantity: int
    price: float
    item_amount: float
    created_at: Optional[datetime] = None

# 统一订单主表模型
class MultiPlatformOrder(BaseModel):
    id: Optional[uuid.UUID] = None
    shop_id: uuid.UUID
    platform: str
    platform_order_id: str
    order_status: str
    total_amount: float
    pay_amount: Optional[float] = None
    postage: float = 0.0
    buyer_info: Dict[str, Any] = Field(default_factory=dict)
    receiver_info: Dict[str, Any] = Field(default_factory=dict)
    pay_time: Optional[datetime] = None
    create_time: datetime
    items: Optional[List[MultiPlatformOrderItem]] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# 订单操作留痕模型
class OrderOperateLog(BaseModel):
    id: Optional[int] = None
    order_id: uuid.UUID
    platform_order_id: str
    operator: str = "system"
    action: str
    previous_status: Optional[str] = None
    new_status: Optional[str] = None
    remark: Optional[str] = None
    payload: Dict[str, Any] = Field(default_factory=dict)
    created_at: Optional[datetime] = None

# 库存预留模型
class InventoryReservation(BaseModel):
    id: Optional[uuid.UUID] = None
    outer_id: str
    order_id: Optional[uuid.UUID] = None
    platform_order_id: str
    quantity: int
    status: str = "reserved"
    expire_at: datetime
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
