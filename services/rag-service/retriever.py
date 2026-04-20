"""
向量检索模块
使用sentence-transformers进行文本向量化，faiss进行相似度检索
"""
import os
import pickle
import numpy as np
from typing import List, Dict, Optional, Tuple
from sentence_transformers import SentenceTransformer
import faiss
from loguru import logger

from knowledge_base import KnowledgeItem, knowledge_base

class VectorRetriever:
    """向量检索器"""
    
    def __init__(self, model_name: str = "shibing624/text2vec-base-chinese", index_dir: str = "./indexes"):
        """
        初始化向量检索器
        
        Args:
            model_name: 文本向量化模型名称
            index_dir: 索引文件存储目录
        """
        self.model_name = model_name
        self.index_dir = index_dir
        self.model = None
        self.indexes: Dict[str, faiss.IndexFlatIP] = {}
        self.item_mappings: Dict[str, Dict[int, KnowledgeItem]] = {}
        
        os.makedirs(index_dir, exist_ok=True)
        self._load_model()
        self._load_indexes()
    
    def _load_model(self):
        """加载文本向量化模型"""
        try:
            logger.info(f"Loading sentence transformer model: {self.model_name}")
            self.model = SentenceTransformer(self.model_name)
            logger.info("Model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            # 使用备用模型或默认模型
            try:
                logger.info("Trying backup model: paraphrase-multilingual-MiniLM-L12-v2")
                self.model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
            except Exception as e2:
                logger.error(f"Error loading backup model: {e2}")
                raise
    
    def _load_indexes(self):
        """加载所有领域的索引"""
        domains = knowledge_base.get_all_domains()
        for domain in domains:
            index_file = os.path.join(self.index_dir, f"{domain}.index")
            mapping_file = os.path.join(self.index_dir, f"{domain}.mapping")
            
            if os.path.exists(index_file) and os.path.exists(mapping_file):
                try:
                    self.indexes[domain] = faiss.read_index(index_file)
                    with open(mapping_file, 'rb') as f:
                        self.item_mappings[domain] = pickle.load(f)
                    logger.info(f"Loaded index for domain: {domain}")
                except Exception as e:
                    logger.error(f"Error loading index for {domain}: {e}")
                    self._build_index(domain)
            else:
                self._build_index(domain)
    
    def _build_index(self, domain: str):
        """为指定领域构建向量索引"""
        try:
            items = knowledge_base.load_knowledge(domain)
            if not items:
                logger.warning(f"No items found for domain: {domain}")
                return
            
            # 准备文本数据
            texts = []
            mapping = {}
            
            for idx, item in enumerate(items):
                # 组合问题、答案和关键词作为检索文本
                combined_text = f"{item.question} {item.answer} {' '.join(item.keywords)}"
                texts.append(combined_text)
                mapping[idx] = item
            
            # 生成向量
            logger.info(f"Generating embeddings for {len(texts)} items in {domain}")
            embeddings = self.model.encode(texts, show_progress_bar=True)
            
            # 创建FAISS索引
            dimension = embeddings.shape[1]
            index = faiss.IndexFlatIP(dimension)  # 内积相似度
            
            # 标准化向量（用于余弦相似度）
            faiss.normalize_L2(embeddings)
            index.add(embeddings.astype('float32'))
            
            # 保存索引和映射
            self.indexes[domain] = index
            self.item_mappings[domain] = mapping
            
            index_file = os.path.join(self.index_dir, f"{domain}.index")
            mapping_file = os.path.join(self.index_dir, f"{domain}.mapping")
            
            faiss.write_index(index, index_file)
            with open(mapping_file, 'wb') as f:
                pickle.dump(mapping, f)
            
            logger.info(f"Built and saved index for domain: {domain}")
            
        except Exception as e:
            logger.error(f"Error building index for {domain}: {e}")
            raise
    
    def rebuild_index(self, domain: str):
        """重建指定领域的索引"""
        logger.info(f"Rebuilding index for domain: {domain}")
        self._build_index(domain)
    
    def rebuild_all_indexes(self):
        """重建所有领域的索引"""
        domains = knowledge_base.get_all_domains()
        for domain in domains:
            self.rebuild_index(domain)
    
    def search(self, domain: str, query: str, top_k: int = 5) -> List[Dict]:
        """
        在指定领域中搜索相关文档
        
        Args:
            domain: 知识领域
            query: 查询文本
            top_k: 返回结果数量
            
        Returns:
            包含相似度分数和知识条目的列表
        """
        if domain not in self.indexes:
            logger.warning(f"No index found for domain: {domain}")
            return []
        
        if not query.strip():
            return []
        
        try:
            # 编码查询文本
            query_embedding = self.model.encode([query])
            faiss.normalize_L2(query_embedding)
            
            # 搜索最相似的文档
            scores, indices = self.indexes[domain].search(
                query_embedding.astype('float32'), 
                min(top_k, self.indexes[domain].ntotal)
            )
            
            results = []
            for score, idx in zip(scores[0], indices[0]):
                if idx != -1 and idx in self.item_mappings[domain]:
                    item = self.item_mappings[domain][idx]
                    results.append({
                        "score": float(score),
                        "item": item.dict(),
                        "matched_text": f"{item.question} {item.answer}"
                    })
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching in {domain}: {e}")
            return []
    
    def search_all(self, query: str, top_k: int = 3) -> Dict[str, List[Dict]]:
        """
        在所有领域中搜索相关文档
        
        Args:
            query: 查询文本
            top_k: 每个领域返回的结果数量
            
        Returns:
            按领域分组的搜索结果
        """
        all_results = {}
        domains = knowledge_base.get_all_domains()
        
        for domain in domains:
            results = self.search(domain, query, top_k)
            if results:
                all_results[domain] = results
        
        return all_results
    
    def get_similar_items(self, domain: str, item_id: str, top_k: int = 5) -> List[Dict]:
        """
        获取与指定条目相似的其他条目
        
        Args:
            domain: 知识领域
            item_id: 知识条目ID
            top_k: 返回结果数量
            
        Returns:
            相似条目列表
        """
        items = knowledge_base.load_knowledge(domain)
        target_item = None
        
        for item in items:
            if item.id == item_id:
                target_item = item
                break
        
        if not target_item:
            logger.warning(f"Item {item_id} not found in {domain}")
            return []
        
        # 使用目标条目的问题作为查询
        return self.search(domain, target_item.question, top_k + 1)[1:]  # 排除自己
    
    def get_stats(self) -> Dict[str, any]:
        """获取检索器统计信息"""
        stats = {
            "model_name": self.model_name,
            "indexed_domains": list(self.indexes.keys()),
            "total_vectors": sum(index.ntotal for index in self.indexes.values()),
            "index_files": []
        }
        
        # 检查索引文件
        for domain in self.indexes:
            index_file = os.path.join(self.index_dir, f"{domain}.index")
            mapping_file = os.path.join(self.index_dir, f"{domain}.mapping")
            if os.path.exists(index_file) and os.path.exists(mapping_file):
                stats["index_files"].append({
                    "domain": domain,
                    "index_size": os.path.getsize(index_file),
                    "mapping_size": os.path.getsize(mapping_file)
                })
        
        return stats

# 全局检索器实例
retriever = VectorRetriever()