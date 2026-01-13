"""
Модуль для управления векторным хранилищем (ChromaDB)
"""
from pathlib import Path
from typing import List, Dict, Optional
import chromadb
from chromadb.config import Settings
try:
    from langchain_community.vectorstores import Chroma
    from langchain_community.embeddings import HuggingFaceEmbeddings
except ImportError:
    # Fallback для более новых версий
    from langchain_huggingface import HuggingFaceEmbeddings
    from langchain_community.vectorstores import Chroma
try:
    from langchain.schema import Document
except ImportError:
    from langchain_core.documents import Document
from config import VECTORSTORE_DIR, EMBEDDINGS_MODEL, TOP_K_RESULTS


class VectorStoreManager:
    """Класс для управления векторным хранилищем"""
    
    def __init__(self, collection_name: str = "rag_documents"):
        """
        Инициализация векторного хранилища
        
        Args:
            collection_name: Имя коллекции в ChromaDB
        """
        self.collection_name = collection_name
        self.vectorstore_path = VECTORSTORE_DIR / collection_name
        
        # Инициализация embeddings модели
        print(f"Загрузка модели embeddings: {EMBEDDINGS_MODEL}...")
        self.embeddings = HuggingFaceEmbeddings(
            model_name=EMBEDDINGS_MODEL,
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )
        
        # Инициализация ChromaDB
        self.vectorstore = Chroma(
            persist_directory=str(self.vectorstore_path),
            embedding_function=self.embeddings,
            collection_name=collection_name
        )
        
        print(f"✓ Векторное хранилище инициализировано: {self.vectorstore_path}")
    
    def add_documents(self, documents: List[Document]) -> List[str]:
        """
        Добавляет документы в векторное хранилище
        
        Args:
            documents: Список документов для добавления
            
        Returns:
            Список ID добавленных документов
        """
        if not documents:
            print("Нет документов для добавления")
            return []
        
        print(f"Добавление {len(documents)} документов в векторное хранилище...")
        
        # Добавляем документы
        ids = self.vectorstore.add_documents(documents)
        
        # Сохраняем персистентно
        self.vectorstore.persist()
        
        print(f"✓ Добавлено {len(ids)} документов")
        return ids
    
    def search(self, query: str, k: int = TOP_K_RESULTS, filter_dict: Optional[Dict] = None) -> List[Document]:
        """
        Поиск релевантных документов по запросу
        
        Args:
            query: Поисковый запрос
            k: Количество результатов для возврата
            filter_dict: Фильтры для поиска (например, {"filename": "document.pdf"})
            
        Returns:
            Список релевантных документов
        """
        if filter_dict:
            # Используем similarity_search_with_score с фильтрами
            results = self.vectorstore.similarity_search_with_score(
                query, k=k, filter=filter_dict
            )
            # Преобразуем результаты (убираем scores)
            documents = [doc for doc, score in results]
        else:
            documents = self.vectorstore.similarity_search(query, k=k)
        
        return documents
    
    def search_with_scores(self, query: str, k: int = TOP_K_RESULTS) -> List[tuple]:
        """
        Поиск с возвратом оценок релевантности
        
        Args:
            query: Поисковый запрос
            k: Количество результатов
            
        Returns:
            Список кортежей (документ, оценка)
        """
        results = self.vectorstore.similarity_search_with_score(query, k=k)
        return results
    
    def delete_collection(self):
        """Удаляет коллекцию"""
        import shutil
        if self.vectorstore_path.exists():
            shutil.rmtree(self.vectorstore_path)
            print(f"✓ Коллекция удалена: {self.vectorstore_path}")
        
        # Пересоздаем векторное хранилище
        self.vectorstore = Chroma(
            persist_directory=str(self.vectorstore_path),
            embedding_function=self.embeddings,
            collection_name=self.collection_name
        )
    
    def get_collection_info(self) -> Dict:
        """
        Возвращает информацию о коллекции
        
        Returns:
            Словарь с информацией о коллекции
        """
        collection = self.vectorstore._collection
        count = collection.count()
        
        return {
            "collection_name": self.collection_name,
            "document_count": count,
            "vectorstore_path": str(self.vectorstore_path),
            "embeddings_model": EMBEDDINGS_MODEL
        }

