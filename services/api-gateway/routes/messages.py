from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def list_messages():
    return {"message": "客服消息 - 待实现"}
