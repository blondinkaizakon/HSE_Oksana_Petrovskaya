"""
Основной модуль RAG системы
"""
from typing import List, Dict, Optional
try:
    from langchain.schema import Document
except ImportError:
    from langchain_core.documents import Document
from document_loader import DocumentProcessor
from vectorstore_manager import VectorStoreManager
from config import DOCUMENTS_DIR


class RAGSystem:
    """RAG система для поиска и генерации ответов на основе документов"""
    
    def __init__(self, collection_name: str = "rag_documents"):
        """
        Инициализация RAG системы
        
        Args:
            collection_name: Имя коллекции в векторном хранилище
        """
        print("Инициализация RAG системы...")
        self.document_processor = DocumentProcessor()
        self.vectorstore = VectorStoreManager(collection_name=collection_name)
        print("✓ RAG система инициализирована")
    
    def add_document(self, file_path: str) -> Dict:
        """
        Добавляет документ в систему
        
        Args:
            file_path: Путь к файлу
            
        Returns:
            Информация о добавленном документе
        """
        # Загружаем и обрабатываем документ
        chunks = self.document_processor.add_document(file_path)
        
        if not chunks:
            return {"success": False, "message": "Документ пуст или не удалось обработать"}
        
        # Добавляем в векторное хранилище
        ids = self.vectorstore.add_documents(chunks)
        
        return {
            "success": True,
            "filename": chunks[0].metadata.get("filename", "unknown"),
            "chunks_count": len(chunks),
            "ids_count": len(ids)
        }
    
    def add_all_documents(self, directory: str = None) -> Dict:
        """
        Добавляет все документы из директории
        
        Args:
            directory: Путь к директории (по умолчанию DOCUMENTS_DIR)
            
        Returns:
            Информация о добавленных документах
        """
        chunks = self.document_processor.load_all_documents(directory)
        
        if not chunks:
            return {"success": False, "message": "Не найдено документов для добавления"}
        
        # Добавляем в векторное хранилище
        ids = self.vectorstore.add_documents(chunks)
        
        return {
            "success": True,
            "total_chunks": len(chunks),
            "total_ids": len(ids)
        }
    
    def search(self, query: str, k: int = 5, filter_dict: Optional[Dict] = None) -> List[Dict]:
        """
        Поиск релевантных документов
        
        Args:
            query: Поисковый запрос
            k: Количество результатов
            filter_dict: Фильтры для поиска
            
        Returns:
            Список найденных документов с метаданными
        """
        documents = self.vectorstore.search(query, k=k, filter_dict=filter_dict)
        
        results = []
        for doc in documents:
            results.append({
                "content": doc.page_content,
                "metadata": doc.metadata,
                "source": doc.metadata.get("source", "unknown"),
                "filename": doc.metadata.get("filename", "unknown")
            })
        
        return results
    
    def search_with_scores(self, query: str, k: int = 5) -> List[Dict]:
        """
        Поиск с оценками релевантности
        
        Args:
            query: Поисковый запрос
            k: Количество результатов
            
        Returns:
            Список документов с оценками
        """
        results = self.vectorstore.search_with_scores(query, k=k)
        
        formatted_results = []
        for doc, score in results:
            formatted_results.append({
                "content": doc.page_content,
                "metadata": doc.metadata,
                "score": float(score),
                "source": doc.metadata.get("source", "unknown"),
                "filename": doc.metadata.get("filename", "unknown")
            })
        
        return formatted_results
    
    def get_context_for_query(self, query: str, k: int = 5) -> str:
        """
        Получает контекст для запроса (объединенный текст найденных документов)
        
        Args:
            query: Поисковый запрос
            k: Количество документов для использования
            
        Returns:
            Объединенный контекст
        """
        results = self.search(query, k=k)
        
        context_parts = []
        for i, result in enumerate(results, 1):
            context_parts.append(
                f"[Документ {i}: {result['filename']}]\n{result['content']}\n"
            )
        
        return "\n".join(context_parts)
    
    def get_info(self) -> Dict:
        """
        Возвращает информацию о системе
        
        Returns:
            Словарь с информацией
        """
        collection_info = self.vectorstore.get_collection_info()
        
        # Подсчитываем документы в директории
        doc_files = list(DOCUMENTS_DIR.glob("*"))
        doc_files = [f for f in doc_files if f.is_file()]
        
        return {
            **collection_info,
            "documents_in_directory": len(doc_files),
            "documents_directory": str(DOCUMENTS_DIR)
        }

