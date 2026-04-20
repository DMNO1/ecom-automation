"""
API路由模块
"""
from fastapi import APIRouter

# 导入子路由
try:
    from .chat_routes import router as chat_router
    from .knowledge_routes import router as knowledge_router
    from .system_routes import router as system_router
except ImportError:
    # 当直接运行时
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from chat_routes import router as chat_router
    from knowledge_routes import router as knowledge_router
    from system_routes import router as system_router

router = APIRouter()

# 包含子路由
router.include_router(chat_router, prefix="/chat", tags=["chat"])
router.include_router(knowledge_router, prefix="/knowledge", tags=["knowledge"])
router.include_router(system_router, prefix="/system", tags=["system"])
