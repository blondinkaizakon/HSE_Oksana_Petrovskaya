"""
Модуль для загрузки и обработки различных типов документов
"""
import os
from pathlib import Path
from typing import List, Dict
from langchain_community.document_loaders import (
    PyPDFLoader,
    TextLoader,
    Docx2txtLoader,
    CSVLoader,
)
try:
    from langchain.text_splitter import RecursiveCharacterTextSplitter
except ImportError:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
from config import DOCUMENTS_DIR, CHUNK_SIZE, CHUNK_OVERLAP


class DocumentProcessor:
    """Класс для обработки документов различных форматов"""
    
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP,
            length_function=len,
        )
    
    def load_document(self, file_path: str) -> List[Dict]:
        """
        Загружает документ и разбивает на чанки
        
        Args:
            file_path: Путь к файлу
            
        Returns:
            Список словарей с чанками документов
        """
        file_path = Path(file_path)
        
        if not file_path.exists():
            raise FileNotFoundError(f"Файл не найден: {file_path}")
        
        # Определяем загрузчик по расширению
        extension = file_path.suffix.lower()
        
        try:
            if extension == ".pdf":
                loader = PyPDFLoader(str(file_path))
            elif extension == ".txt":
                loader = TextLoader(str(file_path), encoding="utf-8")
            elif extension == ".docx":
                loader = Docx2txtLoader(str(file_path))
            elif extension == ".csv":
                loader = CSVLoader(str(file_path), encoding="utf-8")
            elif extension in [".md", ".markdown"]:
                loader = TextLoader(str(file_path), encoding="utf-8")
            else:
                # Пробуем как текстовый файл
                loader = TextLoader(str(file_path), encoding="utf-8")
            
            documents = loader.load()
            
            # Добавляем метаданные
            for doc in documents:
                doc.metadata["source"] = str(file_path)
                doc.metadata["filename"] = file_path.name
                doc.metadata["file_type"] = extension
            
            # Разбиваем на чанки
            chunks = self.text_splitter.split_documents(documents)
            
            return chunks
            
        except Exception as e:
            raise Exception(f"Ошибка при загрузке файла {file_path}: {str(e)}")
    
    def load_all_documents(self, directory: str = None) -> List[Dict]:
        """
        Загружает все документы из указанной директории
        
        Args:
            directory: Путь к директории (по умолчанию DOCUMENTS_DIR)
            
        Returns:
            Список всех чанков из всех документов
        """
        if directory is None:
            directory = DOCUMENTS_DIR
        else:
            directory = Path(directory)
        
        all_chunks = []
        
        # Поддерживаемые расширения
        supported_extensions = {".pdf", ".txt", ".docx", ".csv", ".md", ".markdown"}
        
        for file_path in directory.rglob("*"):
            if file_path.is_file() and file_path.suffix.lower() in supported_extensions:
                try:
                    chunks = self.load_document(str(file_path))
                    all_chunks.extend(chunks)
                    print(f"✓ Загружен: {file_path.name} ({len(chunks)} чанков)")
                except Exception as e:
                    print(f"✗ Ошибка при загрузке {file_path.name}: {e}")
        
        return all_chunks
    
    def add_document(self, file_path: str) -> List[Dict]:
        """
        Добавляет документ в систему
        
        Args:
            file_path: Путь к файлу для добавления
            
        Returns:
            Список чанков документа
        """
        # Копируем файл в documents директорию если он не там
        source_path = Path(file_path)
        target_path = DOCUMENTS_DIR / source_path.name
        
        if source_path != target_path:
            import shutil
            shutil.copy2(source_path, target_path)
            print(f"Файл скопирован: {target_path}")
        
        return self.load_document(str(target_path))

