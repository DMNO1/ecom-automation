from fastapi import APIRouter, HTTPException
from loguru import logger
from models import InventoryUpdate, InventoryResponse, ApiResponse
from kuaishou_client import get_kuaishou_client

router = APIRouter(prefix="/inventory", tags=["库存管理"])


@router.post("/update", response_model=ApiResponse)
async def update_inventory(update: InventoryUpdate):
    """更新库存"""
    try:
        client = get_kuaishou_client()
        result = await client.update_stock(update)
        
        return ApiResponse(
            code=0,
            message="success",
            data=result
        )
    except Exception as e:
        logger.error(f"更新库存失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))