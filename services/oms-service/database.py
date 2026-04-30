import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

# 获取数据库连接 URL，优先使用环境变量
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql+asyncpg://ecom:ecom2024@postgres:5432/ecom_automation"
)

# 如果 URL 以 postgresql:// 开头，替换为 postgresql+asyncpg:// 以支持异步驱动
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# 创建异步引擎
engine = create_async_engine(DATABASE_URL, echo=False)

# 创建异步会话工厂
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# 声明式基类
Base = declarative_base()

# FastAPI 依赖项，用于获取数据库会话
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
