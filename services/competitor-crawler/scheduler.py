"""
定时任务调度模块
支持定时轮询（15分钟价格/30分钟标题）
"""
import asyncio
import os
import httpx
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass
from enum import Enum

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger
from loguru import logger
from pydantic import BaseModel, Field

from storage import Platform, Storage, get_storage
from crawler import crawl_product, CrawlResult
from analyzer import DataAnalyzer


class TaskType(str, Enum):
    PRICE_CHECK = "price_check"
    TITLE_CHECK = "title_check"
    FULL_CHECK = "full_check"
    PROMOTION_MONITOR = "promotion_monitor"


@dataclass
class ScheduledTask:
    """调度任务"""
    task_id: str
    platform: Platform
    product_id: str
    url: str
    task_type: TaskType
    interval_minutes: int
    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None
    is_active: bool = True
    retry_count: int = 0
    max_retries: int = 3


class TaskScheduler:
    """任务调度器"""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.storage: Optional[Storage] = None
        self.analyzer: Optional[DataAnalyzer] = None
        self.tasks: Dict[str, ScheduledTask] = {}
        self.is_running = False
        
        # 任务执行锁
        self._locks: Dict[str, asyncio.Lock] = {}
        
        # 任务统计
        self.stats = {
            "total_runs": 0,
            "successful_runs": 0,
            "failed_runs": 0,
            "last_run_time": None
        }
    
    async def initialize(self):
        """初始化调度器"""
        try:
            self.storage = await get_storage()
            self.analyzer = DataAnalyzer(self.storage)
            
            # 配置调度器
            self.scheduler.configure(
                job_defaults={
                    'coalesce': True,
                    'max_instances': 3,
                    'misfire_grace_time': 300
                }
            )
            
            logger.info("Task scheduler initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize scheduler: {e}")
            raise
    
    async def start(self):
        """启动调度器"""
        if self.is_running:
            logger.warning("Scheduler is already running")
            return
        
        try:
            self.scheduler.start()
            self.is_running = True
            logger.info("Task scheduler started")
            
            # 启动统计更新任务
            self.scheduler.add_job(
                self._update_stats,
                IntervalTrigger(minutes=5),
                id="stats_update",
                name="Statistics Update"
            )
            
        except Exception as e:
            logger.error(f"Failed to start scheduler: {e}")
            raise
    
    async def stop(self):
        """停止调度器"""
        if not self.is_running:
            return
        
        try:
            self.scheduler.shutdown(wait=False)
            self.is_running = False
            logger.info("Task scheduler stopped")
            
        except Exception as e:
            logger.error(f"Failed to stop scheduler: {e}")
    
    async def add_task(self, task: ScheduledTask) -> bool:
        """添加调度任务"""
        try:
            # 创建任务锁
            self._locks[task.task_id] = asyncio.Lock()
            
            # 根据任务类型设置执行函数
            if task.task_type == TaskType.PRICE_CHECK:
                job_func = self._execute_price_check
            elif task.task_type == TaskType.TITLE_CHECK:
                job_func = self._execute_title_check
            elif task.task_type == TaskType.FULL_CHECK:
                job_func = self._execute_full_check
            elif task.task_type == TaskType.PROMOTION_MONITOR:
                job_func = self._execute_promotion_monitor
            else:
                raise ValueError(f"Unknown task type: {task.task_type}")
            
            # 添加到调度器
            job = self.scheduler.add_job(
                job_func,
                IntervalTrigger(minutes=task.interval_minutes),
                args=[task],
                id=task.task_id,
                name=f"{task.platform.value}/{task.product_id} - {task.task_type.value}",
                replace_existing=True
            )
            
            # 更新下次运行时间
            task.next_run = job.next_run_time
            
            # 保存任务
            self.tasks[task.task_id] = task
            
            logger.info(f"Added task: {task.task_id} ({task.task_type.value})")
            return True
            
        except Exception as e:
            logger.error(f"Failed to add task: {e}")
            return False
    
    async def remove_task(self, task_id: str) -> bool:
        """移除调度任务"""
        try:
            if task_id in self.tasks:
                self.scheduler.remove_job(task_id)
                del self.tasks[task_id]
                del self._locks[task_id]
                logger.info(f"Removed task: {task_id}")
                return True
            return False
            
        except Exception as e:
            logger.error(f"Failed to remove task: {e}")
            return False
    
    async def pause_task(self, task_id: str) -> bool:
        """暂停任务"""
        try:
            if task_id in self.tasks:
                self.scheduler.pause_job(task_id)
                self.tasks[task_id].is_active = False
                logger.info(f"Paused task: {task_id}")
                return True
            return False
            
        except Exception as e:
            logger.error(f"Failed to pause task: {e}")
            return False
    
    async def resume_task(self, task_id: str) -> bool:
        """恢复任务"""
        try:
            if task_id in self.tasks:
                self.scheduler.resume_job(task_id)
                self.tasks[task_id].is_active = True
                logger.info(f"Resumed task: {task_id}")
                return True
            return False
            
        except Exception as e:
            logger.error(f"Failed to resume task: {e}")
            return False
    
    async def _execute_price_check(self, task: ScheduledTask):
        """执行价格检查任务"""
        task_id = task.task_id
        
        async with self._locks[task_id]:
            try:
                logger.info(f"Executing price check: {task.platform.value}/{task.product_id}")
                
                # 爬取最新数据
                result = await crawl_product(task.platform, task.url)
                
                if result.success and result.data:
                    # 获取上次快照进行比较
                    last_snapshot = await self.storage.get_latest_snapshot(
                        task.platform, task.product_id
                    )
                    
                    # 保存新快照
                    await self.storage.save_snapshot(result.data)
                    
                    # 检查价格变化
                    if last_snapshot and last_snapshot.price != result.data.price:
                        price_change = result.data.price - last_snapshot.price
                        change_percent = (price_change / last_snapshot.price) * 100
                        
                        logger.info(
                            f"Price changed for {task.product_id}: "
                            f"{last_snapshot.price} -> {result.data.price} "
                            f"({change_percent:+.1f}%)"
                        )
                        
                        # 如果价格变化超过10%，触发告警
                        if abs(change_percent) > 10:
                            await self._trigger_price_alert(task, last_snapshot.price, result.data.price)
                    
                    # 更新任务状态
                    task.last_run = datetime.now()
                    task.retry_count = 0
                    self.stats["successful_runs"] += 1
                    
                else:
                    raise Exception(result.error or "Crawl failed")
                
            except Exception as e:
                logger.error(f"Price check failed for {task_id}: {e}")
                task.retry_count += 1
                self.stats["failed_runs"] += 1
                
                if task.retry_count >= task.max_retries:
                    logger.error(f"Task {task_id} exceeded max retries, disabling")
                    task.is_active = False
            
            finally:
                self.stats["total_runs"] += 1
                self.stats["last_run_time"] = datetime.now()
    
    async def _execute_title_check(self, task: ScheduledTask):
        """执行标题检查任务"""
        task_id = task.task_id
        
        async with self._locks[task_id]:
            try:
                logger.info(f"Executing title check: {task.platform.value}/{task.product_id}")
                
                # 爬取最新数据
                result = await crawl_product(task.platform, task.url)
                
                if result.success and result.data:
                    # 获取上次快照进行比较
                    last_snapshot = await self.storage.get_latest_snapshot(
                        task.platform, task.product_id
                    )
                    
                    # 保存新快照
                    await self.storage.save_snapshot(result.data)
                    
                    # 检查标题变化
                    if last_snapshot and last_snapshot.title != result.data.title:
                        logger.info(
                            f"Title changed for {task.product_id}: "
                            f"'{last_snapshot.title}' -> '{result.data.title}'"
                        )
                        
                        await self._trigger_title_alert(task, last_snapshot.title, result.data.title)
                    
                    # 更新任务状态
                    task.last_run = datetime.now()
                    task.retry_count = 0
                    self.stats["successful_runs"] += 1
                    
                else:
                    raise Exception(result.error or "Crawl failed")
                
            except Exception as e:
                logger.error(f"Title check failed for {task_id}: {e}")
                task.retry_count += 1
                self.stats["failed_runs"] += 1
                
                if task.retry_count >= task.max_retries:
                    logger.error(f"Task {task_id} exceeded max retries, disabling")
                    task.is_active = False
            
            finally:
                self.stats["total_runs"] += 1
                self.stats["last_run_time"] = datetime.now()
    
    async def _execute_full_check(self, task: ScheduledTask):
        """执行完整检查任务"""
        task_id = task.task_id
        
        async with self._locks[task_id]:
            try:
                logger.info(f"Executing full check: {task.platform.value}/{task.product_id}")
                
                # 爬取最新数据
                result = await crawl_product(task.platform, task.url)
                
                if result.success and result.data:
                    # 保存快照
                    await self.storage.save_snapshot(result.data)
                    
                    # 分析价格趋势
                    try:
                        price_analysis = await self.analyzer.analyze_price_trend(
                            task.platform, task.product_id, days=7
                        )
                        logger.info(
                            f"Price trend for {task.product_id}: "
                            f"{price_analysis.trend} (volatility: {price_analysis.volatility:.1f}%)"
                        )
                    except Exception as e:
                        logger.warning(f"Failed to analyze price trend: {e}")
                    
                    # 检测促销变化
                    promotions = await self.analyzer.monitor_promotions(
                        task.platform, task.product_id
                    )
                    if promotions:
                        logger.info(f"Active promotions for {task.product_id}: {len(promotions)}")
                    
                    # 更新任务状态
                    task.last_run = datetime.now()
                    task.retry_count = 0
                    self.stats["successful_runs"] += 1
                    
                else:
                    raise Exception(result.error or "Crawl failed")
                
            except Exception as e:
                logger.error(f"Full check failed for {task_id}: {e}")
                task.retry_count += 1
                self.stats["failed_runs"] += 1
                
                if task.retry_count >= task.max_retries:
                    logger.error(f"Task {task_id} exceeded max retries, disabling")
                    task.is_active = False
            
            finally:
                self.stats["total_runs"] += 1
                self.stats["last_run_time"] = datetime.now()
    
    async def _execute_promotion_monitor(self, task: ScheduledTask):
        """执行促销监控任务"""
        task_id = task.task_id
        
        async with self._locks[task_id]:
            try:
                logger.info(f"Executing promotion monitor: {task.platform.value}/{task.product_id}")
                
                # 爬取最新数据
                result = await crawl_product(task.platform, task.url)
                
                if result.success and result.data:
                    # 保存快照
                    await self.storage.save_snapshot(result.data)
                    
                    # 监控促销活动
                    promotions = await self.analyzer.monitor_promotions(
                        task.platform, task.product_id
                    )
                    
                    if promotions:
                        logger.info(
                            f"Detected {len(promotions)} promotions for {task.product_id}"
                        )
                        for promo in promotions:
                            logger.info(f"  - {promo.promotion_type}: {promo.promotion_detail}")
                    
                    # 更新任务状态
                    task.last_run = datetime.now()
                    task.retry_count = 0
                    self.stats["successful_runs"] += 1
                    
                else:
                    raise Exception(result.error or "Crawl failed")
                
            except Exception as e:
                logger.error(f"Promotion monitor failed for {task_id}: {e}")
                task.retry_count += 1
                self.stats["failed_runs"] += 1
                
                if task.retry_count >= task.max_retries:
                    logger.error(f"Task {task_id} exceeded max retries, disabling")
                    task.is_active = False
            
            finally:
                self.stats["total_runs"] += 1
                self.stats["last_run_time"] = datetime.now()
    
    async def _send_notification(self, message: str):
        """发送通知"""
        webhook_enabled = os.getenv("NOTIFICATION_WEBHOOK_ENABLED", "false").lower() == "true"
        webhook_url = os.getenv("NOTIFICATION_WEBHOOK_URL")

        if webhook_enabled and webhook_url:
            try:
                async with httpx.AsyncClient() as client:
                    payload = {
                        "msgtype": "text",
                        "text": {
                            "content": message
                        }
                    }
                    response = await client.post(webhook_url, json=payload, timeout=10.0)
                    response.raise_for_status()
                    logger.info("Notification sent successfully")
            except Exception as e:
                logger.error(f"Failed to send notification: {e}")
        else:
            logger.debug("Webhook notification is disabled or URL is not set")

    async def _trigger_price_alert(self, task: ScheduledTask, old_price: float, new_price: float):
        """触发价格告警"""
        # 这里可以实现通知逻辑（邮件、短信、webhook等）
        change_percent = ((new_price - old_price) / old_price) * 100
        
        alert_message = (
            f"价格告警！\n"
            f"商品: {task.product_id}\n"
            f"平台: {task.platform.value}\n"
            f"原价: ¥{old_price:.2f}\n"
            f"现价: ¥{new_price:.2f}\n"
            f"变化: {change_percent:+.1f}%"
        )
        
        logger.warning(alert_message)
        
        await self._send_notification(alert_message)
    
    async def _trigger_title_alert(self, task: ScheduledTask, old_title: str, new_title: str):
        """触发标题变化告警"""
        alert_message = (
            f"标题变化告警！\n"
            f"商品: {task.product_id}\n"
            f"平台: {task.platform.value}\n"
            f"原标题: {old_title}\n"
            f"新标题: {new_title}"
        )
        
        logger.warning(alert_message)
        
        await self._send_notification(alert_message)
    
    async def _update_stats(self):
        """更新统计信息"""
        try:
            # 更新下次运行时间
            for task_id, task in self.tasks.items():
                job = self.scheduler.get_job(task_id)
                if job:
                    task.next_run = job.next_run_time
            
            logger.debug(f"Stats: {self.stats}")
            
        except Exception as e:
            logger.error(f"Failed to update stats: {e}")
    
    def get_all_tasks(self) -> List[ScheduledTask]:
        """获取所有任务"""
        return list(self.tasks.values())
    
    def get_task(self, task_id: str) -> Optional[ScheduledTask]:
        """获取指定任务"""
        return self.tasks.get(task_id)
    
    def get_stats(self) -> Dict[str, Any]:
        """获取统计信息"""
        return {
            **self.stats,
            "active_tasks": sum(1 for t in self.tasks.values() if t.is_active),
            "total_tasks": len(self.tasks)
        }


