# Skill: ecom-daily-report
# 日报技能

## 触发条件
定时任务触发（每天08:30、13:00、22:30）或用户请求时激活。

## 功能描述
生成运营日报/周报，汇总各平台数据。

## 日报内容
- 订单统计（新增、完成、退款）
- 客服统计（消息数、回复率、转人工数）
- 售后统计（新增、处理中、已关闭）
- 竞品动态（价格变化、活动监控）
- 异常预警

## 代码实现

```python
# daily_report.py
import httpx
from datetime import datetime, timedelta
from typing import Dict, List

class DailyReport:
    def __init__(self, api_base: str = "http://localhost:8000"):
        self.api_base = api_base
    
    async def generate(self, date: str = None, report_type: str = "daily") -> Dict:
        """生成日报"""
        if not date:
            date = datetime.now().strftime("%Y-%m-%d")
        
        async with httpx.AsyncClient() as client:
            # 获取各平台数据
            orders = await self._get_order_stats(client, date)
            messages = await self._get_message_stats(client, date)
            aftersales = await self._get_aftersales_stats(client, date)
            competitors = await self._get_competitor_alerts(client, date)
        
        return {
            "date": date,
            "type": report_type,
            "orders": orders,
            "messages": messages,
            "aftersales": aftersales,
            "competitor_alerts": competitors,
            "summary": self._generate_summary(orders, messages, aftersales),
            "recommendations": self._generate_recommendations(orders, messages, aftersales)
        }
    
    async def _get_order_stats(self, client, date):
        """获取订单统计"""
        # 实际实现中从API获取
        return {
            "total_new": 0,
            "completed": 0,
            "refunded": 0,
            "total_amount": 0,
            "by_platform": {}
        }
    
    async def _get_message_stats(self, client, date):
        """获取客服统计"""
        return {
            "total_messages": 0,
            "auto_replied": 0,
            "escalated": 0,
            "avg_response_time": "0秒"
        }
    
    async def _get_aftersales_stats(self, client, date):
        """获取售后统计"""
        return {
            "new_cases": 0,
            "processing": 0,
            "closed": 0,
            "total_refund_amount": 0
        }
    
    async def _get_competitor_alerts(self, client, date):
        """获取竞品预警"""
        return []
    
    def _generate_summary(self, orders, messages, aftersales):
        """生成摘要"""
        return f"""
📊 今日运营摘要
━━━━━━━━━━━━━━━━━━
📦 订单: {orders['total_new']}单新增, {orders['completed']}单完成
💬 客服: {messages['total_messages']}条消息, 自动回复{messages['auto_replied']}条
🔄 售后: {aftersales['new_cases']}单新增, {aftersales['closed']}单已关闭
"""
    
    def _generate_recommendations(self, orders, messages, aftersales):
        """生成建议"""
        recommendations = []
        
        if aftersales.get('new_cases', 0) > 10:
            recommendations.append("⚠️ 今日售后工单较多，建议关注产品质量")
        
        if messages.get('escalated', 0) > 5:
            recommendations.append("⚠️ 高风险消息较多，建议检查客服话术")
        
        return recommendations
    
    def format_for_wechat(self, report: Dict) -> str:
        """格式化为微信消息"""
        return f"""
{report['summary']}

💡 建议:
{chr(10).join('• ' + r for r in report['recommendations'])}
"""
```
