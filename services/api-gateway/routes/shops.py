"""
店铺管理路由
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

# 数据模型
class ShopBase(BaseModel):
    platform: str
    shop_name: str

class ShopCreate(ShopBase):
    pass

class ShopResponse(ShopBase):
    id: str
    auth_status: str
    created_at: datetime
    updated_at: datetime

# 模拟数据存储
shops_db = []

@router.get("/", response_model=List[ShopResponse])
async def list_shops(platform: Optional[str] = None):
    """获取店铺列表"""
    if platform:
        return [s for s in shops_db if s["platform"] == platform]
    return shops_db

@router.post("/", response_model=ShopResponse)
async def create_shop(shop: ShopCreate):
    """创建店铺"""
    new_shop = {
        "id": f"shop_{len(shops_db) + 1}",
        **shop.model_dump(),
        "auth_status": "pending",
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    shops_db.append(new_shop)
    return new_shop

@router.get("/{shop_id}", response_model=ShopResponse)
async def get_shop(shop_id: str):
    """获取店铺详情"""
    for shop in shops_db:
        if shop["id"] == shop_id:
            return shop
    raise HTTPException(status_code=404, detail="店铺不存在")

@router.delete("/{shop_id}")
async def delete_shop(shop_id: str):
    """删除店铺"""
    global shops_db
    shops_db = [s for s in shops_db if s["id"] != shop_id]
    return {"message": "删除成功"}