# 全局调度器实例
_scheduler_instance: Optional[TaskScheduler] = None


async def get_scheduler() -> TaskScheduler:
    """获取调度器实例"""
    global _scheduler_instance
    if _scheduler_instance is None:
        _scheduler_instance = TaskScheduler()
        await _scheduler_instance.initialize()
    return _scheduler_instance


async def start_scheduler():
    """启动调度器"""
    scheduler = await get_scheduler()
    await scheduler.start()


async def stop_scheduler():
    """停止调度器"""
    global _scheduler_instance
    if _scheduler_instance:
        await _scheduler_instance.stop()
        _scheduler_instance = None


# 便捷函数
async def create_price_check_task(platform: Platform, product_id: str, 
                                   url: str, interval_minutes: int = 15) -> str:
    """创建价格检查任务"""
    scheduler = await get_scheduler()
    
    task_id = f"price_{platform.value}_{product_id}_{int(datetime.now().timestamp())}"
    task = ScheduledTask(
        task_id=task_id,
        platform=platform,
        product_id=product_id,
        url=url,
        task_type=TaskType.PRICE_CHECK,
        interval_minutes=interval_minutes
    )
    
    success = await scheduler.add_task(task)
    if success:
        return task_id
    else:
        raise Exception("Failed to create price check task")


async def create_title_check_task(platform: Platform, product_id: str, 
                                   url: str, interval_minutes: int = 30) -> str:
    """创建标题检查任务"""
    scheduler = await get_scheduler()
    
    task_id = f"title_{platform.value}_{product_id}_{int(datetime.now().timestamp())}"
    task = ScheduledTask(
        task_id=task_id,
        platform=platform,
        product_id=product_id,
        url=url,
        task_type=TaskType.TITLE_CHECK,
        interval_minutes=interval_minutes
    )
    
    success = await scheduler.add_task(task)
    if success:
        return task_id
    else:
        raise Exception("Failed to create title check task")


async def create_full_check_task(platform: Platform, product_id: str, 
                                  url: str, interval_minutes: int = 60) -> str:
    """创建完整检查任务"""
    scheduler = await get_scheduler()
    
    task_id = f"full_{platform.value}_{product_id}_{int(datetime.now().timestamp())}"
    task = ScheduledTask(
        task_id=task_id,
        platform=platform,
        product_id=product_id,
        url=url,
        task_type=TaskType.FULL_CHECK,
        interval_minutes=interval_minutes
    )
    
    success = await scheduler.add_task(task)
    if success:
        return task_id
    else:
        raise Exception("Failed to create full check task")
