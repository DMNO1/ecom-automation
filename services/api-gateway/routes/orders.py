from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def list_orders():
    return {"message": "订单管理 - 待实现"}

@router.get("/{order_id}")
async def get_order(order_id: str):
    return {"order_id": order_id, "status": "pending"}
