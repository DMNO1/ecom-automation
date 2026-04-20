# Skill: ecom-selection-scorer
# 选品评分技能

## 功能描述
根据竞品趋势、利润率、售后数据对候选商品进行评分。

## 评分维度
- 利润率得分 (40%)
- 竞品竞争力得分 (30%)
- 售后风险得分 (20%)
- 市场热度得分 (10%)

## 代码实现

```python
class SelectionScorer:
    def score(self, product: Dict) -> Dict:
        margin_score = self._calc_margin_score(product)
        competition_score = self._calc_competition_score(product)
        risk_score = self._calc_risk_score(product)
        market_score = self._calc_market_score(product)
        
        total = (margin_score * 0.4 + competition_score * 0.3 + 
                risk_score * 0.2 + market_score * 0.1)
        
        return {
            "product_id": product.get("id"),
            "total_score": round(total, 2),
            "breakdown": {
                "margin_score": margin_score,
                "competition_score": competition_score,
                "risk_score": risk_score,
                "market_score": market_score
            },
            "recommendation": "推荐" if total > 70 else "观望" if total > 50 else "不推荐"
        }
```
