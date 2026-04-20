"""
Skills执行器 - 执行各类业务技能
"""
import asyncio
import logging
import importlib.util
import sys
from typing import Dict, Any, Optional, List, Callable
from dataclasses import dataclass
from enum import Enum
from datetime import datetime
import json
import traceback

from config import get_config

logger = logging.getLogger(__name__)


class SkillStatus(Enum):
    """技能执行状态"""
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    TIMEOUT = "timeout"


@dataclass
class SkillResult:
    """技能执行结果"""
    skill_name: str
    status: SkillStatus
    result: Any = None
    error: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    execution_time: Optional[float] = None
    metadata: Dict[str, Any] = None

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "skill_name": self.skill_name,
            "status": self.status.value,
            "result": self.result,
            "error": self.error,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "execution_time": self.execution_time,
            "metadata": self.metadata or {}
        }


class SkillExecutor:
    """Skills执行器"""
    
    def __init__(self):
        self.config = get_config()
        self.skills: Dict[str, Callable] = {}
        self.skill_modules: Dict[str, Any] = {}
        self._load_skills()
    
    def _load_skills(self) -> None:
        """加载所有可用的技能模块"""
        skills_dir = self.config.skill.skills_dir
        logger.info(f"从 {skills_dir} 加载技能模块")
        
        # 预定义技能映射
        builtin_skills = {
            "competitor_analysis": self._competitor_analysis_skill,
            "customer_service_router": self._customer_service_router_skill,
            "after_sales_triage": self._after_sales_triage_skill,
            "daily_report": self._daily_report_skill,
            "weekly_report": self._weekly_report_skill,
            "abnormal_detection": self._abnormal_detection_skill
        }
        
        # 注册内置技能
        for skill_name, skill_func in builtin_skills.items():
            self.skills[skill_name] = skill_func
            logger.info(f"注册内置技能: {skill_name}")
        
        # 尝试从外部目录加载技能
        try:
            import os
            if os.path.exists(skills_dir):
                for filename in os.listdir(skills_dir):
                    if filename.endswith('.py') and not filename.startswith('_'):
                        skill_name = filename[:-3]
                        module_path = os.path.join(skills_dir, filename)
                        self._load_skill_module(skill_name, module_path)
        except Exception as e:
            logger.warning(f"加载外部技能模块失败: {e}")
    
    def _load_skill_module(self, skill_name: str, module_path: str) -> None:
        """动态加载技能模块"""
        try:
            spec = importlib.util.spec_from_file_location(skill_name, module_path)
            if spec and spec.loader:
                module = importlib.util.module_from_spec(spec)
                sys.modules[skill_name] = module
                spec.loader.exec_module(module)
                
                if hasattr(module, 'execute'):
                    self.skills[skill_name] = module.execute
                    self.skill_modules[skill_name] = module
                    logger.info(f"成功加载技能模块: {skill_name}")
        except Exception as e:
            logger.error(f"加载技能模块 {skill_name} 失败: {e}")
    
    async def execute_skill(self, skill_name: str, params: Dict[str, Any] = None) -> SkillResult:
        """执行单个技能"""
        if skill_name not in self.skills:
            return SkillResult(
                skill_name=skill_name,
                status=SkillStatus.FAILED,
                error=f"技能 '{skill_name}' 不存在"
            )
        
        started_at = datetime.now()
        logger.info(f"开始执行技能: {skill_name}, 参数: {params}")
        
        try:
            skill_func = self.skills[skill_name]
            
            # 执行技能（带超时控制）
            result = await asyncio.wait_for(
                skill_func(params or {}),
                timeout=self.config.skill.timeout
            )
            
            completed_at = datetime.now()
            execution_time = (completed_at - started_at).total_seconds()
            
            return SkillResult(
                skill_name=skill_name,
                status=SkillStatus.SUCCESS,
                result=result,
                started_at=started_at,
                completed_at=completed_at,
                execution_time=execution_time
            )
            
        except asyncio.TimeoutError:
            logger.error(f"技能执行超时: {skill_name}")
            return SkillResult(
                skill_name=skill_name,
                status=SkillStatus.TIMEOUT,
                error=f"技能执行超过 {self.config.skill.timeout} 秒",
                started_at=started_at,
                completed_at=datetime.now()
            )
        except Exception as e:
            logger.error(f"技能执行失败: {skill_name}, 错误: {e}")
            logger.error(traceback.format_exc())
            return SkillResult(
                skill_name=skill_name,
                status=SkillStatus.FAILED,
                error=str(e),
                started_at=started_at,
                completed_at=datetime.now()
            )
    
    async def execute_skills_batch(self, skill_requests: List[Dict[str, Any]]) -> List[SkillResult]:
        """批量执行技能"""
        tasks = []
        for request in skill_requests:
            skill_name = request.get("skill_name")
            params = request.get("params", {})
            tasks.append(self.execute_skill(skill_name, params))
        
        # 限制并发数
        semaphore = asyncio.Semaphore(self.config.skill.max_concurrent)
        
        async def limited_execute(task):
            async with semaphore:
                return await task
        
        results = await asyncio.gather(
            *[limited_execute(task) for task in tasks],
            return_exceptions=True
        )
        
        # 处理异常结果
        final_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                final_results.append(SkillResult(
                    skill_name=skill_requests[i].get("skill_name", "unknown"),
                    status=SkillStatus.FAILED,
                    error=str(result)
                ))
            else:
                final_results.append(result)
        
        return final_results
    
    # ============ 内置技能实现 ============
    
    async def _competitor_analysis_skill(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """竞品分析技能"""
        logger.info("执行竞品分析...")
        
        # 模拟竞品分析逻辑
        competitors = params.get("competitors", [])
        metrics = params.get("metrics", ["price", "rating", "sales"])
        
        await asyncio.sleep(1)  # 模拟处理时间
        
        analysis_result = {
            "analysis_date": datetime.now().isoformat(),
            "competitors_analyzed": len(competitors),
            "metrics": metrics,
            "findings": [
                {"competitor": "竞品A", "price_diff": -5.2, "rating_diff": 0.3},
                {"competitor": "竞品B", "price_diff": 3.1, "rating_diff": -0.2}
            ],
            "recommendations": [
                "调整产品定价策略",
                "提升产品质量以提高评分"
            ]
        }
        
        return {"status": "success", "data": analysis_result}
    
    async def _customer_service_router_skill(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """客服路由技能"""
        logger.info("执行客服路由...")
        
        query_type = params.get("query_type", "general")
        priority = params.get("priority", "normal")
        
        await asyncio.sleep(0.5)
        
        # 路由逻辑
        routing_rules = {
            "order": {"queue": "order_support", "priority": "high"},
            "payment": {"queue": "payment_team", "priority": "high"},
            "product": {"queue": "product_expert", "priority": "normal"},
            "general": {"queue": "general_support", "priority": "low"}
        }
        
        route_info = routing_rules.get(query_type, routing_rules["general"])
        
        return {
            "status": "success",
            "data": {
                "query_type": query_type,
                "assigned_queue": route_info["queue"],
                "priority": priority if priority != "normal" else route_info["priority"],
                "estimated_wait_time": "2-5 minutes"
            }
        }
    
    async def _after_sales_triage_skill(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """售后分诊技能"""
        logger.info("执行售后分诊...")
        
        issue_type = params.get("issue_type", "refund")
        order_amount = params.get("order_amount", 0)
        
        await asyncio.sleep(0.5)
        
        # 分诊逻辑
        if issue_type == "refund":
            if order_amount > 500:
                priority = "high"
                handler = "senior_support"
            else:
                priority = "normal"
                handler = "standard_support"
        elif issue_type == "exchange":
            priority = "normal"
            handler = "logistics_team"
        else:
            priority = "low"
            handler = "general_support"
        
        return {
            "status": "success",
            "data": {
                "issue_type": issue_type,
                "priority": priority,
                "assigned_handler": handler,
                "sla_hours": 24 if priority == "high" else 48
            }
        }
    
    async def _daily_report_skill(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """日报生成技能"""
        logger.info("生成日报...")
        
        report_date = params.get("date", datetime.now().strftime("%Y-%m-%d"))
        
        await asyncio.sleep(1)
        
        # 模拟日报数据
        daily_data = {
            "report_date": report_date,
            "summary": {
                "total_orders": 1250,
                "total_revenue": 125000.50,
                "conversion_rate": 3.2,
                "customer_satisfaction": 4.5
            },
            "highlights": [
                "销售额同比增长15%",
                "新客户占比达到25%"
            ],
            "issues": [
                "退货率略有上升",
                "部分商品库存不足"
            ],
            "recommendations": [
                "优化库存管理",
                "加强售后服务"
            ]
        }
        
        return {"status": "success", "data": daily_data}
    
    async def _weekly_report_skill(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """周报生成技能"""
        logger.info("生成周报...")
        
        week_start = params.get("week_start")
        week_end = params.get("week_end")
        
        await asyncio.sleep(1.5)
        
        weekly_data = {
            "period": f"{week_start} 至 {week_end}",
            "summary": {
                "weekly_orders": 8750,
                "weekly_revenue": 875000.50,
                "avg_daily_orders": 1250,
                "top_category": "电子产品"
            },
            "trends": [
                {"metric": "订单量", "change": "+8.5%"},
                {"metric": "客单价", "change": "+3.2%"},
                {"metric": "退货率", "change": "-2.1%"}
            ],
            "top_products": [
                {"name": "产品A", "sales": 1250},
                {"name": "产品B", "sales": 980},
                {"name": "产品C", "sales": 750}
            ],
            "action_items": [
                "增加热销产品库存",
                "优化低转化率商品页面"
            ]
        }
        
        return {"status": "success", "data": weekly_data}
    
    async def _abnormal_detection_skill(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """异常检测技能"""
        logger.info("执行异常检测...")
        
        data_source = params.get("data_source", "orders")
        time_range = params.get("time_range", "24h")
        
        await asyncio.sleep(1)
        
        # 模拟异常检测
        anomalies = [
            {
                "type": "order_spike",
                "severity": "medium",
                "description": "订单量异常增加30%",
                "detected_at": datetime.now().isoformat(),
                "recommendation": "检查是否有促销活动或系统问题"
            },
            {
                "type": "refund_rate",
                "severity": "high",
                "description": "退货率上升至5.2%",
                "detected_at": datetime.now().isoformat(),
                "recommendation": "分析退货原因，检查产品质量"
            }
        ]
        
        return {
            "status": "success",
            "data": {
                "data_source": data_source,
                "time_range": time_range,
                "anomalies_detected": len(anomalies),
                "anomalies": anomalies
            }
        }
    
    def list_skills(self) -> List[str]:
        """列出所有可用技能"""
        return list(self.skills.keys())
    
    def get_skill_info(self, skill_name: str) -> Optional[Dict[str, Any]]:
        """获取技能信息"""
        if skill_name not in self.skills:
            return None
        
        skill_func = self.skills[skill_name]
        return {
            "name": skill_name,
            "description": self.config.skill_mapping.get(skill_name, ""),
            "module": skill_func.__module__ if hasattr(skill_func, '__module__') else "builtin"
        }


# 全局技能执行器实例
skill_executor = SkillExecutor()


def get_skill_executor() -> SkillExecutor:
    """获取技能执行器实例"""
    return skill_executor