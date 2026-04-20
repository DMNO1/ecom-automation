#!/usr/bin/env python3
"""
Hermes总控服务测试脚本
"""
import asyncio
import sys
import os

# 添加当前目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import get_config
from skill_executor import get_skill_executor
from task_dispatcher import get_task_dispatcher
from report_generator import get_report_generator


async def test_config():
    """测试配置"""
    print("测试配置...")
    config = get_config()
    print(f"  应用名称: {config.app_name}")
    print(f"  版本: {config.version}")
    print(f"  调试模式: {config.debug}")
    print("配置测试通过 ✓")


async def test_skill_executor():
    """测试技能执行器"""
    print("\n测试技能执行器...")
    executor = get_skill_executor()
    
    # 列出技能
    skills = executor.list_skills()
    print(f"  可用技能: {len(skills)}")
    for skill in skills:
        print(f"    - {skill}")
    
    # 测试执行技能
    result = await executor.execute_skill("daily_report", {"date": "2024-01-01"})
    print(f"  技能执行状态: {result.status.value}")
    print("技能执行器测试通过 ✓")


async def test_task_dispatcher():
    """测试任务调度器"""
    print("\n测试任务调度器...")
    dispatcher = get_task_dispatcher()
    
    # 测试提交任务
    task_id = await dispatcher.submit_task(
        "skill:competitor_analysis",
        {"competitors": ["竞品A", "竞品B"]},
        priority="normal"
    )
    print(f"  任务ID: {task_id}")
    
    # 获取任务状态
    status = await dispatcher.get_task_status(task_id)
    print(f"  任务状态: {status['status'] if status else '未知'}")
    
    # 获取队列状态
    queue_status = await dispatcher.get_queue_status()
    print(f"  队列长度: {queue_status['queue_length']}")
    print("任务调度器测试通过 ✓")


async def test_report_generator():
    """测试报表生成器"""
    print("\n测试报表生成器...")
    generator = get_report_generator()
    
    # 测试生成日报
    result = await generator.generate_daily_report("2024-01-01")
    print(f"  日报生成状态: {result['status']}")
    
    # 列出报表
    reports = await generator.list_reports(limit=5)
    print(f"  报表数量: {len(reports)}")
    print("报表生成器测试通过 ✓")


async def main():
    """主测试函数"""
    print("=" * 50)
    print("Hermes总控服务测试")
    print("=" * 50)
    
    try:
        await test_config()
        await test_skill_executor()
        await test_task_dispatcher()
        await test_report_generator()
        
        print("\n" + "=" * 50)
        print("所有测试通过 ✓")
        print("=" * 50)
        
    except Exception as e:
        print(f"\n测试失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())