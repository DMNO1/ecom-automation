"""
RAG查询API路由
提供统一接口: /rag/query?domain=xxx
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
from loguru import logger

from knowledge_base import knowledge_base, KnowledgeItem
from retriever import retriever

router = APIRouter(prefix="/rag", tags=["RAG"])

class QueryRequest(BaseModel):
    """查询请求模型"""
    query: str
    domain: Optional[str] = None
    top_k: int = 5
    threshold: float = 0.5

class QueryResponse(BaseModel):
    """查询响应模型"""
    query: str
    domain: str
    results: List[dict]
    total_results: int
    processing_time: float

class KnowledgeItemCreate(BaseModel):
    """创建知识条目请求模型"""
    id: str
    domain: str
    category: str
    question: str
    answer: str
    keywords: List[str] = []
    metadata: dict = {}

class KnowledgeItemUpdate(BaseModel):
    """更新知识条目请求模型"""
    category: Optional[str] = None
    question: Optional[str] = None
    answer: Optional[str] = None
    keywords: Optional[List[str]] = None
    metadata: Optional[dict] = None

@router.get("/query", response_model=QueryResponse)
async def rag_query(
    query: str = Query(..., description="查询文本"),
    domain: str = Query(..., description="知识领域: product/aftersale/rules/scripts"),
    top_k: int = Query(5, description="返回结果数量", ge=1, le=20),
    threshold: float = Query(0.5, description="相似度阈值", ge=0.0, le=1.0)
):
    """
    RAG查询接口
    
    - **query**: 查询文本
    - **domain**: 知识领域 (product/aftersale/rules/scripts)
    - **top_k**: 返回结果数量
    - **threshold**: 相似度阈值
    """
    import time
    start_time = time.time()
    
    # 验证领域参数
    valid_domains = knowledge_base.get_all_domains()
    if domain not in valid_domains:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid domain: {domain}. Valid domains: {valid_domains}"
        )
    
    try:
        # 执行向量检索
        results = retriever.search(domain, query, top_k)
        
        # 过滤低于阈值的结果
        filtered_results = [
            result for result in results 
            if result["score"] >= threshold
        ]
        
        processing_time = time.time() - start_time
        
        return QueryResponse(
            query=query,
            domain=domain,
            results=filtered_results,
            total_results=len(filtered_results),
            processing_time=processing_time
        )
        
    except Exception as e:
        logger.error(f"Error in RAG query: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/query/all")
async def rag_query_all(
    query: str = Query(..., description="查询文本"),
    top_k: int = Query(3, description="每个领域返回的结果数量", ge=1, le=10)
):
    """
    在所有领域中查询
    
    - **query**: 查询文本
    - **top_k**: 每个领域返回的结果数量
    """
    import time
    start_time = time.time()
    
    try:
        all_results = retriever.search_all(query, top_k)
        processing_time = time.time() - start_time
        
        return {
            "query": query,
            "results": all_results,
            "total_results": sum(len(results) for results in all_results.values()),
            "processing_time": processing_time
        }
        
    except Exception as e:
        logger.error(f"Error in RAG query all: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/knowledge/{domain}")
async def get_knowledge_items(
    domain: str,
    category: Optional[str] = None,
    limit: int = Query(100, description="返回结果数量限制", ge=1, le=1000)
):
    """
    获取知识条目列表
    
    - **domain**: 知识领域
    - **category**: 分类筛选（可选）
    - **limit**: 返回结果数量限制
    """
    valid_domains = knowledge_base.get_all_domains()
    if domain not in valid_domains:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid domain: {domain}. Valid domains: {valid_domains}"
        )
    
    try:
        items = knowledge_base.load_knowledge(domain)
        
        # 按分类筛选
        if category:
            items = [item for item in items if item.category == category]
        
        # 限制返回数量
        items = items[:limit]
        
        return {
            "domain": domain,
            "category": category,
            "items": [item.dict() for item in items],
            "total": len(items)
        }
        
    except Exception as e:
        logger.error(f"Error getting knowledge items: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/knowledge/{domain}")
async def create_knowledge_item(domain: str, item: KnowledgeItemCreate):
    """
    创建知识条目
    
    - **domain**: 知识领域
    - **item**: 知识条目数据
    """
    valid_domains = knowledge_base.get_all_domains()
    if domain not in valid_domains:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid domain: {domain}. Valid domains: {valid_domains}"
        )
    
    if item.domain != domain:
        raise HTTPException(
            status_code=400,
            detail="Item domain does not match URL domain"
        )
    
    try:
        knowledge_item = KnowledgeItem(**item.dict())
        success = knowledge_base.add_item(domain, knowledge_item)
        
        if success:
            # 重建索引
            retriever.rebuild_index(domain)
            return {"status": "success", "message": f"Item created in {domain}"}
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Item with ID {item.id} already exists in {domain}"
            )
            
    except Exception as e:
        logger.error(f"Error creating knowledge item: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/knowledge/{domain}/{item_id}")
async def update_knowledge_item(domain: str, item_id: str, update_data: KnowledgeItemUpdate):
    """
    更新知识条目
    
    - **domain**: 知识领域
    - **item_id**: 知识条目ID
    - **update_data**: 更新数据
    """
    valid_domains = knowledge_base.get_all_domains()
    if domain not in valid_domains:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid domain: {domain}. Valid domains: {valid_domains}"
        )
    
    try:
        items = knowledge_base.load_knowledge(domain)
        target_item = None
        
        for item in items:
            if item.id == item_id:
                target_item = item
                break
        
        if not target_item:
            raise HTTPException(
                status_code=404,
                detail=f"Item with ID {item_id} not found in {domain}"
            )
        
        # 更新字段
        update_dict = update_data.dict(exclude_unset=True)
        for key, value in update_dict.items():
            if value is not None:
                setattr(target_item, key, value)
        
        success = knowledge_base.update_item(domain, item_id, target_item)
        
        if success:
            # 重建索引
            retriever.rebuild_index(domain)
            return {"status": "success", "message": f"Item {item_id} updated in {domain}"}
        else:
            raise HTTPException(status_code=500, detail="Failed to update item")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating knowledge item: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/knowledge/{domain}/{item_id}")
async def delete_knowledge_item(domain: str, item_id: str):
    """
    删除知识条目
    
    - **domain**: 知识领域
    - **item_id**: 知识条目ID
    """
    valid_domains = knowledge_base.get_all_domains()
    if domain not in valid_domains:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid domain: {domain}. Valid domains: {valid_domains}"
        )
    
    try:
        success = knowledge_base.delete_item(domain, item_id)
        
        if success:
            # 重建索引
            retriever.rebuild_index(domain)
            return {"status": "success", "message": f"Item {item_id} deleted from {domain}"}
        else:
            raise HTTPException(
                status_code=404,
                detail=f"Item with ID {item_id} not found in {domain}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting knowledge item: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/domains")
async def get_domains():
    """获取所有知识领域"""
    domains = knowledge_base.get_all_domains()
    stats = knowledge_base.get_stats()
    
    return {
        "domains": domains,
        "stats": stats,
        "total_items": sum(stats.values())
    }

@router.post("/rebuild-index/{domain}")
async def rebuild_index(domain: str):
    """
    重建指定领域的索引
    
    - **domain**: 知识领域
    """
    valid_domains = knowledge_base.get_all_domains()
    if domain not in valid_domains:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid domain: {domain}. Valid domains: {valid_domains}"
        )
    
    try:
        retriever.rebuild_index(domain)
        return {"status": "success", "message": f"Index rebuilt for {domain}"}
    except Exception as e:
        logger.error(f"Error rebuilding index: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/rebuild-index-all")
async def rebuild_all_indexes():
    """重建所有领域的索引"""
    try:
        retriever.rebuild_all_indexes()
        return {"status": "success", "message": "All indexes rebuilt"}
    except Exception as e:
        logger.error(f"Error rebuilding all indexes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_stats():
    """获取服务统计信息"""
    kb_stats = knowledge_base.get_stats()
    retriever_stats = retriever.get_stats()
    
    return {
        "knowledge_base": kb_stats,
        "retriever": retriever_stats,
        "service_status": "running"
    }