"""
Hermes总控服务 - 主入口
"""
import asyncio
import logging
import logging.config
import sys
from contextlib import asynccontextmanager
from typing import Dict, Any

import uvicorn
from fastapi import FastAPI, HTTPException, Depends, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from config import get_config, Config
from task_dispatcher import get_task_dispatcher, TaskDispatcher, TaskPriority
from report_generator import get_report_generator, ReportGenerator
from skill_executor import get_skill_executor, SkillExecutor

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('hermes_control.log')
    ]
)
logger = logging.getLogger(__name__)

# 全局配置
config = get_config()


# Pydantic模型
class TaskRequest(BaseModel):
    """任务请求模型"""
    task_type: str = Field(..., description="任务类型，如 skill:competitor_analysis 或 n8n:order_process")
    params: Dict[str, Any] = Field(default_factory=dict, description="任务参数")
    priority: str = Field(default="normal", description="优先级: low, normal, high, urgent")


class SkillExecuteRequest(BaseModel):
    """技能执行请求模型"""
    skill_name: str = Field(..., description="技能名称")
    params: Dict[str, Any] = Field(default_factory=dict, description="技能参数")


class ReportRequest(BaseModel):
    """报表请求模型"""
    report_type: str = Field(..., description="报表类型: daily, weekly, abnormal")
    date: str = Field(None, description="日期，格式: YYYY-MM-DD")
    time_range: str = Field(default="24h", description="时间范围，用于异常检测")


class BusinessGoalRequest(BaseModel):
    """业务目标请求模型"""
    goal: str = Field(..., description="业务目标描述")
    target_metrics: Dict[str, Any] = Field(default_factory=dict, description="目标指标")
    deadline: str = Field(None, description="截止时间")


# 应用生命周期
@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    logger.info("Hermes总控服务启动")
    
    # 启动任务调度器
    task_dispatcher = get_task_dispatcher()
    await task_dispatcher.start()
    
    yield
    
    # 停止任务调度器
    await task_dispatcher.stop()
    logger.info("Hermes总控服务关闭")


