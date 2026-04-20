"""
Hermes总控服务配置管理
"""
import os
from dataclasses import dataclass, field
from typing import Dict, Any, Optional


@dataclass
class DatabaseConfig:
    """数据库配置"""
    host: str = os.getenv("DB_HOST", "localhost")
    port: int = int(os.getenv("DB_PORT", "5432"))
    database: str = os.getenv("DB_NAME", "ecommerce")
    user: str = os.getenv("DB_USER", "postgres")
    password: str = os.getenv("DB_PASSWORD", "")
    pool_size: int = int(os.getenv("DB_POOL_SIZE", "5"))


@dataclass
class N8NConfig:
    """n8n配置"""
    base_url: str = os.getenv("N8N_BASE_URL", "http://localhost:5678")
    api_key: str = os.getenv("N8N_API_KEY", "")
    timeout: int = int(os.getenv("N8N_TIMEOUT", "30"))


@dataclass
class RedisConfig:
    """Redis配置"""
    host: str = os.getenv("REDIS_HOST", "localhost")
    port: int = int(os.getenv("REDIS_PORT", "6379"))
    password: str = os.getenv("REDIS_PASSWORD", "")
    db: int = int(os.getenv("REDIS_DB", "0"))


@dataclass
class SkillConfig:
    """Skills配置"""
    skills_dir: str = os.getenv("SKILLS_DIR", "./skills")
    timeout: int = int(os.getenv("SKILL_TIMEOUT", "300"))
    max_concurrent: int = int(os.getenv("MAX_CONCURRENT_SKILLS", "5"))


@dataclass
class ReportConfig:
    """报表配置"""
    output_dir: str = os.getenv("REPORT_OUTPUT_DIR", "./reports")
    daily_report_time: str = os.getenv("DAILY_REPORT_TIME", "23:00")
    weekly_report_day: str = os.getenv("WEEKLY_REPORT_DAY", "sunday")
    retention_days: int = int(os.getenv("REPORT_RETENTION_DAYS", "30"))


@dataclass
class Config:
    """主配置"""
    app_name: str = "Hermes总控服务"
    version: str = "1.0.0"
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    
    database: DatabaseConfig = field(default_factory=DatabaseConfig)
    n8n: N8NConfig = field(default_factory=N8NConfig)
    redis: RedisConfig = field(default_factory=RedisConfig)
    skill: SkillConfig = field(default_factory=SkillConfig)
    report: ReportConfig = field(default_factory=ReportConfig)
    
    # 内部API配置
    internal_api_url: str = os.getenv("INTERNAL_API_URL", "http://localhost:8000")
    
    # 技能映射
    skill_mapping: Dict[str, str] = field(default_factory=lambda: {
        "competitor_analysis": "竞品分析",
        "customer_service_router": "客服路由",
        "after_sales_triage": "售后分诊",
        "daily_report": "日报生成",
        "weekly_report": "周报生成",
        "abnormal_detection": "异常检测"
    })


# 全局配置实例
config = Config()


def get_config() -> Config:
    """获取配置实例"""
    return config


def update_config(**kwargs) -> None:
    """更新配置"""
    global config
    for key, value in kwargs.items():
        if hasattr(config, key):
            setattr(config, key, value)