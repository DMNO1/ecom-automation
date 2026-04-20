# Skill: ecom-listing-auditor
# 上架审核技能

## 功能描述
检查商品上架草稿是否合规，识别风险点。

## 检查项
- 禁词检测（夸大宣传、违规词汇）
- 字段完整性（必填项缺失）
- 价格异常（过高/过低）
- 图片合规性

## 代码实现

```python
class ListingAuditor:
    BANNED_WORDS = ['最好', '第一', '绝对', '100%', '永久', '万能']
    
    def audit(self, listing: Dict) -> Dict:
        issues = []
        
        # 禁词检查
        banned = [w for w in self.BANNED_WORDS if w in listing.get('title', '')]
        if banned:
            issues.append({"type": "banned_words", "words": banned})
        
        # 字段检查
        required = ['title', 'price', 'images', 'category']
        missing = [f for f in required if not listing.get(f)]
        if missing:
            issues.append({"type": "missing_fields", "fields": missing})
        
        risk_score = len(issues) * 25
        
        return {
            "passed": len(issues) == 0,
            "risk_score": min(risk_score, 100),
            "issues": issues,
            "suggestions": self._generate_suggestions(issues)
        }
```
