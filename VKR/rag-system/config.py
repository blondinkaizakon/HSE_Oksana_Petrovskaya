"""
Конфигурация RAG системы
"""
import os
from pathlib import Path

# Пути
BASE_DIR = Path(__file__).parent
DOCUMENTS_DIR = BASE_DIR / "documents"
VECTORSTORE_DIR = BASE_DIR / "vectorstore"

# Модель для embeddings (легковесная)
EMBEDDINGS_MODEL = "intfloat/multilingual-e5-small"  # Поддерживает русский и английский
# Альтернативы:
# "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2" - еще меньше
# "cointegrated/rubert-tiny2" - для русского языка

# Настройки чанкинга
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200

# Настройки поиска
TOP_K_RESULTS = 5

# Создать директории если не существуют
DOCUMENTS_DIR.mkdir(exist_ok=True)
VECTORSTORE_DIR.mkdir(exist_ok=True)

