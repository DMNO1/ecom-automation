from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from loguru import logger
from models import ProductInfo, PaginatedResponse, ApiResponse
from kuaishou_client import get_kuaishou_client

router = APIRouter(prefix="/products", tags=["商品管理"])


@router.get("/list", response_model=ApiResponse)
async def get_product_list(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    status: Optional[int] = Query(None, description="商品状态：1-上架，0-下架"),
    search_word: Optional[str] = Query(None, description="搜索关键词")
):
    """获取商品列表"""
    try:
        client = get_kuaishou_client()
        result = await client.get_product_list(
            page=page,
            page_size=page_size,
            status=status,
            search_word=search_word
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
        logger.error(f"获取商品列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/detail/{product_id}", response_model=ApiResponse)
async def get_product_detail(product_id: str):
    """获取商品详情"""
    try:
        client = get_kuaishou_client()
        product = await client.get_product_detail(product_id)
        
        return ApiResponse(
            code=0,
            message="success",
            data=product.dict()
        )
    except Exception as e:
        logger.error(f"获取商品详情失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))