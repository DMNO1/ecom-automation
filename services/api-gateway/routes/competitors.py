from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def list_competitors():
    return {"message": "竞品分析 - 待实现"}
