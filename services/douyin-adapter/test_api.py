#!/usr/bin/env python3
"""
简单的API测试脚本
"""
import asyncio
import httpx
import sys

BASE_URL = "http://localhost:8001"


async def test_health():
    """测试健康检查"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/health")
        print(f"健康检查: {response.json()}")


async def test_root():
    """测试根路径"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/")
        print(f"根路径: {response.json()}")


async def main():
    """主函数"""
    print("测试抖店Adapter服务...")
    
    try:
        await test_root()
        await test_health()
        print("测试完成")
    except Exception as e:
        print(f"测试失败: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
