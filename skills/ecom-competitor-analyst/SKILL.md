# Skill: ecom-competitor-analyst
# 竞品分析技能

## 触发条件
当用户提到竞品、竞争对手、价格监控、市场分析时激活。

## 功能描述
分析竞品数据，生成竞品报告和行动建议。

## 输入数据
- 竞品快照列表（价格、标题、促销标签、评论关键词）
- 历史价格趋势
- 销量变化

## 输出格式
```json
{
  "date": "2026-04-20",
  "summary": "今日竞品变化摘要",
  "price_changes": [
    {
      "competitor": "竞品A",
      "old_price": 99.00,
      "new_price": 89.00,
      "change_percent": -10.1,
      "action": "建议跟进降价"
    }
  ],
  "title_changes": [],
  "promo_alerts": [],
  "recommendations": [
    "竞品A降价10%，建议评估是否跟进",
    "竞品B主图更换，可能有新活动"
  ]
}
```

## 执行步骤
1. 查询 competitor_snapshots 表获取最新数据
2. 与历史数据对比，计算变化
3. 生成变化报告
4. 输出行动建议

## 代码示例

```python
# competitor_analyst.py
import httpx
from datetime import datetime, timedelta
from typing import List, Dict

class CompetitorAnalyst:
    def __init__(self, api_base: str = "http://localhost:8000"):
        self.api_base = api_base
    
    async def analyze(self, platform: str = None, days: int = 1) -> Dict:
        """分析竞品变化"""
        async with httpx.AsyncClient() as client:
            # 获取竞品目标
            targets = await client.get(f"{self.api_base}/api/competitors/targets", 
                                      params={"platform": platform})
            
            # 获取快照数据
            snapshots = await client.get(f"{self.api_base}/api/competitors/snapshots",
                                        params={"days": days})
            
            # 分析变化
            changes = self._analyze_changes(snapshots.json())
            
            return {
                "date": datetime.now().strftime("%Y-%m-%d"),
                "summary": self._generate_summary(changes),
                "price_changes": changes.get("price", []),
                "title_changes": changes.get("title", []),
                "promo_alerts": changes.get("promo", []),
                "recommendations": self._generate_recommendations(changes)
            }
    
    def _analyze_changes(self, snapshots: List[Dict]) -> Dict:
        """分析数据变化"""
        # 实现变化分析逻辑
        return {"price": [], "title": [], "promo": []}
    
    def _generate_summary(self, changes: Dict) -> str:
        """生成摘要"""
        total_changes = sum(len(v) for v in changes.values())
        return f"今日共发现 {total_changes} 项竞品变化"
    
    def _generate_recommendations(self, changes: Dict) -> List[str]:
        """生成建议"""
        recommendations = []
        for price_change in changes.get("price", []):
            if price_change.get("change_percent", 0) < -5:
                recommendations.append(
                    f"{price_change['competitor']}降价{abs(price_change['change_percent'])}%，建议评估是否跟进"
                )
        return recommendations
```
