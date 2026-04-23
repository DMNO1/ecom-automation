from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def list_aftersales():
    return {"message": "售后单列表 - 待实现"}
