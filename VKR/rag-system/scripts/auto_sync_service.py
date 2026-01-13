#!/usr/bin/env python3
"""
Сервис для автоматической синхронизации и обработки файлов
Можно запускать как systemd service или через cron
"""
import sys
import os
import subprocess
import time
from pathlib import Path
from datetime import datetime
import logging

# Добавляем родительскую директорию в путь
sys.path.append(str(Path(__file__).parent.parent))

from rag_system import RAGSystem
from config import DOCUMENTS_DIR

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/root/LegalFlow/logs/auto_sync.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class AutoSyncService:
    """Сервис автоматической синхронизации"""
    
    def __init__(self):
        self.rag = None
        self.last_sync_time = {}
        
    def initialize_rag(self):
        """Инициализация RAG системы"""
        try:
            self.rag = RAGSystem()
            logger.info("RAG система инициализирована")
            return True
        except Exception as e:
            logger.error(f"Ошибка при инициализации RAG системы: {e}")
            return False
    
    def find_new_files(self, category_dir=None, minutes=5):
        """Находит новые файлы за последние N минут"""
        search_dir = Path(category_dir) if category_dir else DOCUMENTS_DIR
        new_files = []
        
        # Находим файлы, измененные за последние N минут
        cutoff_time = time.time() - (minutes * 60)
        
        for ext in [".md", ".txt", ".pdf", ".docx", ".csv"]:
            for file_path in search_dir.rglob(f"*{ext}"):
                if file_path.is_file():
                    try:
                        mtime = file_path.stat().st_mtime
                        file_key = str(file_path)
                        
                        # Проверяем, был ли файл уже обработан
                        if mtime > cutoff_time and file_key not in self.last_sync_time:
                            new_files.append(file_path)
                    except Exception as e:
                        logger.warning(f"Ошибка при проверке {file_path}: {e}")
        
        return new_files
    
    def process_new_files(self, files):
        """Обрабатывает список новых файлов"""
        if not files:
            logger.info("Новых файлов для обработки не найдено")
            return
        
        logger.info(f"Найдено новых файлов: {len(files)}")
        success_count = 0
        error_count = 0
        
        for file_path in files:
            try:
                logger.info(f"Обработка: {file_path}")
                result = self.rag.add_document(str(file_path))
                
                if result["success"]:
                    self.last_sync_time[str(file_path)] = time.time()
                    success_count += 1
                    logger.info(
                        f"✓ Добавлен: {result.get('filename')} "
                        f"({result.get('chunks_count', 0)} чанков)"
                    )
                else:
                    error_count += 1
                    logger.error(f"✗ Ошибка: {result.get('message')}")
            
            except Exception as e:
                error_count += 1
                logger.error(f"✗ Исключение при обработке {file_path}: {e}")
        
        logger.info(f"Обработка завершена: успешно {success_count}, ошибок {error_count}")
    
    def sync_once(self, category=None):
        """Однократная синхронизация и обработка"""
        logger.info(f"Начало синхронизации (категория: {category or 'все'})")
        
        if not self.rag:
            if not self.initialize_rag():
                return False
        
        # Находим новые файлы
        category_dir = DOCUMENTS_DIR / category if category else None
        new_files = self.find_new_files(category_dir)
        
        # Обрабатываем их
        if new_files:
            self.process_new_files(new_files)
        else:
            logger.info("Новых файлов не найдено")
        
        return True
    
    def run_continuous(self, interval_minutes=30):
        """Запускает непрерывную синхронизацию"""
        logger.info(f"Запуск непрерывной синхронизации (интервал: {interval_minutes} мин)")
        
        if not self.initialize_rag():
            return
        
        while True:
            try:
                self.sync_once()
                logger.info(f"Ожидание {interval_minutes} минут до следующей синхронизации...")
                time.sleep(interval_minutes * 60)
            except KeyboardInterrupt:
                logger.info("Остановка сервиса...")
                break
            except Exception as e:
                logger.error(f"Ошибка в цикле синхронизации: {e}")
                time.sleep(60)  # Короткая пауза при ошибке


def main():
    """Основная функция"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Сервис автоматической синхронизации RAG системы")
    parser.add_argument(
        "--once",
        action="store_true",
        help="Выполнить однократную синхронизацию"
    )
    parser.add_argument(
        "--continuous",
        action="store_true",
        help="Запустить непрерывную синхронизацию"
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=30,
        help="Интервал синхронизации в минутах (по умолчанию: 30)"
    )
    parser.add_argument(
        "--category",
        type=str,
        help="Обработать только указанную категорию (tax_law, corp_law и т.д.)"
    )
    
    args = parser.parse_args()
    
    # Создаем папку для логов
    logs_dir = Path(__file__).parent.parent / "logs"
    logs_dir.mkdir(exist_ok=True)
    
    service = AutoSyncService()
    
    if args.once:
        service.sync_once(args.category)
    elif args.continuous:
        service.run_continuous(args.interval)
    else:
        # По умолчанию - однократная синхронизация
        service.sync_once(args.category)


if __name__ == "__main__":
    main()

