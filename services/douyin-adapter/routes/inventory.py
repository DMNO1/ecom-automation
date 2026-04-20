from fastapi import APIRouter, HTTPException
from loguru import logger
from models import InventoryUpdate, InventoryResponse, ApiResponse
from douyin_client import get_douyin_client

router = APIRouter(prefix="/inventory", tags=["库存管理"])


@router.post("/update", response_model=ApiResponse)
async def update_inventory(update: InventoryUpdate):
    """更新库存
    
    Args:
        update: 库存更新信息
            - product_id: 商品ID
            - sku_id: SKU ID（可选）
            - quantity: 库存数量
            - update_type: 更新类型：1-设置，2-增加，3-减少
    
    Returns:
        更新结果
    """
    try:
        client = get_douyin_client()
        result = await client.update_stock(update)
        
        return ApiResponse(
            code=0,
            message="success",
            data={
                "success": True,
                "product_id": update.product_id,
                "sku_id": update.sku_id,
                "new_quantity": result.get("quantity"),
                "message": "库存更新成功"
            }
        )
    except Exception as e:
        logger.error(f"更新库存失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))
