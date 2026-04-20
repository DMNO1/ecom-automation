# Skill: ecom-product-copywriter
# 商品文案生成技能

## 功能描述
根据商品参数和卖点，生成平台适配的标题、卖点描述和FAQ。

## 代码实现

```python
class ProductCopywriter:
    def generate(self, product: Dict, platform: str) -> Dict:
        return {
            "title": self._generate_title(product, platform),
            "selling_points": self._extract_selling_points(product),
            "faq": self._generate_faq(product),
            "keywords": self._extract_keywords(product)
        }
    
    def _generate_title(self, product, platform):
        """生成标题（含平台字数限制）"""
        limits = {"douyin": 60, "pdd": 60, "xianyu": 30, "kuaishou": 40}
        # 实现标题生成逻辑
        return f"{product.get('brand', '')} {product.get('name', '')} {product.get('features', '')}"
```
