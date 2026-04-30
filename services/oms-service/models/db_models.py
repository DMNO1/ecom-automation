from sqlalchemy import Column, String, Numeric, Integer, JSON, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from database import Base

class MultiPlatformSKUModel(Base):
    """
    多平台 SKU 数据库模型
    """
    __tablename__ = "multi_platform_skus"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shop_id = Column(UUID(as_uuid=True), nullable=False)
    platform = Column(String(20), nullable=False)
    platform_sku_id = Column(String(128), nullable=False)
    platform_product_id = Column(String(128), nullable=False)
    outer_id = Column(String(128))
    sku_name = Column(String, nullable=False)
    price = Column(Numeric(12, 2))
    stock = Column(Integer, default=0)
    attributes = Column(JSON, default={})
    status = Column(String(20), default="online")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("platform", "platform_sku_id", name="multi_platform_skus_platform_platform_sku_id_key"),
    )
