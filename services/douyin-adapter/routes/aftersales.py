from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from loguru import logger
from models import AftersaleInfo, PaginatedResponse, ApiResponse
from douyin_client import get_douyin_client

router = APIRouter(prefix="/aftersales", tags=["售后管理"])


@router.get("/list", response_model=ApiResponse)
async def get_aftersale_list(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    status: Optional[int] = Query(None, description="售后状态"),
    order_id: Optional[str] = Query(None, description="订单ID")
):
    """获取售后列表"""
    try:
        client = get_douyin_client()
        result = await client.get_aftersale_list(
            page=page,
            page_size=page_size,
            status=status,
            order_id=order_id
        )
        
        return ApiResponse(
            code=0,
            message="success",
            data={
                "items": [item.dict() for item in result.items],
                "total": result.total,
                "page": result.page,
                "page_size": result.page_size,
                "has_more": result.has_more
            }
        )
    except Exception as e:
        logger.error(f"获取售后列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))
