from fastapi import APIRouter, HTTPException
from loguru import logger
from models import LogisticsInfo, ApiResponse
from douyin_client import get_douyin_client

router = APIRouter(prefix="/logistics", tags=["物流管理"])


@router.post("/send", response_model=ApiResponse)
async def send_logistics(logistics: LogisticsInfo):
    """发货
    
    Args:
        logistics: 物流信息
            - order_id: 订单ID
            - company_code: 快递公司代码
            - tracking_number: 快递单号
            - receiver_info: 收货人信息（可选）
    
    Returns:
        发货结果
    """
    try:
        client = get_douyin_client()
        result = await client.send_logistics(logistics)
        
        return ApiResponse(
            code=0,
            message="success",
            data={
                "success": True,
                "order_id": logistics.order_id,
                "tracking_number": logistics.tracking_number,
                "message": "发货成功"
            }
        )
    except Exception as e:
        logger.error(f"发货失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))
