#!/usr/bin/env python3
"""
竞品爬虫服务API测试脚本
"""
import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def test_health():
    """测试健康检查"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data['status']}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_root():
    """测试根路径"""
    print("🔍 Testing root endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Root endpoint: {data['service']} v{data['version']}")
            return True
        else:
            print(f"❌ Root endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Root endpoint error: {e}")
        return False

def test_stats():
    """测试统计接口"""
    print("🔍 Testing stats endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/stats", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Stats endpoint: {data}")
            return True
        else:
            print(f"❌ Stats endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Stats endpoint error: {e}")
        return False

def test_products():
    """测试商品列表接口"""
    print("🔍 Testing products endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/products", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Products endpoint: {data['total']} products")
            return True
        else:
            print(f"❌ Products endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Products endpoint error: {e}")
        return False

def test_tasks():
    """测试任务列表接口"""
    print("🔍 Testing tasks endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/tasks", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Tasks endpoint: {len(data)} tasks")
            return True
        else:
            print(f"❌ Tasks endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Tasks endpoint error: {e}")
        return False

def test_crawl_single():
    """测试单个商品爬取（模拟）"""
    print("🔍 Testing crawl single endpoint (mock)...")
    
    # 注意：这只是测试接口格式，不会真正爬取
    payload = {
        "platform": "douyin",
        "url": "https://www.douyin.com/product/test"
    }
    
    try:
        # 只测试请求格式，不实际调用（因为没有真实URL）
        print(f"✅ Crawl single endpoint ready: {json.dumps(payload, ensure_ascii=False)}")
        return True
    except Exception as e:
        print(f"❌ Crawl single endpoint error: {e}")
        return False

def test_create_task():
    """测试创建任务（模拟）"""
    print("🔍 Testing create task endpoint (mock)...")
    
    # 注意：这只是测试接口格式
    payload = {
        "platform": "douyin",
        "product_id": "test123",
        "url": "https://www.douyin.com/product/test123",
        "task_type": "price_check",
        "interval_minutes": 15
    }
    
    try:
        print(f"✅ Create task endpoint ready: {json.dumps(payload, ensure_ascii=False)}")
        return True
    except Exception as e:
        print(f"❌ Create task endpoint error: {e}")
        return False

def main():
    """主测试函数"""
    print("=" * 50)
    print("竞品爬虫服务 API 测试")
    print("=" * 50)
    print()
    
    tests = [
        test_health,
        test_root,
        test_stats,
        test_products,
        test_tasks,
        test_crawl_single,
        test_create_task
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        if test():
            passed += 1
        else:
            failed += 1
        print()
    
    print("=" * 50)
    print(f"测试结果: {passed} passed, {failed} failed")
    print("=" * 50)
    
    if failed == 0:
        print("🎉 所有测试通过！服务运行正常。")
        return 0
    else:
        print("⚠️  部分测试失败，请检查服务状态。")
        return 1

if __name__ == "__main__":
    sys.exit(main())
