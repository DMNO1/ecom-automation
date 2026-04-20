from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from loguru import logger
from models import OrderInfo, PaginatedResponse, ApiResponse
from douyin_client import get_douyin_client

router = APIRouter(prefix="/orders", tags=["订单管理"])


@router.get("/list", response_model=ApiResponse)
async def get_order_list(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    start_time: Optional[str] = Query(None, description="开始时间，格式：2024-01-01 00:00:00"),
    end_time: Optional[str] = Query(None, description="结束时间，格式：2024-01-01 23:59:59"),
    order_status: Optional[int] = Query(None, description="订单状态")
):
    """获取订单列表"""
    try:
        client = get_douyin_client()
        result = await client.get_order_list(
            page=page,
            page_size=page_size,
            start_time=start_time,
            end_time=end_time,
            order_status=order_status
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
        logger.error(f"获取订单列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/detail/{order_id}", response_model=ApiResponse)
async def get_order_detail(order_id: str):
    """获取订单详情"""
    try:
        client = get_douyin_client()
        order = await client.get_order_detail(order_id)
        
        return ApiResponse(
            code=0,
            message="success",
            data=order.dict()
        )
    except Exception as e:
        logger.error(f"获取订单详情失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))
