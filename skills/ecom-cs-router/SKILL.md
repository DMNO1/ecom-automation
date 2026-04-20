# Skill: ecom-cs-router
# 客服路由技能

## 触发条件
当收到客户消息需要处理时激活。

## 功能描述
对客户消息进行分类和风险分级，决定自动回复或转人工。

## 消息分类
- `faq`: 常见问题（自动回复）
- `logistics`: 物流查询（自动回复）
- `refund`: 退款请求（中风险，需审核）
- `complaint`: 投诉/赔偿（高风险，转人工）
- `unknown`: 未知（默认自动回复）

## 风险分级
- `low`: 可自动回复
- `medium`: 需审核后回复
- `high`: 必须转人工

## 代码实现

```python
# cs_router.py
from typing import Dict, Tuple
import re

class CSRouter:
    # 高风险关键词
    HIGH_RISK_KEYWORDS = ['投诉', '举报', '赔偿', '骗', '假货', '工商', '12315', '律师']
    
    # 退款相关关键词
    REFUND_KEYWORDS = ['退款', '退货', '换货', '不想要', '买错了']
    
    # 物流关键词
    LOGISTICS_KEYWORDS = ['快递', '物流', '发货', '到哪了', '几天到']
    
    # FAQ关键词
    FAQ_KEYWORDS = ['多少钱', '价格', '尺寸', '尺码', '颜色', '材质', '保修']
    
    def route(self, message: str, order_context: Dict = None) -> Dict:
        """路由消息"""
        category = self._classify(message)
        risk_level = self._assess_risk(message, category)
        
        return {
            "category": category,
            "risk_level": risk_level,
            "auto_reply": risk_level == "low",
            "escalate": risk_level == "high",
            "suggested_action": self._get_action(category, risk_level)
        }
    
    def _classify(self, message: str) -> str:
        """消息分类"""
        if any(kw in message for kw in self.HIGH_RISK_KEYWORDS):
            return "complaint"
        if any(kw in message for kw in self.REFUND_KEYWORDS):
            return "refund"
        if any(kw in message for kw in self.LOGISTICS_KEYWORDS):
            return "logistics"
        if any(kw in message for kw in self.FAQ_KEYWORDS):
            return "faq"
        return "unknown"
    
    def _assess_risk(self, message: str, category: str) -> str:
        """风险评估"""
        if category == "complaint":
            return "high"
        if category == "refund":
            return "medium"
        return "low"
    
    def _get_action(self, category: str, risk_level: str) -> str:
        """获取建议动作"""
        if risk_level == "high":
            return "立即转人工处理"
        if risk_level == "medium":
            return "使用标准话术回复，必要时转人工"
        return "使用FAQ知识库自动回复"
```
