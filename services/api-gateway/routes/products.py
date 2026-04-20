"""
商品管理路由
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class ProductBase(BaseModel):
    shop_id: str
    title: str
    price: float
    cost_price: Optional[float] = None
    sku_id: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: str
    status: str
    listing_risk_score: float
    margin_score: float
    created_at: datetime
    updated_at: datetime

products_db = []

@router.get("/", response_model=List[ProductResponse])
async def list_products(
    shop_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """获取商品列表"""
    result = products_db
    if shop_id:
        result = [p for p in result if p["shop_id"] == shop_id]
    if status:
        result = [p for p in result if p["status"] == status]
    return result[skip:skip + limit]

@router.post("/", response_model=ProductResponse)
async def create_product(product: ProductCreate):
    """创建商品"""
    # 计算毛利分
    margin_score = 0
    if product.cost_price and product.price > 0:
        margin_score = ((product.price - product.cost_price) / product.price) * 100
    
    new_product = {
        "id": f"prod_{len(products_db) + 1}",
        **product.dict(),
        "status": "draft",
        "listing_risk_score": 0,
        "margin_score": round(margin_score, 2),
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    products_db.append(new_product)
    return new_product

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    """获取商品详情"""
    for product in products_db:
        if product["id"] == product_id:
            return product
    raise HTTPException(status_code=404, detail="商品不存在")

@router.put("/{product_id}/status")
async def update_product_status(product_id: str, status: str):
    """更新商品状态"""
    for product in products_db:
        if product["id"] == product_id:
            product["status"] = status
            product["updated_at"] = datetime.now()
            return product
    raise HTTPException(status_code=404, detail="商品不存在")
