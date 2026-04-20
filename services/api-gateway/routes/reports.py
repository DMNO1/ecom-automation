from fastapi import APIRouter

router = APIRouter()

@router.get("/daily")
async def daily_report():
    return {"message": "日报 - 待实现"}

@router.get("/weekly")
async def weekly_report():
    return {"message": "周报 - 待实现"}
