from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def list_aftersales():
    return {"message": "售后服务 - 待实现"}
