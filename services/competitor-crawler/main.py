"""
竞品爬虫服务主入口
"""
import asyncio
import signal
import sys
from contextlib import asynccontextmanager
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from loguru import logger

from storage import Platform, get_storage, close_storage
from scheduler import (
    get_scheduler, start_scheduler, stop_scheduler,
    create_price_check_task, create_title_check_task, create_full_check_task,
    TaskScheduler, TaskType, ScheduledTask
)
from crawler import crawl_product, batch_crawl
from analyzer import DataAnalyzer


# 配置日志
logger.remove()
logger.add(sys.stderr, level="INFO")
logger.add("logs/competitor_crawler.log", rotation="10 MB", retention="30 days")


# 数据模型
class ProductUrl(BaseModel):
    platform: Platform
    url: str
    product_id: Optional[str] = None


class TaskCreate(BaseModel):
    platform: Platform
    product_id: str
    url: str
    task_type: TaskType
    interval_minutes: int = Field(ge=1, le=1440, description="间隔分钟数（1-1440）")


class TaskResponse(BaseModel):
    task_id: str
    platform: str
    product_id: str
    task_type: str
    interval_minutes: int
    is_active: bool
    last_run: Optional[str]
    next_run: Optional[str]


class CrawlRequest(BaseModel):
    urls: List[ProductUrl]


class CrawlResponse(BaseModel):
    total: int
    successful: int
    failed: int
    results: List[Dict]


class AnalysisRequest(BaseModel):
    platform: Platform
    product_id: str
    days: int = Field(default=30, ge=1, le=365)


# 应用生命周期
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动
    logger.info("Starting Competitor Crawler Service...")
    
    # 初始化存储
    storage = await get_storage()
    logger.info("Storage initialized")
    
    # 启动调度器
    await start_scheduler()
    logger.info("Scheduler started")
    
    yield
    
    # 关闭
    logger.info("Shutting down Competitor Crawler Service...")
    await stop_scheduler()
    await close_storage()
    logger.info("Service stopped")


