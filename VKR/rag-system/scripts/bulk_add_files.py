#!/usr/bin/env python3
"""
Скрипт для массового добавления файлов в RAG систему
Поддерживает загрузку файлов из локальной директории или копирование в documents/
"""
import sys
import os
import shutil
from pathlib import Path

# Добавляем родительскую директорию в путь
sys.path.append(str(Path(__file__).parent.parent))

from rag_system import RAGSystem
from config import DOCUMENTS_DIR
import argparse


def copy_file_to_documents(source_path, target_dir):
    """Копирует файл в целевую директорию, сохраняя структуру"""
    source = Path(source_path)
    if not source.exists():
        print(f"✗ Файл не найден: {source_path}")
        return None
    
    # Определяем целевую директорию на основе исходного пути
    if "tax_law" in str(source):
        target_dir = DOCUMENTS_DIR / "tax_law"
    elif "corp_law" in str(source):
        target_dir = DOCUMENTS_DIR / "corp_law"
    elif "infobez" in str(source):
        target_dir = DOCUMENTS_DIR / "infobez"
    elif "contract_law" in str(source):
        target_dir = DOCUMENTS_DIR / "contract_law"
    elif "work_law" in str(source):
        target_dir = DOCUMENTS_DIR / "work_law"
    elif "base_law" in str(source):
        target_dir = DOCUMENTS_DIR / "base_law"
    else:
        target_dir = DOCUMENTS_DIR
    
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = target_dir / source.name
    
    try:
        shutil.copy2(source, target_path)
        print(f"✓ Скопирован: {source.name} -> {target_path}")
        return str(target_path)
    except Exception as e:
        print(f"✗ Ошибка при копировании {source.name}: {e}")
        return None


def main():
    parser = argparse.ArgumentParser(description="Массовое добавление файлов в RAG систему")
    parser.add_argument(
        "--files",
        nargs="+",
        help="Список путей к файлам для добавления"
    )
    parser.add_argument(
        "--file-list",
        type=str,
        help="Путь к файлу со списком путей (по одному на строку)"
    )
    parser.add_argument(
        "--directory",
        type=str,
        help="Директория с файлами для добавления (рекурсивно)"
    )
    
    args = parser.parse_args()
    
    print("Инициализация RAG системы...")
    rag = RAGSystem()
    
    files_to_add = []
    
    # Собираем список файлов
    if args.files:
        files_to_add = args.files
    elif args.file_list:
        with open(args.file_list, 'r', encoding='utf-8') as f:
            files_to_add = [line.strip() for line in f if line.strip()]
    elif args.directory:
        directory = Path(args.directory)
        if not directory.exists():
            print(f"✗ Директория не найдена: {directory}")
            sys.exit(1)
        
        # Находим все поддерживаемые файлы
        supported_extensions = {".pdf", ".txt", ".docx", ".csv", ".md", ".markdown"}
        for ext in supported_extensions:
            files_to_add.extend(directory.rglob(f"*{ext}"))
        files_to_add = [str(f) for f in files_to_add]
    else:
        parser.print_help()
        sys.exit(1)
    
    if not files_to_add:
        print("✗ Не найдено файлов для добавления")
        sys.exit(1)
    
    print(f"\nНайдено файлов: {len(files_to_add)}")
    print("Начинаю добавление...\n")
    
    success_count = 0
    error_count = 0
    
    for file_path in files_to_add:
        try:
            # Копируем файл в documents если он не там
            if not str(file_path).startswith(str(DOCUMENTS_DIR)):
                copied_path = copy_file_to_documents(file_path, DOCUMENTS_DIR)
                if copied_path:
                    file_path = copied_path
                else:
                    error_count += 1
                    continue
            
            # Добавляем в RAG систему
            result = rag.add_document(file_path)
            
            if result["success"]:
                success_count += 1
                print(f"✓ Добавлен в RAG: {result.get('filename', Path(file_path).name)} ({result.get('chunks_count', 0)} чанков)")
            else:
                error_count += 1
                print(f"✗ Ошибка: {result.get('message', 'Неизвестная ошибка')}")
        
        except Exception as e:
            error_count += 1
            print(f"✗ Ошибка при обработке {file_path}: {e}")
    
    print(f"\n{'='*60}")
    print(f"Итого: успешно добавлено {success_count}, ошибок {error_count}")
    
    # Выводим информацию о системе
    print("\nИнформация о системе:")
    info = rag.get_info()
    for key, value in info.items():
        print(f"  {key}: {value}")


if __name__ == "__main__":
    main()

