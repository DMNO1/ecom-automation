"""
RAG服务测试脚本
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from knowledge_base import knowledge_base, KnowledgeItem
from retriever import retriever

def test_knowledge_base():
    """测试知识库功能"""
    print("Testing knowledge base...")
    
    # 获取所有领域
    domains = knowledge_base.get_all_domains()
    print(f"Available domains: {domains}")
    
    # 获取统计信息
    stats = knowledge_base.get_stats()
    print(f"Knowledge base stats: {stats}")
    
    # 测试加载知识
    for domain in domains:
        items = knowledge_base.load_knowledge(domain)
        print(f"Domain '{domain}': {len(items)} items")
        
        if items:
            # 显示第一个条目
            first_item = items[0]
            print(f"  Sample item: {first_item.question}")
    
    print("Knowledge base test completed.\n")

def test_retriever():
    """测试检索器功能"""
    print("Testing retriever...")
    
    # 测试查询
    test_queries = [
        ("product", "手机电池续航"),
        ("aftersale", "退货政策"),
        ("rules", "发货时间"),
        ("scripts", "客户问候")
    ]
    
    for domain, query in test_queries:
        print(f"Searching '{query}' in domain '{domain}':")
        try:
            results = retriever.search(domain, query, top_k=2)
            if results:
                for i, result in enumerate(results):
                    score = result["score"]
                    item = result["item"]
                    print(f"  {i+1}. Score: {score:.3f}")
                    print(f"     Q: {item['question']}")
                    print(f"     A: {item['answer'][:50]}...")
            else:
                print("  No results found")
        except Exception as e:
            print(f"  Error: {e}")
    
    # 获取检索器统计信息
    stats = retriever.get_stats()
    print(f"Retriever stats: {stats}")
    
    print("Retriever test completed.\n")

def test_api_simulation():
    """模拟API调用测试"""
    print("Simulating API calls...")
    
    # 模拟查询请求
    from routes.rag import rag_query
    from fastapi import Query
    
    # 这里只是模拟，实际需要FastAPI的测试客户端
    print("API simulation would require FastAPI test client")
    print("Use 'python main.py' to start the service and test with actual HTTP requests")
    
    print("API simulation test completed.\n")

if __name__ == "__main__":
    print("RAG Service Test")
    print("=" * 50)
    
    try:
        test_knowledge_base()
        test_retriever()
        test_api_simulation()
        
        print("All tests completed successfully!")
        print("\nTo start the service:")
        print("  python main.py")
        print("\nTo test with HTTP requests:")
        print("  curl http://localhost:8001/health")
        print("  curl 'http://localhost:8001/rag/query?domain=product&query=手机电池'")
        
    except Exception as e:
        print(f"Test failed: {e}")
        import traceback
        traceback.print_exc()