# 创建FastAPI应用
app = FastAPI(
    title="竞品爬虫服务",
    description="电商平台竞品数据采集与分析服务",
    version="1.0.0",
    lifespan=lifespan
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# API路由
@app.get("/")
async def root():
    """服务状态"""
    return {
        "service": "Competitor Crawler",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    try:
        storage = await get_storage()
        scheduler = await get_scheduler()
        
        return {
            "status": "healthy",
            "storage": "connected" if storage else "disconnected",
            "scheduler": "running" if scheduler.is_running else "stopped",
            "stats": scheduler.get_stats()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 商品爬取接口
@app.post("/crawl", response_model=CrawlResponse)
async def crawl_products(request: CrawlRequest):
    """爬取商品数据"""
    try:
        urls = [{"platform": u.platform.value, "url": u.url} for u in request.urls]
        results = await batch_crawl(urls)
        
        successful = sum(1 for r in results if r.success)
        failed = len(results) - successful
        
        # 保存成功的结果
        storage = await get_storage()
        for result in results:
            if result.success and result.data:
                await storage.save_snapshot(result.data)
        
        return CrawlResponse(
            total=len(results),
            successful=successful,
            failed=failed,
            results=[
                {
                    "platform": r.data.platform.value if r.data else None,
                    "product_id": r.data.product_id if r.data else None,
                    "success": r.success,
                    "error": r.error
                }
                for r in results
            ]
        )
        
    except Exception as e:
        logger.error(f"Crawl failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/crawl/single")
async def crawl_single_product(product: ProductUrl):
    """爬取单个商品"""
    try:
        result = await crawl_product(product.platform, product.url)
        
        if result.success and result.data:
            storage = await get_storage()
            await storage.save_snapshot(result.data)
            
            return {
                "success": True,
                "data": result.data.dict()
            }
        else:
            return {
                "success": False,
                "error": result.error
            }
            
    except Exception as e:
        logger.error(f"Crawl failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 任务调度接口
@app.post("/tasks", response_model=TaskResponse)
async def create_task(task: TaskCreate):
    """创建调度任务"""
    try:
        scheduler = await get_scheduler()
        
        task_id = f"{task.task_type.value}_{task.platform.value}_{task.product_id}"
        scheduled_task = ScheduledTask(
            task_id=task_id,
            platform=task.platform,
            product_id=task.product_id,
            url=task.url,
            task_type=task.task_type,
            interval_minutes=task.interval_minutes
        )
        
        success = await scheduler.add_task(scheduled_task)
        
        if success:
            return TaskResponse(
                task_id=task_id,
                platform=task.platform.value,
                product_id=task.product_id,
                task_type=task.task_type.value,
                interval_minutes=task.interval_minutes,
                is_active=scheduled_task.is_active,
                last_run=None,
                next_run=scheduled_task.next_run.isoformat() if scheduled_task.next_run else None
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to create task")
            
    except Exception as e:
        logger.error(f"Failed to create task: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/tasks", response_model=List[TaskResponse])
async def list_tasks():
    """获取所有任务"""
    try:
        scheduler = await get_scheduler()
        tasks = scheduler.get_all_tasks()
        
        return [
            TaskResponse(
                task_id=t.task_id,
                platform=t.platform.value,
                product_id=t.product_id,
                task_type=t.task_type.value,
                interval_minutes=t.interval_minutes,
                is_active=t.is_active,
                last_run=t.last_run.isoformat() if t.last_run else None,
                next_run=t.next_run.isoformat() if t.next_run else None
            )
            for t in tasks
        ]
        
    except Exception as e:
        logger.error(f"Failed to list tasks: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/tasks/{task_id}")
async def get_task(task_id: str):
    """获取指定任务"""
    try:
        scheduler = await get_scheduler()
        task = scheduler.get_task(task_id)
        
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        return TaskResponse(
            task_id=task.task_id,
            platform=task.platform.value,
            product_id=task.product_id,
            task_type=task.task_type.value,
            interval_minutes=task.interval_minutes,
            is_active=task.is_active,
            last_run=task.last_run.isoformat() if task.last_run else None,
            next_run=task.next_run.isoformat() if task.next_run else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get task: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    """删除任务"""
    try:
        scheduler = await get_scheduler()
        success = await scheduler.remove_task(task_id)
        
        if success:
            return {"message": "Task deleted"}
        else:
            raise HTTPException(status_code=404, detail="Task not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete task: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/tasks/{task_id}/pause")
async def pause_task(task_id: str):
    """暂停任务"""
    try:
        scheduler = await get_scheduler()
        success = await scheduler.pause_task(task_id)
        
        if success:
            return {"message": "Task paused"}
        else:
            raise HTTPException(status_code=404, detail="Task not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to pause task: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/tasks/{task_id}/resume")
async def resume_task(task_id: str):
    """恢复任务"""
    try:
        scheduler = await get_scheduler()
        success = await scheduler.resume_task(task_id)
        
        if success:
            return {"message": "Task resumed"}
        else:
            raise HTTPException(status_code=404, detail="Task not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to resume task: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 数据分析接口
@app.get("/analysis/price/{platform}/{product_id}")
async def analyze_price(platform: Platform, product_id: str, days: int = 30):
    """价格趋势分析"""
    try:
        storage = await get_storage()
        analyzer = DataAnalyzer(storage)
        
        analysis = await analyzer.analyze_price_trend(platform, product_id, days)
        
        return {
            "platform": platform.value,
            "product_id": product_id,
            "analysis": {
                "current_price": analysis.current_price,
                "min_price": analysis.min_price,
                "max_price": analysis.max_price,
                "avg_price": analysis.avg_price,
                "price_change": analysis.price_change,
                "price_change_percent": analysis.price_change_percent,
                "trend": analysis.trend,
                "volatility": analysis.volatility
            }
        }
        
    except Exception as e:
        logger.error(f"Price analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analysis/title/{platform}/{product_id}")
async def analyze_title_changes(platform: Platform, product_id: str, days: int = 7):
    """标题变化分析"""
    try:
        storage = await get_storage()
        analyzer = DataAnalyzer(storage)
        
        changes = await analyzer.detect_title_changes(platform, product_id, days)
        
        return {
            "platform": platform.value,
            "product_id": product_id,
            "changes": [
                {
                    "old_title": c.old_title,
                    "new_title": c.new_title,
                    "change_time": c.change_time.isoformat(),
                    "added_keywords": c.added_keywords,
                    "removed_keywords": c.removed_keywords
                }
                for c in changes
            ]
        }
        
    except Exception as e:
        logger.error(f"Title analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analysis/promotions/{platform}/{product_id}")
async def monitor_promotions(platform: Platform, product_id: str):
    """促销监控"""
    try:
        storage = await get_storage()
        analyzer = DataAnalyzer(storage)
        
        promotions = await analyzer.monitor_promotions(platform, product_id)
        
        return {
            "platform": platform.value,
            "product_id": product_id,
            "promotions": [
                {
                    "type": p.promotion_type,
                    "detail": p.promotion_detail,
                    "start_time": p.start_time.isoformat(),
                    "savings": p.savings
                }
                for p in promotions
            ]
        }
        
    except Exception as e:
        logger.error(f"Promotion monitoring failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analysis/report/{product_id}")
async def generate_report(product_id: str, platforms: str = "douyin,kuaishou,pdd,xianyu"):
    """生成竞品分析报告"""
    try:
        storage = await get_storage()
        analyzer = DataAnalyzer(storage)
        
        platform_list = [Platform(p.strip()) for p in platforms.split(",") if p.strip()]
        report = await analyzer.generate_competitive_report(product_id, platform_list)
        
        return report
        
    except Exception as e:
        logger.error(f"Report generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 数据查询接口
@app.get("/products")
async def list_products(platform: Optional[Platform] = None):
    """获取所有监控商品"""
    try:
        storage = await get_storage()
        products = await storage.get_all_products(platform)
        
        return {
            "total": len(products),
            "products": products
        }
        
    except Exception as e:
        logger.error(f"Failed to list products: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/products/search")
async def search_products(keyword: str, platform: Optional[Platform] = None):
    """搜索商品"""
    try:
        storage = await get_storage()
        products = await storage.search_products(keyword, platform)
        
        return {
            "total": len(products),
            "products": products
        }
        
    except Exception as e:
        logger.error(f"Failed to search products: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/products/{platform}/{product_id}/history")
async def get_price_history(platform: Platform, product_id: str, days: int = 30):
    """获取价格历史"""
    try:
        storage = await get_storage()
        history = await storage.get_price_history(platform, product_id, days)
        
        return {
            "platform": platform.value,
            "product_id": product_id,
            "days": days,
            "history": history
        }
        
    except Exception as e:
        logger.error(f"Failed to get price history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stats")
async def get_stats():
    """获取服务统计"""
    try:
        scheduler = await get_scheduler()
        return scheduler.get_stats()
        
    except Exception as e:
        logger.error(f"Failed to get stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 信号处理
def handle_sigterm(signum, frame):
    logger.info("Received SIGTERM, shutting down...")
    sys.exit(0)


signal.signal(signal.SIGTERM, handle_sigterm)


# 启动服务
if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
