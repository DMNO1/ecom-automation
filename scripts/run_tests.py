#!/usr/bin/env python3
"""
Hermes 电商自动化系统 - 综合测试套件
"""
import os
import sys
import json
import subprocess
import time
from pathlib import Path
from datetime import datetime

import os

PROJECT_ROOT = Path(os.environ.get("PROJECT_ROOT", Path.home() / "ecom-automation"))

class TestRunner:
    def __init__(self):
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "tests": {},
            "summary": {"total": 0, "passed": 0, "failed": 0, "warnings": 0}
        }
    
    def run_all(self):
        """运行所有测试"""
        print("=" * 60)
        print("🧪 Hermes电商自动化系统 - 综合测试")
        print("=" * 60)
        
        self.test_code_quality()
        self.test_imports()
        self.test_api_structure()
        self.test_database_schema()
        self.test_docker_config()
        self.test_documentation()
        self.test_security()
        
        self.print_summary()
        self.save_report()
        
        return self.results
    
    # ==================== 代码质量检查 ====================
    
    def test_code_quality(self):
        """代码语法检查"""
        print("\n📝 代码语法检查...")
        
        services = [
            "api-gateway", "douyin-adapter", "kuaishou-adapter",
            "pdd-cs-adapter", "xianyu-adapter", "competitor-crawler",
            "rag-service", "oms-service", "hermes-control"
        ]
        
        errors = []
        checked = 0
        
        for service in services:
            service_path = PROJECT_ROOT / "services" / service
            if not service_path.exists():
                continue
            
            for py_file in service_path.rglob("*.py"):
                checked += 1
                try:
                    result = subprocess.run(
                        ["python3", "-m", "py_compile", str(py_file)],
                        capture_output=True, text=True, timeout=10
                    )
                    if result.returncode != 0:
                        errors.append(f"{py_file.relative_to(PROJECT_ROOT)}: {result.stderr}")
                except Exception as e:
                    errors.append(f"{py_file.relative_to(PROJECT_ROOT)}: {str(e)}")
        
        if errors:
            self.record_test("code_quality", "FAIL", f"{len(errors)}个语法错误", errors)
            print(f"  ❌ {len(errors)}个语法错误")
            for err in errors[:5]:
                print(f"     - {err}")
        else:
            self.record_test("code_quality", "PASS", f"检查{checked}个文件，全部通过")
            print(f"  ✅ 检查{checked}个文件，全部通过")
    
    def test_imports(self):
        """导入依赖检查"""
        print("\n📦 依赖导入检查...")
        
        core_deps = ["fastapi", "uvicorn", "pydantic", "httpx", "loguru"]
        missing = []
        
        for dep in core_deps:
            try:
                __import__(dep.replace("-", "_"))
            except ImportError:
                missing.append(dep)
        
        if missing:
            self.record_test("imports", "WARNING", f"缺少依赖: {', '.join(missing)}")
            print(f"  ⚠️ 缺少依赖: {', '.join(missing)}")
        else:
            self.record_test("imports", "PASS", "核心依赖全部可用")
            print("  ✅ 核心依赖全部可用")
    
    def test_api_structure(self):
        """API结构检查"""
        print("\n🔌 API结构检查...")
        
        services_with_routes = [
            ("api-gateway", ["shops", "products", "orders", "messages", "aftersales", "competitors", "reports"]),
            ("douyin-adapter", ["products", "orders", "inventory", "aftersales", "logistics"]),
            ("kuaishou-adapter", ["products", "orders", "inventory", "logistics"]),
            ("oms-service", ["order_routes", "inventory_routes", "ticket_routes", "dashboard_routes"]),
        ]
        
        issues = []
        
        for service, expected_routes in services_with_routes:
            routes_dir = PROJECT_ROOT / "services" / service / "routes"
            if not routes_dir.exists():
                issues.append(f"{service}: routes目录不存在")
                continue
            
            for route in expected_routes:
                route_file = routes_dir / f"{route}.py"
                if not route_file.exists():
                    # 尝试带后缀的版本
                    route_file = routes_dir / f"{route.replace('_routes', '')}.py"
                    if not route_file.exists():
                        issues.append(f"{service}: 缺少{route}路由")
        
        if issues:
            self.record_test("api_structure", "WARNING", f"{len(issues)}个路由问题", issues)
            print(f"  ⚠️ {len(issues)}个路由问题")
        else:
            self.record_test("api_structure", "PASS", "所有服务路由结构完整")
            print("  ✅ 所有服务路由结构完整")
    
    def test_database_schema(self):
        """数据库Schema检查"""
        print("\n🗄️ 数据库Schema检查...")
        
        schema_file = PROJECT_ROOT / "database" / "init.sql"
        if not schema_file.exists():
            self.record_test("database_schema", "FAIL", "init.sql不存在")
            print("  ❌ init.sql不存在")
            return
        
        content = schema_file.read_text()
        
        required_tables = ["shops", "products", "competitor_targets", "competitor_snapshots", 
                          "customer_messages", "aftersales_cases", "task_runs"]
        
        missing = [t for t in required_tables if f"CREATE TABLE {t}" not in content]
        
        if missing:
            self.record_test("database_schema", "FAIL", f"缺少表: {', '.join(missing)}")
            print(f"  ❌ 缺少表: {', '.join(missing)}")
        else:
            self.record_test("database_schema", "PASS", f"7张核心表全部定义")
            print("  ✅ 7张核心表全部定义")
    
    def test_docker_config(self):
        """Docker配置检查"""
        print("\n🐳 Docker配置检查...")
        
        compose_file = PROJECT_ROOT / "docker-compose.yml"
        if not compose_file.exists():
            self.record_test("docker_config", "FAIL", "docker-compose.yml不存在")
            print("  ❌ docker-compose.yml不存在")
            return
        
        content = compose_file.read_text()
        
        required_services = ["postgres", "redis", "api-gateway", "douyin-adapter", 
                           "pdd-cs-adapter", "xianyu-adapter", "oms-service", "n8n", "metabase"]
        
        missing = [s for s in required_services if s not in content]
        
        if missing:
            self.record_test("docker_config", "WARNING", f"缺少服务: {', '.join(missing)}")
            print(f"  ⚠️ 缺少服务: {', '.join(missing)}")
        else:
            self.record_test("docker_config", "PASS", "Docker配置完整")
            print("  ✅ Docker配置完整")
    
    def test_documentation(self):
        """文档完整性检查"""
        print("\n📚 文档完整性检查...")
        
        issues = []
        
        # 检查README
        readme = PROJECT_ROOT / "README.md"
        if not readme.exists():
            issues.append("根目录README.md不存在")
        
        # 检查服务文档
        services = [d for d in (PROJECT_ROOT / "services").iterdir() if d.is_dir()]
        for service in services:
            if not (service / "README.md").exists():
                issues.append(f"{service.name}: 缺少README.md")
        
        # 检查Skills文档
        skills = [d for d in (PROJECT_ROOT / "skills").iterdir() if d.is_dir()]
        for skill in skills:
            if not (skill / "SKILL.md").exists():
                issues.append(f"{skill.name}: 缺少SKILL.md")
        
        if issues:
            self.record_test("documentation", "WARNING", f"{len(issues)}个文档缺失", issues)
            print(f"  ⚠️ {len(issues)}个文档缺失")
        else:
            self.record_test("documentation", "PASS", "文档完整")
            print("  ✅ 文档完整")
    
    def test_security(self):
        """安全检查"""
        print("\n🔒 安全检查...")
        
        issues = []
        
        # 检查.env文件是否被gitignore
        gitignore = PROJECT_ROOT / ".gitignore"
        if gitignore.exists():
            content = gitignore.read_text()
            if ".env" not in content:
                issues.append(".env未加入.gitignore")
        
        # 检查是否有硬编码密钥
        sensitive_patterns = ["password", "secret", "token", "api_key"]
        for service_dir in (PROJECT_ROOT / "services").iterdir():
            if not service_dir.is_dir():
                continue
            for py_file in service_dir.rglob("*.py"):
                content = py_file.read_text()
                for pattern in sensitive_patterns:
                    if f'{pattern} = "' in content.lower() or f"{pattern} = '" in content.lower():
                        # 检查是否是硬编码值（非环境变量）
                        if "os.getenv" not in content and "os.environ" not in content:
                            issues.append(f"{py_file.relative_to(PROJECT_ROOT)}: 可能存在硬编码{pattern}")
        
        if issues:
            self.record_test("security", "WARNING", f"{len(issues)}个安全问题", issues[:5])
            print(f"  ⚠️ {len(issues)}个安全问题")
        else:
            self.record_test("security", "PASS", "未发现明显安全问题")
            print("  ✅ 未发现明显安全问题")
    
    # ==================== 辅助方法 ====================
    
    def record_test(self, name, status, message, details=None):
        """记录测试结果"""
        self.results["tests"][name] = {
            "status": status,
            "message": message,
            "details": details or []
        }
        self.results["summary"]["total"] += 1
        if status == "PASS":
            self.results["summary"]["passed"] += 1
        elif status == "FAIL":
            self.results["summary"]["failed"] += 1
        elif status == "WARNING":
            self.results["summary"]["warnings"] += 1
    
    def print_summary(self):
        """打印测试摘要"""
        s = self.results["summary"]
        print("\n" + "=" * 60)
        print("📊 测试摘要")
        print("=" * 60)
        print(f"  总计: {s['total']}项测试")
        print(f"  ✅ 通过: {s['passed']}")
        print(f"  ❌ 失败: {s['failed']}")
        print(f"  ⚠️ 警告: {s['warnings']}")
        
        if s['failed'] == 0:
            print("\n🎉 所有测试通过！")
        else:
            print(f"\n⚠️ 有{s['failed']}项测试失败，需要修复")
    
    def save_report(self):
        """保存测试报告"""
        report_dir = PROJECT_ROOT / "test-reports"
        report_dir.mkdir(exist_ok=True)
        
        report_file = report_dir / f"test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump(self.results, f, indent=2, ensure_ascii=False)
        
        print(f"\n📄 报告已保存: {report_file}")


if __name__ == "__main__":
    runner = TestRunner()
    results = runner.run_all()
    sys.exit(0 if results["summary"]["failed"] == 0 else 1)
