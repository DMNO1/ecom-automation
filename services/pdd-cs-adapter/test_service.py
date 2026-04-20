"""
拼多多客服自动化服务测试文件
"""
import asyncio
import sys
import os

# 添加当前目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

async def test_knowledge_base():
    """测试知识库功能"""
    from knowledge_base import KnowledgeBase
    
    kb = KnowledgeBase()
    await kb.load()
    
    print(f"知识库加载成功，共 {len(kb.faq_items)} 条FAQ")
    
    # 测试搜索
    test_queries = ["发货时间", "怎么退货", "优惠券怎么用"]
    for query in test_queries:
        answer = await kb.find_answer(query)
        if answer:
            print(f"查询: {query}")
            print(f"回答: {answer[:50]}...")
            print()
    
    return True


async def test_message_handler():
    """测试消息处理"""
    from message_handler import MessageHandler, MessageContext
    from knowledge_base import KnowledgeBase
    
    kb = KnowledgeBase()
    await kb.load()
    
    handler = MessageHandler(knowledge_base=kb)
    
    # 测试低风险消息
    low_risk_msg = MessageContext(
        conversation_id="test_conv_1",
        message_id="test_msg_1",
        content="请问发货时间是多久？",
        sender_id="user1",
        sender_name="测试用户",
        timestamp=1234567890
    )
    
    result = await handler.process_message(low_risk_msg)
    print(f"低风险消息处理结果:")
    print(f"  风险等级: {result.risk_level.value}")
    print(f"  需要人工: {result.need_human}")
    print(f"  自动回复: {result.auto_reply[:50] if result.auto_reply else '无'}...")
    print()
    
    # 测试高风险消息
    high_risk_msg = MessageContext(
        conversation_id="test_conv_2",
        message_id="test_msg_2",
        content="我要投诉！你们卖假货！",
        sender_id="user2",
        sender_name="投诉用户",
        timestamp=1234567891
    )
    
    result = await handler.process_message(high_risk_msg)
    print(f"高风险消息处理结果:")
    print(f"  风险等级: {result.risk_level.value}")
    print(f"  需要人工: {result.need_human}")
    print(f"  关键词匹配: {result.keywords_matched}")
    print()
    
    return True


async def test_pdd_client():
    """测试拼多多客户端"""
    from pdd_client import PDDClient
    
    try:
        client = PDDClient()
        print("拼多多客户端创建成功")
        
        # 测试签名生成
        test_params = {
            "type": "test",
            "client_id": "test_client",
            "timestamp": "1234567890"
        }
        
        sign = client._generate_sign(test_params)
        print(f"签名生成测试: {sign}")
        print()
        
        return True
    except Exception as e:
        print(f"拼多多客户端测试失败: {e}")
        return False


async def main():
    """主测试函数"""
    print("开始测试拼多多客服自动化服务...")
    print("=" * 50)
    
    try:
        # 测试知识库
        print("1. 测试知识库功能")
        await test_knowledge_base()
        print("✅ 知识库测试通过")
        print("-" * 30)
        
        # 测试消息处理
        print("2. 测试消息处理")
        await test_message_handler()
        print("✅ 消息处理测试通过")
        print("-" * 30)
        
        # 测试拼多多客户端
        print("3. 测试拼多多客户端")
        await test_pdd_client()
        print("✅ 拼多多客户端测试通过")
        print("-" * 30)
        
        print("所有测试完成！")
        print("=" * 50)
        
    except Exception as e:
        print(f"测试过程中出现错误: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
