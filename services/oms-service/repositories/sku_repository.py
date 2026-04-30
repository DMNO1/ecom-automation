from typing import List
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert
from models.db_models import MultiPlatformSKUModel
from models.unified_models import MultiPlatformSKU

class SKURepository:
    """
    SKU 数据库操作类
    """
    def __init__(self, db: AsyncSession):
        self.db = db

    async def upsert_skus(self, skus: List[MultiPlatformSKU]):
        """
        批量更新或插入 SKU (ON CONFLICT DO UPDATE)
        """
        if not skus:
            return

        for sku in skus:
            # 准备插入数据
            data = sku.model_dump(exclude={"id"})
            
            # 使用 PostgreSQL 的 ON CONFLICT 语法
            stmt = insert(MultiPlatformSKUModel).values(**data)
            
            # 如果 (platform, platform_sku_id) 冲突，则更新其他字段
            update_stmt = stmt.on_conflict_do_update(
                index_elements=["platform", "platform_sku_id"],
                set_={
                    "platform_product_id": stmt.excluded.platform_product_id,
                    "outer_id": stmt.excluded.outer_id,
                    "sku_name": stmt.excluded.sku_name,
                    "price": stmt.excluded.price,
                    "stock": stmt.excluded.stock,
                    "attributes": stmt.excluded.attributes,
                    "status": stmt.excluded.status,
                    "updated_at": func.now()
                }
            )
            
            await self.db.execute(update_stmt)
