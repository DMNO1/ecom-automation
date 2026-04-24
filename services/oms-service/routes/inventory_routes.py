from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from models import InventoryItem, Platform, RiskLevel
from inventory_manager import InventoryManager

router = APIRouter()
inventory_manager = InventoryManager()


@router.get("/", response_model=List[InventoryItem], summary="获取所有库存")
async def get_inventory(
    platform: Optional[Platform] = Query(None, description="平台筛选"),
    risk_level: Optional[RiskLevel] = Query(None, description="风险等级筛选"),
    low_stock_only: bool = Query(False, description="仅显示低库存"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量")
):
    """获取所有库存，支持分页和筛选"""
    items = inventory_manager.get_all_inventory(
        platform=platform,
        risk_level=risk_level,
        low_stock_only=low_stock_only
    )
    
    # 分页
    start = (page - 1) * page_size
    end = start + page_size
    return items[start:end]


@router.get("/statistics", summary="获取库存统计")
async def get_inventory_statistics():
    """获取库存统计信息"""
    return inventory_manager.get_inventory_statistics()


@router.get("/low-stock", response_model=List[InventoryItem], summary="获取低库存商品")
async def get_low_stock_items():
    """获取低库存商品"""
    return inventory_manager.get_low_stock_items()


@router.get("/high-risk", response_model=List[InventoryItem], summary="获取高风险商品")
async def get_high_risk_items():
    """获取高风险商品"""
    return inventory_manager.get_high_risk_items()


@router.get("/search", response_model=List[InventoryItem], summary="搜索库存")
async def search_inventory(keyword: str = Query(..., description="搜索关键词")):
    """搜索库存"""
    return inventory_manager.search_inventory(keyword)


@router.get("/{sku_id}", response_model=InventoryItem, summary="获取库存详情")
async def get_inventory_item(sku_id: str):
    """根据SKU ID获取库存详情"""
    item = inventory_manager.get_inventory_by_sku(sku_id)
    if not item:
        raise HTTPException(status_code=404, detail="库存项目不存在")
    return item


@router.post("/", response_model=InventoryItem, summary="创建库存项目")
async def create_inventory_item(item_data: dict):
    """创建新库存项目"""
    try:
        item = inventory_manager.create_inventory_item(item_data)
        return item
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"创建库存项目失败: {str(e)}")

from providers import get_platform_provider

@router.post("/sync/{platform}/{shop_id}", summary="手动触发商品SKU同步 (Phase 1 Additive Mock)")
async def sync_platform_products(platform: str, shop_id: str):
    """
    手动触发拉取平台商品（当前使用 Mock Provider）.
    该接口使用 unified_models.MultiPlatformSKU 进行内部扭转.
    """
    try:
        provider = get_platform_provider(platform)

        # 1. 调用 Provider 拉取统一模型 SKU
        skus = await provider.pull_products(shop_id)

        # TODO: 2. 存入数据库 unified_models.MultiPlatformSKU (使用真实DB依赖)
        # 暂时返回 Mock 结果展示

        return {
            "status": "success",
            "message": f"Successfully pulled {len(skus)} mock SKUs for {platform}.",
            "mock_skus": [sku.model_dump() for sku in skus]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{sku_id}", summary="删除库存项目")
async def delete_inventory_item(sku_id: str):
    """删除库存项目"""
    success = inventory_manager.delete_inventory_item(sku_id)
    if not success:
        raise HTTPException(status_code=404, detail="库存项目不存在")
    return {"message": "删除成功"}


@router.put("/{sku_id}/stock", response_model=InventoryItem, summary="更新库存数量")
async def update_stock(
    sku_id: str,
    available_stock: Optional[int] = Query(None, description="可用库存"),
    locked_stock: Optional[int] = Query(None, description="锁定库存"),
    in_transit_stock: Optional[int] = Query(None, description="在途库存")
):
    """更新库存数量"""
    item = inventory_manager.update_stock(
        sku_id,
        available_stock=available_stock,
        locked_stock=locked_stock,
        in_transit_stock=in_transit_stock
    )
    if not item:
        raise HTTPException(status_code=404, detail="库存项目不存在")
    return item


@router.post("/{sku_id}/lock", summary="锁定库存")
async def lock_stock(sku_id: str, quantity: int = Query(..., ge=1, description="锁定数量")):
    """锁定库存（下单时调用）"""
    success = inventory_manager.lock_stock(sku_id, quantity)
    if not success:
        raise HTTPException(status_code=400, detail="库存不足或SKU不存在")
    return {"message": "库存锁定成功"}


@router.post("/{sku_id}/unlock", summary="解锁库存")
async def unlock_stock(sku_id: str, quantity: int = Query(..., ge=1, description="解锁数量")):
    """解锁库存（取消订单时调用）"""
    success = inventory_manager.unlock_stock(sku_id, quantity)
    if not success:
        raise HTTPException(status_code=400, detail="锁定库存不足或SKU不存在")
    return {"message": "库存解锁成功"}


@router.post("/{sku_id}/ship", summary="发货扣减库存")
async def ship_stock(sku_id: str, quantity: int = Query(..., ge=1, description="发货数量")):
    """发货时扣减锁定库存"""
    success = inventory_manager.ship_stock(sku_id, quantity)
    if not success:
        raise HTTPException(status_code=400, detail="锁定库存不足或SKU不存在")
    return {"message": "发货扣减成功"}


@router.post("/{sku_id}/receive", summary="到货增加库存")
async def receive_stock(sku_id: str, quantity: int = Query(..., ge=1, description="到货数量")):
    """到货时增加库存"""
    success = inventory_manager.receive_stock(sku_id, quantity)
    if not success:
        raise HTTPException(status_code=400, detail="SKU不存在")
    return {"message": "到货入库成功"}


@router.post("/{sku_id}/risk-tags", response_model=InventoryItem, summary="添加风险标签")
async def add_risk_tag(sku_id: str, tag: str = Query(..., description="风险标签")):
    """添加风险标签"""
    item = inventory_manager.add_risk_tag(sku_id, tag)
    if not item:
        raise HTTPException(status_code=404, detail="库存项目不存在")
    return item


@router.delete("/{sku_id}/risk-tags", response_model=InventoryItem, summary="移除风险标签")
async def remove_risk_tag(sku_id: str, tag: str = Query(..., description="风险标签")):
    """移除风险标签"""
    item = inventory_manager.remove_risk_tag(sku_id, tag)
    if not item:
        raise HTTPException(status_code=404, detail="库存项目不存在")
    return item


@router.put("/{sku_id}/risk-level", response_model=InventoryItem, summary="设置风险等级")
async def set_risk_level(sku_id: str, risk_level: RiskLevel):
    """手动设置风险等级"""
    item = inventory_manager.set_risk_level(sku_id, risk_level)
    if not item:
        raise HTTPException(status_code=404, detail="库存项目不存在")
    return item


@router.get("/platform/{platform}", response_model=List[InventoryItem], summary="获取指定平台库存")
async def get_inventory_by_platform(platform: Platform):
    """获取指定平台的库存"""
    return inventory_manager.get_inventory_by_platform(platform)
