#!/usr/bin/env python3
"""
Скрипт для автоматического отслеживания новых файлов и добавления их в RAG систему
Использует watchdog для мониторинга изменений в папке documents
"""
import sys
import time
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import logging

# Добавляем родительскую директорию в путь
sys.path.append(str(Path(__file__).parent.parent))

from rag_system import RAGSystem
from config import DOCUMENTS_DIR

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/root/LegalFlow/logs/watch_files.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class DocumentHandler(FileSystemEventHandler):
    """Обработчик событий файловой системы для автоматического добавления файлов"""
    
    def __init__(self, rag_system):
        super().__init__()
        self.rag = rag_system
        self.processed_files = set()
        self.debounce_seconds = 5  # Задержка перед обработкой (секунды)
        self.pending_files = {}  # Словарь: файл -> время последнего изменения
        
    def on_created(self, event):
        """Вызывается при создании нового файла"""
        if not event.is_directory:
            self._schedule_processing(event.src_path)
    
    def on_modified(self, event):
        """Вызывается при изменении файла"""
        if not event.is_directory:
            self._schedule_processing(event.src_path)
    
    def _schedule_processing(self, file_path):
        """Планирует обработку файла с задержкой (debounce)"""
        file_path = Path(file_path)
        
        # Проверяем расширение
        supported_extensions = {".pdf", ".txt", ".docx", ".csv", ".md", ".markdown"}
        if file_path.suffix.lower() not in supported_extensions:
            return
        
        # Проверяем, что файл в папке documents
        try:
            file_path.relative_to(DOCUMENTS_DIR)
        except ValueError:
            return
        
        self.pending_files[str(file_path)] = time.time()
        logger.info(f"Запланирована обработка файла: {file_path.name}")
    
    def process_pending_files(self):
        """Обрабатывает файлы, которые были изменены более debounce_seconds назад"""
        current_time = time.time()
        files_to_process = []
        files_to_check = []
        
        # Собираем файлы, готовые к обработке
        for file_path, mod_time in list(self.pending_files.items()):
            if current_time - mod_time >= self.debounce_seconds:
                file_path_obj = Path(file_path)
                if file_path_obj.exists():
                    # Проверяем, что файл не изменился за последние 2 секунды (стабилен)
                    try:
                        file_mtime = file_path_obj.stat().st_mtime
                        time_since_last_mod = current_time - file_mtime
                        if time_since_last_mod >= 2.0:  # Файл не изменялся последние 2 секунды
                            if str(file_path_obj) not in self.processed_files:
                                files_to_check.append((file_path, file_mtime))
                        else:
                            # Файл еще изменяется, обновляем время последнего изменения
                            self.pending_files[file_path] = file_mtime
                    except (OSError, FileNotFoundError):
                        # Файл удален или недоступен
                        if file_path in self.pending_files:
                            del self.pending_files[file_path]
                else:
                    # Файл не существует, удаляем из ожидающих
                    if file_path in self.pending_files:
                        del self.pending_files[file_path]
        
        # Обрабатываем только файлы, которые были стабильны
        for file_path, check_time in files_to_check:
            # Дополнительная проверка: файл все еще не изменяется
            file_path_obj = Path(file_path)
            try:
                if file_path_obj.exists():
                    current_mtime = file_path_obj.stat().st_mtime
                    if abs(current_mtime - check_time) < 0.1:  # Файл не изменился с момента проверки
                        files_to_process.append(file_path)
                        if file_path in self.pending_files:
                            del self.pending_files[file_path]
            except (OSError, FileNotFoundError):
                continue
        
        # Обрабатываем файлы
        for file_path in files_to_process:
            self._process_file(file_path)
    
    def _process_file(self, file_path):
        """Обрабатывает один файл"""
        file_path = Path(file_path)
        
        try:
            logger.info(f"Обработка файла: {file_path}")
            result = self.rag.add_document(str(file_path))
            
            if result["success"]:
                self.processed_files.add(str(file_path))
                logger.info(
                    f"✓ Файл успешно добавлен: {result.get('filename')} "
                    f"({result.get('chunks_count', 0)} чанков)"
                )
            else:
                logger.error(f"✗ Ошибка при добавлении {file_path.name}: {result.get('message')}")
        
        except Exception as e:
            logger.error(f"✗ Исключение при обработке {file_path}: {e}")


def main():
    """Основная функция"""
    logger.info("Запуск автоматического мониторинга файлов...")
    
    # Создаем папку для логов
    logs_dir = Path(__file__).parent.parent / "logs"
    logs_dir.mkdir(exist_ok=True)
    
    # Инициализируем RAG систему
    try:
        rag = RAGSystem()
        logger.info("RAG система инициализирована")
    except Exception as e:
        logger.error(f"Ошибка при инициализации RAG системы: {e}")
        sys.exit(1)
    
    # Создаем обработчик событий
    event_handler = DocumentHandler(rag)
    
    # Создаем наблюдатель
    observer = Observer()
    observer.schedule(event_handler, str(DOCUMENTS_DIR), recursive=True)
    observer.start()
    
    logger.info(f"Мониторинг запущен для папки: {DOCUMENTS_DIR}")
    logger.info("Ожидание новых файлов...")
    
    try:
        while True:
            time.sleep(1)
            event_handler.process_pending_files()
    except KeyboardInterrupt:
        logger.info("Остановка мониторинга...")
        observer.stop()
    
    observer.join()
    logger.info("Мониторинг остановлен")


if __name__ == "__main__":
    main()

