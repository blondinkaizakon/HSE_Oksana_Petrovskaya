#!/usr/bin/env python3
"""
Скрипт для добавления документов в RAG систему
"""
import sys
from pathlib import Path

# Добавляем родительскую директорию в путь
sys.path.append(str(Path(__file__).parent.parent))

from rag_system import RAGSystem
from config import DOCUMENTS_DIR
import argparse


def main():
    parser = argparse.ArgumentParser(description="Добавить документы в RAG систему")
    parser.add_argument(
        "--file",
        type=str,
        help="Путь к файлу для добавления"
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Добавить все документы из директории documents"
    )
    parser.add_argument(
        "--directory",
        type=str,
        default=None,
        help="Директория с документами (по умолчанию: documents/)"
    )
    
    args = parser.parse_args()
    
    print("Инициализация RAG системы...")
    rag = RAGSystem()
    
    if args.file:
        # Добавляем один файл
        print(f"Добавление файла: {args.file}")
        result = rag.add_document(args.file)
        
        if result["success"]:
            print(f"✓ Файл успешно добавлен: {result['filename']}")
            print(f"  Чанков: {result['chunks_count']}")
        else:
            print(f"✗ Ошибка: {result.get('message', 'Неизвестная ошибка')}")
            sys.exit(1)
    
    elif args.all:
        # Добавляем все документы
        directory = args.directory if args.directory else DOCUMENTS_DIR
        print(f"Добавление всех документов из: {directory}")
        result = rag.add_all_documents(directory)
        
        if result["success"]:
            print(f"✓ Добавлено чанков: {result['total_chunks']}")
        else:
            print(f"✗ Ошибка: {result.get('message', 'Неизвестная ошибка')}")
            sys.exit(1)
    
    else:
        parser.print_help()
        sys.exit(1)
    
    # Выводим информацию о системе
    print("\nИнформация о системе:")
    info = rag.get_info()
    for key, value in info.items():
        print(f"  {key}: {value}")


if __name__ == "__main__":
    main()

