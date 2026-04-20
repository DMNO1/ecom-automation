"""
任务调度器 - 调用skills、下发任务到n8n
"""
import asyncio
import logging
from typing import Dict, Any, Optional, List, Callable
from datetime import datetime, timedelta
import json
import aiohttp
from enum import Enum

from config import get_config
from skill_executor import get_skill_executor, SkillResult

logger = logging.getLogger(__name__)


class TaskStatus(Enum):
    """任务状态"""
    PENDING = "pending"
    DISPATCHED = "dispatched"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskPriority(Enum):
    """任务优先级"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class Task:
    """任务对象"""
    
    def __init__(self, task_id: str, task_type: str, params: Dict[str, Any], 
                 priority: TaskPriority = TaskPriority.NORMAL):
        self.task_id = task_id
        self.task_type = task_type
        self.params = params
        self.priority = priority
        self.status = TaskStatus.PENDING
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
        self.result = None
        self.error = None
        self.retry_count = 0
        self.max_retries = 3
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "task_id": self.task_id,
            "task_type": self.task_type,
            "params": self.params,
            "priority": self.priority.value,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "result": self.result,
            "error": self.error,
            "retry_count": self.retry_count
        }


class TaskDispatcher:
    """任务调度器"""
    
    def __init__(self):
        self.config = get_config()
        self.skill_executor = get_skill_executor()
        self.tasks: Dict[str, Task] = {}
        self.task_queue: List[Task] = []
        self.running_tasks: Dict[str, asyncio.Task] = {}
        self.max_concurrent_tasks = 10
        self._running = False
    
    async def start(self) -> None:
        """启动任务调度器"""
        self._running = True
        logger.info("任务调度器启动")
        
        # 启动任务处理循环
        asyncio.create_task(self._process_task_queue())
    
    async def stop(self) -> None:
        """停止任务调度器"""
        self._running = False
        
        # 取消所有运行中的任务
        for task_id, task in self.running_tasks.items():
            task.cancel()
        
        # 等待所有任务完成
        if self.running_tasks:
            await asyncio.gather(*self.running_tasks.values(), return_exceptions=True)
        
        logger.info("任务调度器停止")
    
    async def submit_task(self, task_type: str, params: Dict[str, Any], 
                         priority: TaskPriority | str = TaskPriority.NORMAL) -> str:
        """提交任务"""
        task_id = f"task_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{len(self.tasks)}"
        
        # 处理字符串类型的priority
        if isinstance(priority, str):
            priority_map = {
                "low": TaskPriority.LOW,
                "normal": TaskPriority.NORMAL,
                "high": TaskPriority.HIGH,
                "urgent": TaskPriority.URGENT
            }
            priority = priority_map.get(priority.lower(), TaskPriority.NORMAL)
        
        task = Task(task_id, task_type, params, priority)
        self.tasks[task_id] = task
        
        # 根据优先级插入队列
        if priority == TaskPriority.URGENT:
            self.task_queue.insert(0, task)
        elif priority == TaskPriority.HIGH:
            # 插入到高优先级区域
            for i, t in enumerate(self.task_queue):
                if t.priority in [TaskPriority.LOW, TaskPriority.NORMAL]:
                    self.task_queue.insert(i, task)
                    break
            else:
                self.task_queue.append(task)
        else:
            self.task_queue.append(task)
        
        logger.info(f"任务已提交: {task_id}, 类型: {task_type}, 优先级: {priority.value}")
        return task_id
    
    async def dispatch_to_skill(self, skill_name: str, params: Dict[str, Any]) -> SkillResult:
        """直接调度到技能执行器"""
        logger.info(f"调度任务到技能: {skill_name}")
        
        try:
            result = await self.skill_executor.execute_skill(skill_name, params)
            return result
        except Exception as e:
            logger.error(f"调度技能失败: {skill_name}, 错误: {e}")
            raise
    
    async def dispatch_to_n8n(self, workflow_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """调度任务到n8n工作流"""
        logger.info(f"调度任务到n8n: {workflow_name}")
        
        try:
            async with aiohttp.ClientSession() as session:
                # 构建n8n webhook URL
                webhook_url = f"{self.config.n8n.base_url}/webhook/{workflow_name}"
                
                headers = {
                    "Content-Type": "application/json"
                }
                
                if self.config.n8n.api_key:
                    headers["Authorization"] = f"Bearer {self.config.n8n.api_key}"
                
                # 发送请求到n8n
                async with session.post(
                    webhook_url,
                    json=params,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=self.config.n8n.timeout)
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        logger.info(f"n8n任务调度成功: {workflow_name}")
                        return {
                            "status": "success",
                            "workflow": workflow_name,
                            "result": result
                        }
                    else:
                        error_text = await response.text()
                        logger.error(f"n8n任务调度失败: {workflow_name}, 状态码: {response.status}")
                        return {
                            "status": "failed",
                            "workflow": workflow_name,
                            "error": f"HTTP {response.status}: {error_text}"
                        }
                        
        except asyncio.TimeoutError:
            logger.error(f"n8n任务调度超时: {workflow_name}")
            return {
                "status": "failed",
                "workflow": workflow_name,
                "error": "请求超时"
            }
        except Exception as n8n_error:
            logger.error(f"n8n任务调度异常: {workflow_name}, 错误: {n8n_error}")
            return {
                "status": "failed",
                "workflow": workflow_name,
                "error": str(n8n_error)
            }
    
    async def dispatch_to_internal_api(self, endpoint: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """调度任务到内部API"""
        logger.info(f"调度任务到内部API: {endpoint}")
        
        try:
            async with aiohttp.ClientSession() as session:
                # 构建内部API URL
                api_url = f"{self.config.internal_api_url}{endpoint}"
                
                headers = {
                    "Content-Type": "application/json"
                }
                
                # 发送请求到内部API
                async with session.post(
                    api_url,
                    json=params,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        logger.info(f"内部API调用成功: {endpoint}")
                        return {
                            "status": "success",
                            "endpoint": endpoint,
                            "result": result
                        }
                    else:
                        error_text = await response.text()
                        logger.error(f"内部API调用失败: {endpoint}, 状态码: {response.status}")
                        return {
                            "status": "failed",
                            "endpoint": endpoint,
                            "error": f"HTTP {response.status}: {error_text}"
                        }
                        
        except Exception as api_error:
            logger.error(f"内部API调用异常: {endpoint}, 错误: {api_error}")
            return {
                "status": "failed",
                "endpoint": endpoint,
                "error": str(api_error)
            }
    
    async def _process_task_queue(self) -> None:
        """处理任务队列"""
        while self._running:
            try:
                # 检查是否有可用的任务槽位
                if len(self.running_tasks) < self.max_concurrent_tasks and self.task_queue:
                    # 获取下一个任务
                    task = self.task_queue.pop(0)
                    
                    # 创建异步任务
                    async_task = asyncio.create_task(self._execute_task(task))
                    self.running_tasks[task.task_id] = async_task
                    
                    # 添加完成回调
                    async_task.add_done_callback(lambda t: self._task_completed(task.task_id, t))
                
                # 等待一段时间
                await asyncio.sleep(0.1)
                
            except Exception as e:
                logger.error(f"处理任务队列异常: {e}")
                await asyncio.sleep(1)
    
    async def _execute_task(self, task: Task) -> None:
        """执行单个任务"""
        task.status = TaskStatus.RUNNING
        task.updated_at = datetime.now()
        
        logger.info(f"开始执行任务: {task.task_id}")
        
        try:
            # 根据任务类型分发
            if task.task_type.startswith("skill:"):
                # 技能任务
                skill_name = task.task_type[6:]
                result = await self.dispatch_to_skill(skill_name, task.params)
                task.result = result.to_dict() if hasattr(result, 'to_dict') else result
                
            elif task.task_type.startswith("n8n:"):
                # n8n工作流任务
                workflow_name = task.task_type[4:]
                result = await self.dispatch_to_n8n(workflow_name, task.params)
                task.result = result
                
            elif task.task_type.startswith("api:"):
                # 内部API任务
                endpoint = task.task_type[4:]
                result = await self.dispatch_to_internal_api(endpoint, task.params)
                task.result = result
                
            else:
                # 默认作为技能任务处理
                result = await self.dispatch_to_skill(task.task_type, task.params)
                task.result = result.to_dict() if hasattr(result, 'to_dict') else result
            
            task.status = TaskStatus.COMPLETED
            logger.info(f"任务执行完成: {task.task_id}")
            
        except Exception as e:
            logger.error(f"任务执行失败: {task.task_id}, 错误: {e}")
            task.status = TaskStatus.FAILED
            task.error = str(e)
            
            # 重试逻辑
            if task.retry_count < task.max_retries:
                task.retry_count += 1
                task.status = TaskStatus.PENDING
                self.task_queue.append(task)
                logger.info(f"任务重试: {task.task_id}, 重试次数: {task.retry_count}")
        
        finally:
            task.updated_at = datetime.now()
    
    def _task_completed(self, task_id: str, async_task: asyncio.Task) -> None:
        """任务完成回调"""
        if task_id in self.running_tasks:
            del self.running_tasks[task_id]
    
    async def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """获取任务状态"""
        task = self.tasks.get(task_id)
        if task:
            return task.to_dict()
        return None
    
    async def cancel_task(self, task_id: str) -> bool:
        """取消任务"""
        task = self.tasks.get(task_id)
        if not task:
            return False
        
        if task.status in [TaskStatus.PENDING, TaskStatus.DISPATCHED]:
            task.status = TaskStatus.CANCELLED
            task.updated_at = datetime.now()
            
            # 从队列中移除
            if task in self.task_queue:
                self.task_queue.remove(task)
            
            logger.info(f"任务已取消: {task_id}")
            return True
        
        return False
    
    async def list_tasks(self, status: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """列出任务"""
        tasks = []
        
        for task in self.tasks.values():
            if status and task.status.value != status:
                continue
            tasks.append(task.to_dict())
        
        # 按创建时间排序
        tasks.sort(key=lambda x: x["created_at"], reverse=True)
        
        return tasks[:limit]
    
    async def get_queue_status(self) -> Dict[str, Any]:
        """获取队列状态"""
        return {
            "queue_length": len(self.task_queue),
            "running_tasks": len(self.running_tasks),
            "total_tasks": len(self.tasks),
            "max_concurrent": self.max_concurrent_tasks
        }


# 全局任务调度器实例
task_dispatcher = TaskDispatcher()


def get_task_dispatcher() -> TaskDispatcher:
    """获取任务调度器实例"""
    return task_dispatcher