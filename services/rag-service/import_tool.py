"""
知识库批量导入工具
支持从CSV/JSON文件批量导入知识条目
"""
import json
import csv
import os
from typing import List, Dict, Optional
from pathlib import Path
from loguru import logger

from knowledge_base import knowledge_base, KnowledgeItem

class KnowledgeImporter:
    """知识库导入工具"""
    
    def __init__(self):
        self.supported_formats = ['.json', '.csv']
    
    def import_from_json(self, file_path: str, domain: str) -> Dict:
        """
        从JSON文件导入知识条目
        
        Args:
            file_path: JSON文件路径
            domain: 目标领域
            
        Returns:
            导入结果统计
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if not isinstance(data, list):
                raise ValueError("JSON file should contain a list of items")
            
            return self._import_items(data, domain)
            
        except Exception as e:
            logger.error(f"Error importing from JSON: {e}")
            return {"success": 0, "failed": 0, "errors": [str(e)]}
    
    def import_from_csv(self, file_path: str, domain: str) -> Dict:
        """
        从CSV文件导入知识条目
        
        Args:
            file_path: CSV文件路径
            domain: 目标领域
            
        Returns:
            导入结果统计
        """
        try:
            items = []
            with open(file_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                
                for row in reader:
                    # 处理关键词字段（逗号分隔）
                    if 'keywords' in row and row['keywords']:
                        row['keywords'] = [k.strip() for k in row['keywords'].split(',')]
                    else:
                        row['keywords'] = []
                    
                    # 处理元数据字段（JSON格式）
                    if 'metadata' in row and row['metadata']:
                        try:
                            row['metadata'] = json.loads(row['metadata'])
                        except json.JSONDecodeError:
                            row['metadata'] = {}
                    else:
                        row['metadata'] = {}
                    
                    # 设置领域
                    row['domain'] = domain
                    items.append(row)
            
            return self._import_items(items, domain)
            
        except Exception as e:
            logger.error(f"Error importing from CSV: {e}")
            return {"success": 0, "failed": 0, "errors": [str(e)]}
    
    def _import_items(self, items_data: List[Dict], domain: str) -> Dict:
        """
        导入知识条目列表
        
        Args:
            items_data: 条目数据列表
            domain: 目标领域
            
        Returns:
            导入结果统计
        """
        results = {
            "success": 0,
            "failed": 0,
            "skipped": 0,
            "errors": []
        }
        
        valid_domains = knowledge_base.get_all_domains()
        if domain not in valid_domains:
            results["errors"].append(f"Invalid domain: {domain}")
            return results
        
        # 加载现有知识
        existing_items = knowledge_base.load_knowledge(domain)
        existing_ids = {item.id for item in existing_items}
        
        new_items = []
        
        for item_data in items_data:
            try:
                # 检查必填字段
                required_fields = ['id', 'question', 'answer']
                missing_fields = [f for f in required_fields if f not in item_data]
                
                if missing_fields:
                    results["failed"] += 1
                    results["errors"].append(f"Missing fields {missing_fields} in item {item_data.get('id', 'unknown')}")
                    continue
                
                # 检查ID是否重复
                if item_data['id'] in existing_ids:
                    results["skipped"] += 1
                    results["errors"].append(f"Item with ID {item_data['id']} already exists")
                    continue
                
                # 设置默认值
                if 'category' not in item_data:
                    item_data['category'] = '未分类'
                
                # 创建知识条目
                knowledge_item = KnowledgeItem(**item_data)
                new_items.append(knowledge_item)
                existing_ids.add(item_data['id'])
                results["success"] += 1
                
            except Exception as e:
                results["failed"] += 1
                results["errors"].append(f"Error processing item {item_data.get('id', 'unknown')}: {e}")
        
        # 批量添加新条目
        if new_items:
            all_items = existing_items + new_items
            knowledge_base.save_knowledge(domain, all_items)
            logger.info(f"Imported {len(new_items)} items to domain '{domain}'")
        
        return results
    
    def export_to_json(self, domain: str, file_path: str) -> bool:
        """
        导出知识条目到JSON文件
        
        Args:
            domain: 知识领域
            file_path: 输出文件路径
            
        Returns:
            是否成功
        """
        try:
            items = knowledge_base.load_knowledge(domain)
            data = [item.dict() for item in items]
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2, default=str)
            
            logger.info(f"Exported {len(items)} items from domain '{domain}' to {file_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error exporting to JSON: {e}")
            return False
    
    def export_to_csv(self, domain: str, file_path: str) -> bool:
        """
        导出知识条目到CSV文件
        
        Args:
            domain: 知识领域
            file_path: 输出文件路径
            
        Returns:
            是否成功
        """
        try:
            items = knowledge_base.load_knowledge(domain)
            
            if not items:
                logger.warning(f"No items found in domain '{domain}'")
                return False
            
            # 获取所有字段名
            fieldnames = list(items[0].dict().keys())
            
            with open(file_path, 'w', encoding='utf-8', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                
                for item in items:
                    row = item.dict()
                    # 处理列表类型字段
                    if 'keywords' in row:
                        row['keywords'] = ', '.join(row['keywords'])
                    if 'metadata' in row:
                        row['metadata'] = json.dumps(row['metadata'], ensure_ascii=False)
                    writer.writerow(row)
            
            logger.info(f"Exported {len(items)} items from domain '{domain}' to {file_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error exporting to CSV: {e}")
            return False
    
    def generate_template(self, domain: str, file_path: str, format: str = 'json') -> bool:
        """
        生成导入模板文件
        
        Args:
            domain: 知识领域
            file_path: 输出文件路径
            format: 文件格式 (json/csv)
            
        Returns:
            是否成功
        """
        try:
            template_data = [
                {
                    "id": f"{domain}_template_001",
                    "domain": domain,
                    "category": "示例分类",
                    "question": "示例问题",
                    "answer": "示例答案",
                    "keywords": ["关键词1", "关键词2"],
                    "metadata": {"key": "value"}
                }
            ]
            
            if format.lower() == 'json':
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(template_data, f, ensure_ascii=False, indent=2)
            elif format.lower() == 'csv':
                fieldnames = template_data[0].keys()
                with open(file_path, 'w', encoding='utf-8', newline='') as f:
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()
                    for row in template_data:
                        # 处理列表类型字段
                        if 'keywords' in row:
                            row['keywords'] = ', '.join(row['keywords'])
                        if 'metadata' in row:
                            row['metadata'] = json.dumps(row['metadata'], ensure_ascii=False)
                        writer.writerow(row)
            else:
                raise ValueError(f"Unsupported format: {format}")
            
            logger.info(f"Generated template for domain '{domain}' at {file_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error generating template: {e}")
            return False

# 命令行工具
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="知识库批量导入工具")
    parser.add_argument("action", choices=["import", "export", "template"], help="操作类型")
    parser.add_argument("--domain", required=True, help="知识领域")
    parser.add_argument("--file", required=True, help="文件路径")
    parser.add_argument("--format", choices=["json", "csv"], default="json", help="文件格式")
    
    args = parser.parse_args()
    
    importer = KnowledgeImporter()
    
    if args.action == "import":
        if args.format == "json":
            result = importer.import_from_json(args.file, args.domain)
        else:
            result = importer.import_from_csv(args.file, args.domain)
        
        print(f"Import results:")
        print(f"  Success: {result['success']}")
        print(f"  Failed: {result['failed']}")
        print(f"  Skipped: {result['skipped']}")
        if result['errors']:
            print(f"  Errors:")
            for error in result['errors']:
                print(f"    - {error}")
    
    elif args.action == "export":
        if args.format == "json":
            success = importer.export_to_json(args.domain, args.file)
        else:
            success = importer.export_to_csv(args.domain, args.file)
        
        if success:
            print(f"Successfully exported to {args.file}")
        else:
            print("Export failed")
    
    elif args.action == "template":
        success = importer.generate_template(args.domain, args.file, args.format)
        if success:
            print(f"Template generated at {args.file}")
        else:
            print("Template generation failed")