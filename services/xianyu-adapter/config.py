"""
配置文件
"""
import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """应用配置"""
    
    # 服务配置
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
    # CORS配置
    CORS_ORIGINS: List[str] = ["*"]
    
    # 数据库配置
    DATABASE_URL: str = "sqlite:///./xianyu.db"
    
    # 浏览器配置
    HEADLESS: bool = True
    BROWSER_TIMEOUT: int = 30000
    
    # 自动回复配置
    AUTO_REPLY_INTERVAL: int = 30  # 秒
    AI_API_KEY: str = ""
    AI_MODEL: str = "gpt-3.5-turbo"
    AI_MAX_TOKENS: int = 1000
    AI_TEMPERATURE: float = 0.7
    
    # 订单监控配置
    ORDER_MONITOR_INTERVAL: int = 60  # 秒
    
    # 文件存储路径
    DATA_DIR: str = "./data"
    COOKIES_DIR: str = "./data/cookies"
    LOGS_DIR: str = "./data/logs"
    SCREENSHOTS_DIR: str = "./data/screenshots"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# 创建全局设置实例
settings = Settings()

# 确保目录存在
os.makedirs(settings.DATA_DIR, exist_ok=True)
os.makedirs(settings.COOKIES_DIR, exist_ok=True)
os.makedirs(settings.LOGS_DIR, exist_ok=True)
os.makedirs(settings.SCREENSHOTS_DIR, exist_ok=True)