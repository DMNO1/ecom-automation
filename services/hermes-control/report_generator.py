"""
报表生成器 - 生成日报/周报
"""
import asyncio
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import json
import os
from pathlib import Path

from config import get_config
from skill_executor import get_skill_executor

logger = logging.getLogger(__name__)


class ReportGenerator:
    """报表生成器"""
    
    def __init__(self):
        self.config = get_config()
        self.skill_executor = get_skill_executor()
        self.output_dir = Path(self.config.report.output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    async def generate_daily_report(self, date: Optional[str] = None) -> Dict[str, Any]:
        """生成日报"""
        if date is None:
            date = datetime.now().strftime("%Y-%m-%d")
        
        logger.info(f"开始生成日报: {date}")
        
        try:
            # 调用日报生成技能
            result = await self.skill_executor.execute_skill(
                "daily_report",
                {"date": date}
            )
            
            if result.status.value == "success":
                report_data = result.result.get("data", {})
                
                # 保存报表
                report_path = await self._save_report("daily", date, report_data)
                
                return {
                    "status": "success",
                    "report_type": "daily",
                    "date": date,
                    "report_path": str(report_path),
                    "data": report_data
                }
            else:
                return {
                    "status": "failed",
                    "error": result.error,
                    "report_type": "daily",
                    "date": date
                }
                
        except Exception as e:
            logger.error(f"生成日报失败: {e}")
            return {
                "status": "failed",
                "error": str(e),
                "report_type": "daily",
                "date": date
            }
    
    async def generate_weekly_report(self, week_start: Optional[str] = None) -> Dict[str, Any]:
        """生成周报"""
        if week_start is None:
            today = datetime.now()
            # 获取本周一
            monday = today - timedelta(days=today.weekday())
            week_start = monday.strftime("%Y-%m-%d")
            week_end = (monday + timedelta(days=6)).strftime("%Y-%m-%d")
        else:
            start_date = datetime.strptime(week_start, "%Y-%m-%d")
            week_end = (start_date + timedelta(days=6)).strftime("%Y-%m-%d")
        
        logger.info(f"开始生成周报: {week_start} 至 {week_end}")
        
        try:
            # 调用周报生成技能
            result = await self.skill_executor.execute_skill(
                "weekly_report",
                {
                    "week_start": week_start,
                    "week_end": week_end
                }
            )
            
            if result.status.value == "success":
                report_data = result.result.get("data", {})
                
                # 保存报表
                report_path = await self._save_report("weekly", week_start, report_data)
                
                return {
                    "status": "success",
                    "report_type": "weekly",
                    "week_start": week_start,
                    "week_end": week_end,
                    "report_path": str(report_path),
                    "data": report_data
                }
            else:
                return {
                    "status": "failed",
                    "error": result.error,
                    "report_type": "weekly",
                    "week_start": week_start
                }
                
        except Exception as e:
            logger.error(f"生成周报失败: {e}")
            return {
                "status": "failed",
                "error": str(e),
                "report_type": "weekly",
                "week_start": week_start
            }
    
    async def generate_abnormal_report(self, time_range: str = "24h") -> Dict[str, Any]:
        """生成异常报告"""
        logger.info(f"开始生成异常报告: 时间范围 {time_range}")
        
        try:
            # 调用异常检测技能
            result = await self.skill_executor.execute_skill(
                "abnormal_detection",
                {"time_range": time_range}
            )
            
            if result.status.value == "success":
                report_data = result.result.get("data", {})
                anomalies = report_data.get("anomalies", [])
                
                if anomalies:
                    # 生成异常报告
                    report_content = self._format_abnormal_report(anomalies, time_range)
                    
                    # 保存异常报告
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    report_path = self.output_dir / f"abnormal_report_{timestamp}.md"
                    
                    with open(report_path, "w", encoding="utf-8") as f:
                        f.write(report_content)
                    
                    return {
                        "status": "success",
                        "report_type": "abnormal",
                        "time_range": time_range,
                        "report_path": str(report_path),
                        "anomalies_count": len(anomalies),
                        "anomalies": anomalies
                    }
                else:
                    return {
                        "status": "success",
                        "report_type": "abnormal",
                        "time_range": time_range,
                        "anomalies_count": 0,
                        "message": "未检测到异常"
                    }
            else:
                return {
                    "status": "failed",
                    "error": result.error,
                    "report_type": "abnormal"
                }
                
        except Exception as e:
            logger.error(f"生成异常报告失败: {e}")
            return {
                "status": "failed",
                "error": str(e),
                "report_type": "abnormal"
            }
    
    async def _save_report(self, report_type: str, date: str, data: Dict[str, Any]) -> Path:
        """保存报表文件"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{report_type}_report_{date}_{timestamp}.json"
        filepath = self.output_dir / filename
        
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"报表已保存: {filepath}")
        return filepath
    
    def _format_abnormal_report(self, anomalies: List[Dict[str, Any]], time_range: str) -> str:
        """格式化异常报告"""
        report = f"""# 异常检测报告

**生成时间**: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
**检测时间范围**: {time_range}
**检测到异常数量**: {len(anomalies)}

## 异常详情

"""
        
        for i, anomaly in enumerate(anomalies, 1):
            severity = anomaly.get("severity", "unknown")
            severity_emoji = "🔴" if severity == "high" else "🟡" if severity == "medium" else "🟢"
            
            report += f"""### {i}. {severity_emoji} {anomaly.get("type", "未知类型")}

- **严重程度**: {severity.upper()}
- **描述**: {anomaly.get("description", "无描述")}
- **检测时间**: {anomaly.get("detected_at", "未知")}
- **建议措施**: {anomaly.get("recommendation", "无建议")}

"""
        
        report += """## 建议行动

1. 立即调查高严重程度异常
2. 根据建议措施采取相应行动
3. 监控异常发展趋势
4. 记录处理过程和结果

---
*此报告由Hermes总控服务自动生成*
"""
        
        return report
    
    async def list_reports(self, report_type: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """列出已生成的报告"""
        reports = []
        
        for file_path in self.output_dir.glob("*_report_*.json"):
            if report_type and not file_path.name.startswith(report_type):
                continue
            
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                
                reports.append({
                    "filename": file_path.name,
                    "path": str(file_path),
                    "size": file_path.stat().st_size,
                    "modified": datetime.fromtimestamp(file_path.stat().st_mtime).isoformat(),
                    "data": data
                })
            except Exception as e:
                logger.warning(f"读取报告文件失败 {file_path}: {e}")
        
        # 按修改时间排序
        reports.sort(key=lambda x: x["modified"], reverse=True)
        
        return reports[:limit]
    
    async def cleanup_old_reports(self) -> Dict[str, Any]:
        """清理旧报告"""
        retention_days = self.config.report.retention_days
        cutoff_date = datetime.now() - timedelta(days=retention_days)
        
        deleted_count = 0
        deleted_size = 0
        
        for file_path in self.output_dir.glob("*_report_*"):
            try:
                file_mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
                if file_mtime < cutoff_date:
                    file_size = file_path.stat().st_size
                    file_path.unlink()
                    deleted_count += 1
                    deleted_size += file_size
                    logger.info(f"删除旧报告: {file_path}")
            except Exception as e:
                logger.warning(f"删除报告失败 {file_path}: {e}")
        
        return {
            "deleted_count": deleted_count,
            "deleted_size": deleted_size,
            "retention_days": retention_days
        }


# 全局报表生成器实例
report_generator = ReportGenerator()


def get_report_generator() -> ReportGenerator:
    """获取报表生成器实例"""
    return report_generator