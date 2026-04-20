# Skill: ecom-aftersales-triage
# 售后分诊技能

## 触发条件
当有新的售后工单或需要处理售后问题时激活。

## 功能描述
对售后工单进行分类、优先级排序和处理建议。

## 售后类型
- `size`: 尺码问题
- `quality`: 质量问题
- `late_delivery`: 发货延迟
- `wrong_item`: 发错货
- `missing`: 少发/漏发
- `other`: 其他

## 严重程度
- `low`: 普通问题，可标准流程处理
- `medium`: 需要关注，可能影响店铺评分
- `high`: 紧急问题，需立即处理

## 代码实现

```python
# aftersales_triage.py
from typing import Dict, List
from datetime import datetime

class AftersalesTriage:
    # 紧急问题特征
    URGENT_PATTERNS = {
        'quality': ['过敏', '伤害', '安全', '有毒'],
        'missing': ['少发', '漏发', '没收到'],
        'wrong_item': ['发错', '不是我要的']
    }
    
    def triage(self, case: Dict) -> Dict:
        """分诊售后工单"""
        issue_type = self._identify_issue(case)
        severity = self._assess_severity(case, issue_type)
        suggested_action = self._suggest_action(issue_type, severity)
        
        return {
            "issue_type": issue_type,
            "severity": severity,
            "suggested_action": suggested_action,
            "human_required": severity == "high",
            "estimated_resolution_time": self._estimate_time(issue_type),
            "compensation_suggestion": self._suggest_compensation(issue_type, severity)
        }
    
    def _identify_issue(self, case: Dict) -> str:
        """识别问题类型"""
        description = case.get("description", "")
        
        for issue_type, patterns in self.URGENT_PATTERNS.items():
            if any(p in description for p in patterns):
                return issue_type
        
        # 基于关键词推断
        if '尺码' in description or '大小' in description:
            return 'size'
        if '质量' in description or '坏了' in description:
            return 'quality'
        if '慢' in description or '没发' in description:
            return 'late_delivery'
        
        return 'other'
    
    def _assess_severity(self, case: Dict, issue_type: str) -> str:
        """评估严重程度"""
        refund_amount = case.get("refund_amount", 0)
        
        # 高金额退款
        if refund_amount > 200:
            return "high"
        
        # 质量/安全问题
        if issue_type in ['quality', 'wrong_item', 'missing']:
            return "medium"
        
        return "low"
    
    def _suggest_action(self, issue_type: str, severity: str) -> str:
        """建议处理动作"""
        actions = {
            ('size', 'low'): '建议换货，承担运费',
            ('size', 'medium'): '建议退款，赠送优惠券',
            ('quality', 'low'): '补发或退款，赠送小礼品',
            ('quality', 'medium'): '立即退款，额外补偿',
            ('quality', 'high'): '立即退款+赔偿，转人工跟进',
            ('late_delivery', 'low'): '催促物流，赠送优惠券',
            ('late_delivery', 'medium'): '主动联系客户道歉，补偿',
            ('wrong_item', 'medium'): '补发正确商品，错误商品不用退回',
            ('missing', 'medium'): '立即补发，赠送小礼品',
        }
        return actions.get((issue_type, severity), '联系客户了解详情后处理')
    
    def _estimate_time(self, issue_type: str) -> str:
        """预估处理时间"""
        times = {
            'size': '1-2天',
            'quality': '2-3天',
            'late_delivery': '即时',
            'wrong_item': '2-3天',
            'missing': '1-2天',
            'other': '1-3天'
        }
        return times.get(issue_type, '1-3天')
    
    def _suggest_compensation(self, issue_type: str, severity: str) -> Dict:
        """建议补偿方案"""
        if severity == 'high':
            return {"type": "refund_plus", "amount": "全额退款+额外补偿"}
        if severity == 'medium':
            return {"type": "coupon", "amount": "5-10元优惠券"}
        return {"type": "apology", "amount": "诚恳道歉"}
```
