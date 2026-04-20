from fastapi import APIRouter, HTTPException
from loguru import logger
from models import LogisticsInfo, ApiResponse
from kuaishou_client import get_kuaishou_client

router = APIRouter(prefix="/logistics", tags=["物流管理"])


@router.post("/send", response_model=ApiResponse)
async def send_logistics(logistics: LogisticsInfo):
    """发货"""
    try:
        client = get_kuaishou_client()
        result = await client.send_logistics(logistics)
        
        return ApiResponse(
            code=0,
            message="success",
            data=result
        )
    except Exception as e:
        logger.error(f"发货失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))