"""
知识库管理API路由
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class FAQItem(BaseModel):
    """FAQ项目模型"""
    question: str
    answer: str
    keywords: List[str]
    category: str = "其他"


class FAQUpdateItem(BaseModel):
    """FAQ更新项目模型"""
    id: str
    question: Optional[str] = None
    answer: Optional[str] = None
    keywords: Optional[List[str]] = None
    category: Optional[str] = None


class FAQResponse(BaseModel):
    """FAQ响应模型"""
    id: str
    question: str
    answer: str
    keywords: List[str]
    category: str


class SearchRequest(BaseModel):
    """搜索请求模型"""
    query: str
    limit: int = 5


@router.get("/faq", response_model=List[FAQResponse])
async def get_all_faq():
    """获取所有FAQ"""
    from main import app
    knowledge_base = app.state.knowledge_base
    
    if not knowledge_base:
        raise HTTPException(status_code=500, detail="知识库未初始化")
    
    if not knowledge_base.is_loaded:
        await knowledge_base.load()
    
    return [
        FAQResponse(
            id=item['id'],
            question=item['question'],
            answer=item['answer'],
            keywords=item['keywords'],
            category=item['category']
        )
        for item in knowledge_base.faq_items
    ]


@router.post("/faq", response_model=FAQResponse)
async def create_faq(faq: FAQItem):
    """创建FAQ"""
    from main import app
    knowledge_base = app.state.knowledge_base
    
    if not knowledge_base:
        raise HTTPException(status_code=500, detail="知识库未初始化")
    
    faq_id = await knowledge_base.add_faq(
        question=faq.question,
        answer=faq.answer,
        keywords=faq.keywords,
        category=faq.category
    )


@router.post("/faq/batch", response_model=List[str])
async def batch_create_faqs(faqs: List[FAQItem]):
    """批量创建FAQ"""
    from main import app
    knowledge_base = app.state.knowledge_base
    
    if not knowledge_base:
        raise HTTPException(status_code=500, detail="知识库未初始化")

    faq_dicts = [faq.dict() for faq in faqs]
    new_ids = await knowledge_base.batch_add_faqs(faq_dicts)
    return new_ids


@router.put("/faq/batch/update")
async def batch_update_faqs(updates: List[FAQUpdateItem]):
    """批量更新FAQ"""
    from main import app
    knowledge_base = app.state.knowledge_base

    if not knowledge_base:
        raise HTTPException(status_code=500, detail="知识库未初始化")

    update_dicts = [update.dict(exclude_none=True) for update in updates]
    updated_count = await knowledge_base.batch_update_faqs(update_dicts)

    return {"message": f"成功更新 {updated_count} 条FAQ", "updated_count": updated_count}


@router.get("/faq/{faq_id}", response_model=FAQResponse)
async def get_faq(faq_id: str):
    """获取单个FAQ"""
    from main import app
    knowledge_base = app.state.knowledge_base
    
    if not knowledge_base:
        raise HTTPException(status_code=500, detail="知识库未初始化")
    
    if not knowledge_base.is_loaded:
        await knowledge_base.load()
    
    for item in knowledge_base.faq_items:
        if item['id'] == faq_id:
            return FAQResponse(
                id=item['id'],
                question=item['question'],
                answer=item['answer'],
                keywords=item['keywords'],
                category=item['category']
            )
    
    raise HTTPException(status_code=404, detail="FAQ未找到")


@router.put("/faq/{faq_id}", response_model=FAQResponse)
async def update_faq(faq_id: str, faq: FAQItem):
    """更新FAQ"""
    from main import app
    knowledge_base = app.state.knowledge_base
    
    if not knowledge_base:
        raise HTTPException(status_code=500, detail="知识库未初始化")
    
    success = await knowledge_base.update_faq(
        faq_id=faq_id,
        question=faq.question,
        answer=faq.answer,
        keywords=faq.keywords,
        category=faq.category
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="FAQ未找到")
    
    return FAQResponse(
        id=faq_id,
        question=faq.question,
        answer=faq.answer,
        keywords=faq.keywords,
        category=faq.category
    )


@router.delete("/faq/{faq_id}")
async def delete_faq(faq_id: str):
    """删除FAQ"""
    from main import app
    knowledge_base = app.state.knowledge_base
    
    if not knowledge_base:
        raise HTTPException(status_code=500, detail="知识库未初始化")
    
    success = await knowledge_base.delete_faq(faq_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="FAQ未找到")
    
    return {"message": "删除成功"}


@router.delete("/faq/batch/delete")
async def batch_delete_faqs(faq_ids: List[str]):
    """批量删除FAQ"""
    from main import app
    knowledge_base = app.state.knowledge_base

    if not knowledge_base:
        raise HTTPException(status_code=500, detail="知识库未初始化")

    deleted_count = await knowledge_base.batch_delete_faqs(faq_ids)

    return {"message": f"成功删除 {deleted_count} 条FAQ", "deleted_count": deleted_count}


@router.post("/search")
async def search_knowledge(request: SearchRequest):
    """搜索知识库"""
    from main import app
    knowledge_base = app.state.knowledge_base
    
    if not knowledge_base:
        raise HTTPException(status_code=500, detail="知识库未初始化")
    
    results = await knowledge_base.search(request.query, limit=request.limit)
    
    return {
        "query": request.query,
        "results": results,
        "total": len(results)
    }


@router.get("/categories")
async def get_categories():
    """获取所有分类"""
    from main import app
    knowledge_base = app.state.knowledge_base
    
    if not knowledge_base:
        raise HTTPException(status_code=500, detail="知识库未初始化")
    
    categories = await knowledge_base.get_categories()
    return {"categories": categories}


@router.get("/categories/{category}/faq")
async def get_faq_by_category(category: str):
    """按分类获取FAQ"""
    from main import app
    knowledge_base = app.state.knowledge_base
    
    if not knowledge_base:
        raise HTTPException(status_code=500, detail="知识库未初始化")
    
    faq_items = await knowledge_base.get_faq_by_category(category)
    
    return {
        "category": category,
        "faq_items": faq_items,
        "total": len(faq_items)
    }
