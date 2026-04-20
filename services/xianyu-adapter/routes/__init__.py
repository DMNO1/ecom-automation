"""
API路由定义
"""
from fastapi import APIRouter

try:
    from .account_routes import router as account_router
    from .message_routes import router as message_router
    from .product_routes import router as product_router
    from .order_routes import router as order_router
    from .system_routes import router as system_router
except ImportError:
    from account_routes import router as account_router
    from message_routes import router as message_router
    from product_routes import router as product_router
    from order_routes import router as order_router
    from system_routes import router as system_router

router = APIRouter()

# 注册子路由
router.include_router(account_router, prefix="/accounts", tags=["账号管理"])
router.include_router(message_router, prefix="/messages", tags=["消息管理"])
router.include_router(product_router, prefix="/products", tags=["商品管理"])
router.include_router(order_router, prefix="/orders", tags=["订单管理"])
router.include_router(system_router, prefix="/system", tags=["系统管理"])