# 创建FastAPI应用
app = FastAPI(
    title="Hermes总控服务",
    description="电商自动化平台Hermes总控服务，负责任务调度、技能执行和报表生成",
    version=config.version,
    lifespan=lifespan
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 依赖注入
def get_config_dependency() -> Config:
    """获取配置依赖"""
    return get_config()


def get_task_dispatcher_dependency() -> TaskDispatcher:
    """获取任务调度器依赖"""
    return get_task_dispatcher()


def get_report_generator_dependency() -> ReportGenerator:
    """获取报表生成器依赖"""
    return get_report_generator()


def get_skill_executor_dependency() -> SkillExecutor:
    """获取技能执行器依赖"""
    return get_skill_executor()


# API路由
@app.get("/")
async def root():
    """根路径"""
    return {
        "service": config.app_name,
        "version": config.version,
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy", "timestamp": asyncio.get_event_loop().time()}


@app.get("/config")
async def get_service_config(config: Config = Depends(get_config_dependency)):
    """获取服务配置"""
    return {
        "app_name": config.app_name,
        "version": config.version,
        "debug": config.debug,
        "log_level": config.log_level,
        "skill_mapping": config.skill_mapping
    }


# 任务管理API
@app.post("/tasks")
async def submit_task(
    task_request: TaskRequest,
    background_tasks: BackgroundTasks,
    dispatcher: TaskDispatcher = Depends(get_task_dispatcher_dependency)
):
    """提交任务"""
    try:
        # 解析优先级
        priority_map = {
            "low": TaskPriority.LOW,
            "normal": TaskPriority.NORMAL,
            "high": TaskPriority.HIGH,
            "urgent": TaskPriority.URGENT
        }
        priority = priority_map.get(task_request.priority.lower(), TaskPriority.NORMAL)
        
        # 提交任务
        task_id = await dispatcher.submit_task(
            task_request.task_type,
            task_request.params,
            priority
        )
        
        return {
            "status": "success",
            "task_id": task_id,
            "message": f"任务已提交，ID: {task_id}"
        }
        
    except Exception as e:
        logger.error(f"提交任务失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/tasks/{task_id}")
async def get_task_status(
    task_id: str,
    dispatcher: TaskDispatcher = Depends(get_task_dispatcher_dependency)
):
    """获取任务状态"""
    try:
        task_status = await dispatcher.get_task_status(task_id)
        if task_status:
            return task_status
        else:
            raise HTTPException(status_code=404, detail="任务不存在")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取任务状态失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/tasks/{task_id}")
async def cancel_task(
    task_id: str,
    dispatcher: TaskDispatcher = Depends(get_task_dispatcher_dependency)
):
    """取消任务"""
    try:
        success = await dispatcher.cancel_task(task_id)
        if success:
            return {"status": "success", "message": f"任务 {task_id} 已取消"}
        else:
            raise HTTPException(status_code=400, detail="无法取消任务")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"取消任务失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/tasks")
async def list_tasks(
    status: str = Query(None, description="任务状态过滤"),
    limit: int = Query(50, description="返回数量限制"),
    dispatcher: TaskDispatcher = Depends(get_task_dispatcher_dependency)
):
    """列出任务"""
    try:
        tasks = await dispatcher.list_tasks(status, limit)
        return {
            "status": "success",
            "count": len(tasks),
            "tasks": tasks
        }
        
    except Exception as e:
        logger.error(f"列出任务失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/queue/status")
async def get_queue_status(
    dispatcher: TaskDispatcher = Depends(get_task_dispatcher_dependency)
):
    """获取队列状态"""
    try:
        status = await dispatcher.get_queue_status()
        return status
        
    except Exception as e:
        logger.error(f"获取队列状态失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 技能执行API
@app.post("/skills/execute")
async def execute_skill(
    skill_request: SkillExecuteRequest,
    executor: SkillExecutor = Depends(get_skill_executor_dependency)
):
    """执行技能"""
    try:
        result = await executor.execute_skill(skill_request.skill_name, skill_request.params)
        return result.to_dict()
        
    except Exception as e:
        logger.error(f"执行技能失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/skills")
async def list_skills(
    executor: SkillExecutor = Depends(get_skill_executor_dependency)
):
    """列出所有技能"""
    try:
        skills = executor.list_skills()
        skill_info = []
        
        for skill_name in skills:
            info = executor.get_skill_info(skill_name)
            if info:
                skill_info.append(info)
        
        return {
            "status": "success",
            "count": len(skill_info),
            "skills": skill_info
        }
        
    except Exception as e:
        logger.error(f"列出技能失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/skills/{skill_name}")
async def get_skill_info(
    skill_name: str,
    executor: SkillExecutor = Depends(get_skill_executor_dependency)
):
    """获取技能信息"""
    try:
        info = executor.get_skill_info(skill_name)
        if info:
            return info
        else:
            raise HTTPException(status_code=404, detail="技能不存在")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取技能信息失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 报表生成API
@app.post("/reports/generate")
async def generate_report(
    report_request: ReportRequest,
    generator: ReportGenerator = Depends(get_report_generator_dependency)
):
    """生成报表"""
    try:
        if report_request.report_type == "daily":
            result = await generator.generate_daily_report(report_request.date)
        elif report_request.report_type == "weekly":
            result = await generator.generate_weekly_report(report_request.date)
        elif report_request.report_type == "abnormal":
            result = await generator.generate_abnormal_report(report_request.time_range)
        else:
            raise HTTPException(status_code=400, detail="不支持的报表类型")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"生成报表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/reports")
async def list_reports(
    report_type: str = Query(None, description="报表类型过滤"),
    limit: int = Query(50, description="返回数量限制"),
    generator: ReportGenerator = Depends(get_report_generator_dependency)
):
    """列出报表"""
    try:
        reports = await generator.list_reports(report_type, limit)
        return {
            "status": "success",
            "count": len(reports),
            "reports": reports
        }
        
    except Exception as e:
        logger.error(f"列出报表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/reports/cleanup")
async def cleanup_reports(
    generator: ReportGenerator = Depends(get_report_generator_dependency)
):
    """清理旧报表"""
    try:
        result = await generator.cleanup_old_reports()
        return {
            "status": "success",
            "message": f"已清理 {result['deleted_count']} 个旧报表",
            "details": result
        }
        
    except Exception as e:
        logger.error(f"清理报表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 业务目标处理API
@app.post("/goals/process")
async def process_business_goal(
    goal_request: BusinessGoalRequest,
    background_tasks: BackgroundTasks,
    dispatcher: TaskDispatcher = Depends(get_task_dispatcher_dependency)
):
    """处理业务目标"""
    try:
        logger.info(f"处理业务目标: {goal_request.goal}")
        
        # 根据目标类型创建相应任务
        goal_lower = goal_request.goal.lower()
        
        tasks_created = []
        
        # 竞品分析
        if any(keyword in goal_lower for keyword in ["竞品", "竞争对手", "市场分析"]):
            task_id = await dispatcher.submit_task(
                "skill:competitor_analysis",
                {"goal": goal_request.goal, "metrics": goal_request.target_metrics},
                TaskPriority.HIGH
            )
            tasks_created.append({"type": "竞品分析", "task_id": task_id})
        
        # 异常检测
        if any(keyword in goal_lower for keyword in ["异常", "问题", "监控"]):
            task_id = await dispatcher.submit_task(
                "skill:abnormal_detection",
                {"goal": goal_request.goal, "time_range": "24h"},
                TaskPriority.HIGH
            )
            tasks_created.append({"type": "异常检测", "task_id": task_id})
        
        # 客服优化
        if any(keyword in goal_lower for keyword in ["客服", "服务", "支持"]):
            task_id = await dispatcher.submit_task(
                "skill:customer_service_router",
                {"goal": goal_request.goal},
                TaskPriority.NORMAL
            )
            tasks_created.append({"type": "客服路由优化", "task_id": task_id})
        
        # 售后处理
        if any(keyword in goal_lower for keyword in ["售后", "退货", "退款"]):
            task_id = await dispatcher.submit_task(
                "skill:after_sales_triage",
                {"goal": goal_request.goal},
                TaskPriority.NORMAL
            )
            tasks_created.append({"type": "售后分诊", "task_id": task_id})
        
        # 报表生成
        if any(keyword in goal_lower for keyword in ["报表", "报告", "数据"]):
            # 生成日报
            task_id = await dispatcher.submit_task(
                "skill:daily_report",
                {"goal": goal_request.goal},
                TaskPriority.NORMAL
            )
            tasks_created.append({"type": "日报生成", "task_id": task_id})
        
        if not tasks_created:
            # 如果没有匹配到特定目标，创建通用任务
            task_id = await dispatcher.submit_task(
                "n8n:general_goal_processing",
                {"goal": goal_request.goal, "metrics": goal_request.target_metrics},
                TaskPriority.NORMAL
            )
            tasks_created.append({"type": "通用目标处理", "task_id": task_id})
        
        return {
            "status": "success",
            "goal": goal_request.goal,
            "tasks_created": tasks_created,
            "message": f"已创建 {len(tasks_created)} 个任务处理业务目标"
        }
        
    except Exception as n8n_error:
        logger.error(f"处理业务目标失败: {n8n_error}")
        raise HTTPException(status_code=500, detail=str(n8n_error))


# 启动服务
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8080,
        reload=config.debug,
        log_level=config.log_level.lower()
    )