# Skill: ecom-risk-watchdog
# 风险监控技能

## 功能描述
监控全平台异常数据，触发红黄预警。

## 监控项
- 退款率异常（超过阈值）
- 差评激增
- 订单异常（付款未发货）
- 客服投诉增加
- 库存告急

## 代码实现

```python
class RiskWatchdog:
    THRESHOLDS = {
        'refund_rate': 0.1,      # 退款率 > 10%
        'negative_reviews': 5,    # 单日差评 > 5
        'unshipped_hours': 48,    # 超48小时未发货
        'complaint_count': 3      # 投诉 > 3
    }
    
    def monitor(self, stats: Dict) -> Dict:
        alerts = []
        
        if stats.get('refund_rate', 0) > self.THRESHOLDS['refund_rate']:
            alerts.append({
                "level": "red",
                "type": "high_refund_rate",
                "message": f"退款率{stats['refund_rate']*100:.1f}%超过阈值"
            })
        
        return {
            "status": "critical" if any(a['level'] == 'red' for a in alerts) else "warning" if alerts else "normal",
            "alerts": alerts,
            "checked_at": datetime.now().isoformat()
        }
```
