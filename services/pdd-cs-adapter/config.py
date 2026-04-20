"""
拼多多客服服务配置
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # 应用配置
    APP_NAME: str = "拼多多客服自动化服务"
    DEBUG: bool = Field(default=False, env="DEBUG")
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=8000, env="PORT")
    
    # 拼多多API配置
    PDD_CLIENT_ID: str = Field(..., env="PDD_CLIENT_ID")
    PDD_CLIENT_SECRET: str = Field(..., env="PDD_CLIENT_SECRET")
    PDD_ACCESS_TOKEN: Optional[str] = Field(default=None, env="PDD_ACCESS_TOKEN")
    PDD_API_BASE_URL: str = Field(
        default="https://gw-api.pinduoduo.com/api/router",
        env="PDD_API_BASE_URL"
    )
    
    # 消息轮询间隔（秒）
    POLL_INTERVAL: int = Field(default=30, env="POLL_INTERVAL")
    
    # 风险分级阈值
    HIGH_RISK_KEYWORDS: list = Field(
        default=[
            "投诉", "举报", "工商", "消协", "起诉", "律师",
            "赔偿", "假货", "诈骗", "欺诈", "曝光"
        ]
    )
    
    # 自动回复配置
    AUTO_REPLY_ENABLED: bool = Field(default=True, env="AUTO_REPLY_ENABLED")
    AUTO_REPLY_DELAY: float = Field(default=2.0, env="AUTO_REPLY_DELAY")
    
    # Playwright配置
    BROWSER_HEADLESS: bool = Field(default=True, env="BROWSER_HEADLESS")
    PDD_WORKBENCH_URL: str = Field(
        default="https://mms.pinduoduo.com",
        env="PDD_WORKBENCH_URL"
    )
    PDD_USERNAME: Optional[str] = Field(default=None, env="PDD_USERNAME")
    PDD_PASSWORD: Optional[str] = Field(default=None, env="PDD_PASSWORD")
    
    # 数据库配置
    DATABASE_URL: str = Field(
        default="sqlite:///./pdd_cs.db",
        env="DATABASE_URL"
    )
    
    # Redis配置（可选）
    REDIS_URL: Optional[str] = Field(default=None, env="REDIS_URL")
    
    # 知识库配置
    KNOWLEDGE_BASE_PATH: str = Field(
        default="./knowledge_base.json",
        env="KNOWLEDGE_BASE_PATH"
    )
    
    # 日志配置
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    LOG_FILE: Optional[str] = Field(default=None, env="LOG_FILE")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# 创建全局设置实例
settings = Settings()
