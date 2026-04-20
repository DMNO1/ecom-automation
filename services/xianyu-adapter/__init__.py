"""
闲鱼自动化服务
"""

__version__ = "1.0.0"
__author__ = "Nous Research"

from .main import app
from .config import settings
from .xianyu_client import XianyuClient, client_manager
from .auto_reply import AutoReplyEngine, auto_reply_manager
from .product_manager import ProductManager, product_manager_registry
from .order_handler import OrderHandler, order_handler_registry
from .playwright_bot import PlaywrightBot, bot_pool
from .database import db, init_db

__all__ = [
    "app",
    "settings",
    "XianyuClient",
    "client_manager",
    "AutoReplyEngine",
    "auto_reply_manager",
    "ProductManager",
    "product_manager_registry",
    "OrderHandler",
    "order_handler_registry",
    "PlaywrightBot",
    "bot_pool",
    "db",
    "init_db",
]