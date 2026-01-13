# RAG System (Retrieval-Augmented Generation)

RAG система для поиска и работы с документами на основе векторного поиска.

## Структура проекта

```
LegalFlow/
├── documents/          # Папка для документов
├── vectorstore/        # Векторное хранилище (ChromaDB)
├── api/               # FastAPI приложение
│   └── main.py        # API сервер
├── scripts/           # Скрипты для работы с системой
│   ├── add_documents.py
│   └── search.py
├── config.py          # Конфигурация
├── document_loader.py # Загрузка и обработка документов
├── vectorstore_manager.py # Управление векторным хранилищем
├── rag_system.py      # Основной модуль RAG системы
└── requirements.txt   # Зависимости
```

## Установка

1. Создайте виртуальное окружение:
```bash
cd /root/LegalFlow
python3 -m venv venv
source venv/bin/activate
```

2. Установите зависимости:
```bash
pip install -r requirements.txt
```

3. Первая установка может занять время, так как будет загружена модель для embeddings.

## Использование

### Добавление документов

**Способ 1: Через SCP (с локальной машины)**

```bash
# Копирование всей директории knowledge_base
scp -r "/Users/oksanapetrovskaa/Documents/ДЗ/файлы для вкр 21.22.37/knowledge_base" root@92.53.104.183:/root/LegalFlow/documents/

# Затем на сервере добавьте в RAG:
cd /root/LegalFlow
source venv/bin/activate
python scripts/add_documents.py --all
```

**Способ 2: Добавить один файл**
```bash
python scripts/add_documents.py --file путь/к/файлу.pdf
```

**Способ 3: Добавить все документы из папки**
```bash
python scripts/add_documents.py --all
```

**Способ 4: Массовое добавление из списка файлов**
```bash
python scripts/bulk_add_files.py --file-list /path/to/file_list.txt
```

**Структура папок:**
- `documents/tax_law/` - Налоговое право
- `documents/corp_law/` - Корпоративное право
- `documents/infobez/` - Информационная безопасность
- `documents/contract_law/` - Договорное право
- `documents/work_law/` - Трудовое право
- `documents/base_law/` - Базовое законодательство

Подробнее см. `ADD_FILES_GUIDE.md`

### Поиск

Простой поиск:
```bash
python scripts/search.py "ваш запрос"
```

Поиск с оценками релевантности:
```bash
python scripts/search.py "ваш запрос" --with-scores
```

Получить контекст:
```bash
python scripts/search.py "ваш запрос" --context
```

### API сервер

Запуск API сервера:
```bash
cd /root/LegalFlow
source venv/bin/activate
python api/main.py
```

Или через uvicorn:
```bash
uvicorn api.main:app --host 0.0.0.0 --port 8000
```

API будет доступен по адресу: `http://localhost:8000`

Документация API: `http://localhost:8000/docs`

### API Endpoints

- `GET /` - Информация об API
- `GET /info` - Информация о системе
- `POST /search` - Поиск документов
- `POST /search/with-scores` - Поиск с оценками
- `POST /context` - Получить контекст для запроса
- `POST /documents/upload` - Загрузить документ
- `POST /documents/add-all` - Добавить все документы из папки

## Поддерживаемые форматы

- PDF (.pdf)
- Текстовые файлы (.txt)
- Word документы (.docx)
- CSV файлы (.csv)
- Markdown (.md, .markdown)

## Конфигурация

Настройки находятся в `config.py`:

- `EMBEDDINGS_MODEL` - модель для embeddings (по умолчанию: multilingual-e5-small)
- `CHUNK_SIZE` - размер чанков (1000 символов)
- `CHUNK_OVERLAP` - перекрытие чанков (200 символов)
- `TOP_K_RESULTS` - количество результатов по умолчанию (5)

## Пример использования в Python

```python
from rag_system import RAGSystem

# Инициализация
rag = RAGSystem()

# Добавление документа
rag.add_document("path/to/document.pdf")

# Поиск
results = rag.search("ваш запрос", k=5)

# Получение контекста
context = rag.get_context_for_query("ваш запрос", k=5)
```

## Примечания

- Первая загрузка модели embeddings может занять время (~500MB)
- Векторное хранилище автоматически сохраняется на диск
- Документы разбиваются на чанки для эффективного поиска

