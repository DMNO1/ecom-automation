"""
商品管理路由
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

try:
    from ..xianyu_client import client_manager, XianyuProduct
except ImportError:
    from xianyu_client import client_manager, XianyuProduct
try:
    from ..product_manager import product_manager_registry, ProductTemplate
except ImportError:
    from product_manager import product_manager_registry, ProductTemplate

router = APIRouter()


class ProductResponse(BaseModel):
    """商品响应"""
    product_id: str
    title: str
    price: float
    description: str
    images: List[str]
    status: str
    category: Optional[str]
    created_at: Optional[datetime]


class CreateProductRequest(BaseModel):
    """创建商品请求"""
    account_id: str
    title: str
    price: float
    description: str
    images: List[str] = []
    category: Optional[str] = None
    tags: List[str] = []


class UpdateProductRequest(BaseModel):
    """更新商品请求"""
    title: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None
    images: Optional[List[str]] = None
    category: Optional[str] = None
    status: Optional[str] = None


class BatchPriceUpdateRequest(BaseModel):
    """批量价格更新请求"""
    account_id: str
    updates: Dict[str, float]  # product_id -> new_price


class ProductTemplateRequest(BaseModel):
    """商品模板请求"""
    id: str
    name: str
    title_template: str
    description_template: str
    price_range: Dict[str, float]
    category: str
    images: List[str] = []
    auto_repost: bool = False
    tags: List[str] = []


class CreateFromTemplateRequest(BaseModel):
    """从模板创建请求"""
    account_id: str
    template_id: str
    variables: Dict[str, Any]


class ProductStatsResponse(BaseModel):
    """商品统计响应"""
    total: int
    on_sale: int
    sold_out: int
    deleted: int
    total_value: float
    average_price: float


@router.get("/{account_id}", response_model=List[ProductResponse])
async def get_products(
    account_id: str,
    force_refresh: bool = Query(False, description="强制刷新"),
):
    """获取商品列表"""
    try:
        client = await client_manager.get_client(account_id)
        manager = await product_manager_registry.get_manager(account_id, client)
        
        products = await manager.get_products(force_refresh=force_refresh)
        
        return [
            ProductResponse(
                product_id=product.product_id,
                title=product.title,
                price=product.price,
                description=product.description,
                images=product.images,
                status=product.status,
                category=product.category,
                created_at=product.created_at,
            )
            for product in products
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{account_id}/{product_id}", response_model=ProductResponse)
async def get_product(account_id: str, product_id: str):
    """获取单个商品"""
    try:
        client = await client_manager.get_client(account_id)
        manager = await product_manager_registry.get_manager(account_id, client)
        
        product = await manager.get_product(product_id)
        
        if not product:
            raise HTTPException(status_code=404, detail="商品不存在")
        
        return ProductResponse(
            product_id=product.product_id,
            title=product.title,
            price=product.price,
            description=product.description,
            images=product.images,
            status=product.status,
            category=product.category,
            created_at=product.created_at,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{account_id}")
async def create_product(account_id: str, request: CreateProductRequest):
    """创建商品"""
    try:
        client = await client_manager.get_client(account_id)
        manager = await product_manager_registry.get_manager(account_id, client)
        
        product_data = {
            "title": request.title,
            "price": request.price,
            "description": request.description,
            "images": request.images,
            "category": request.category,
            "tags": request.tags,
        }
        
        product_id = await manager.create_product(product_data)
        
        if product_id:
            return {"message": "商品创建成功", "product_id": product_id}
        else:
            raise HTTPException(status_code=500, detail="商品创建失败")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{account_id}/{product_id}")
async def update_product(account_id: str, product_id: str, request: UpdateProductRequest):
    """更新商品"""
    try:
        client = await client_manager.get_client(account_id)
        manager = await product_manager_registry.get_manager(account_id, client)
        
        # 构建更新数据
        updates = {}
        if request.title is not None:
            updates["title"] = request.title
        if request.price is not None:
            updates["price"] = request.price
        if request.description is not None:
            updates["description"] = request.description
        if request.images is not None:
            updates["images"] = request.images
        if request.category is not None:
            updates["category"] = request.category
        if request.status is not None:
            updates["status"] = request.status
        
        success = await manager.update_product(product_id, updates)
        
        if success:
            return {"message": "商品更新成功"}
        else:
            raise HTTPException(status_code=500, detail="商品更新失败")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{account_id}/{product_id}")
async def delete_product(account_id: str, product_id: str):
    """删除商品（下架）"""
    try:
        client = await client_manager.get_client(account_id)
        manager = await product_manager_registry.get_manager(account_id, client)
        
        success = await manager.delete_product(product_id)
        
        if success:
            return {"message": "商品删除成功"}
        else:
            raise HTTPException(status_code=500, detail="商品删除失败")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{account_id}/{product_id}/repost")
async def repost_product(account_id: str, product_id: str):
    """重新上架商品"""
    try:
        client = await client_manager.get_client(account_id)
        manager = await product_manager_registry.get_manager(account_id, client)
        
        success = await manager.repost_product(product_id)
        
        if success:
            return {"message": "商品重新上架成功"}
        else:
            raise HTTPException(status_code=500, detail="商品重新上架失败")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{account_id}/batch-price")
async def batch_update_prices(request: BatchPriceUpdateRequest):
    """批量更新价格"""
    try:
        client = await client_manager.get_client(request.account_id)
        manager = await product_manager_registry.get_manager(request.account_id, client)
        
        results = await manager.batch_update_prices(request.updates)
        
        return {
            "message": "批量更新完成",
            "results": results,
            "success_count": sum(1 for success in results.values() if success),
            "total_count": len(results),
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{account_id}/stats", response_model=ProductStatsResponse)
async def get_product_stats(account_id: str):
    """获取商品统计"""
    try:
        client = await client_manager.get_client(account_id)
        manager = await product_manager_registry.get_manager(account_id, client)
        
        stats = await manager.get_product_statistics()
        
        return ProductStatsResponse(**stats)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 模板管理路由
@router.get("/{account_id}/templates", response_model=List[ProductTemplateRequest])
async def get_templates(account_id: str):
    """获取商品模板"""
    try:
        client = await client_manager.get_client(account_id)
        manager = await product_manager_registry.get_manager(account_id, client)
        
        templates = await manager.get_templates()
        
        return [
            ProductTemplateRequest(
                id=template.id,
                name=template.name,
                title_template=template.title_template,
                description_template=template.description_template,
                price_range=template.price_range,
                category=template.category,
                images=template.images,
                auto_repost=template.auto_repost,
                tags=template.tags,
            )
            for template in templates
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{account_id}/templates")
async def add_template(account_id: str, request: ProductTemplateRequest):
    """添加商品模板"""
    try:
        client = await client_manager.get_client(account_id)
        manager = await product_manager_registry.get_manager(account_id, client)
        
        template = ProductTemplate(
            id=request.id,
            name=request.name,
            title_template=request.title_template,
            description_template=request.description_template,
            price_range=request.price_range,
            category=request.category,
            images=request.images,
            auto_repost=request.auto_repost,
            tags=request.tags,
        )
        
        success = await manager.add_template(template)
        
        if success:
            return {"message": "模板添加成功"}
        else:
            raise HTTPException(status_code=400, detail="模板添加失败")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{account_id}/templates/{template_id}")
async def remove_template(account_id: str, template_id: str):
    """删除商品模板"""
    try:
        client = await client_manager.get_client(account_id)
        manager = await product_manager_registry.get_manager(account_id, client)
        
        success = await manager.remove_template(template_id)
        
        if success:
            return {"message": "模板删除成功"}
        else:
            raise HTTPException(status_code=404, detail="模板不存在")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{account_id}/create-from-template")
async def create_from_template(request: CreateFromTemplateRequest):
    """从模板创建商品"""
    try:
        client = await client_manager.get_client(request.account_id)
        manager = await product_manager_registry.get_manager(request.account_id, client)
        
        product_id = await manager.create_from_template(
            template_id=request.template_id,
            variables=request.variables,
        )
        
        if product_id:
            return {"message": "商品创建成功", "product_id": product_id}
        else:
            raise HTTPException(status_code=500, detail="商品创建失败")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))