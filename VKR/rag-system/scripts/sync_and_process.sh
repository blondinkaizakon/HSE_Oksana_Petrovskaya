#!/bin/bash
# Скрипт для синхронизации файлов с локального компьютера и автоматической обработки
# Использование: ./sync_and_process.sh [локальный_путь] [категория]

LOCAL_PATH="${1:-/Users/oksanapetrovskaa/Documents/ДЗ/файлы для вкр 21.22.37/knowledge_base}"
CATEGORY="${2:-}"
SERVER="root@92.53.104.183"
REMOTE_DOCS_DIR="/root/LegalFlow/documents"
REMOTE_SCRIPT_DIR="/root/LegalFlow/scripts"
LOG_FILE="/root/LegalFlow/logs/sync.log"

# Создаем папку для логов на сервере
ssh $SERVER "mkdir -p /root/LegalFlow/logs"

echo "=== Синхронизация и обработка файлов ==="
echo "Локальный путь: $LOCAL_PATH"
echo "Сервер: $SERVER"
echo ""

# Синхронизация файлов
echo "1. Синхронизация файлов..."
if [ -z "$CATEGORY" ]; then
    # Синхронизация всей директории
    rsync -avz --progress --delete \
        "$LOCAL_PATH/" \
        "$SERVER:$REMOTE_DOCS_DIR/knowledge_base/" \
        2>&1 | tee -a sync_temp.log
else
    # Синхронизация конкретной категории
    rsync -avz --progress \
        "$LOCAL_PATH/$CATEGORY/" \
        "$SERVER:$REMOTE_DOCS_DIR/$CATEGORY/" \
        2>&1 | tee -a sync_temp.log
fi

SYNC_EXIT_CODE=$?

if [ $SYNC_EXIT_CODE -eq 0 ]; then
    echo "✓ Синхронизация завершена успешно"
else
    echo "✗ Ошибка при синхронизации (код: $SYNC_EXIT_CODE)"
    exit $SYNC_EXIT_CODE
fi

# Автоматическая обработка на сервере
echo ""
echo "2. Обработка новых файлов на сервере..."

ssh $SERVER << 'ENDSSH'
cd /root/LegalFlow
source venv/bin/activate

# Находим новые/измененные файлы (созданные за последние 5 минут)
NEW_FILES=$(find documents -type f \( -name "*.md" -o -name "*.txt" -o -name "*.pdf" -o -name "*.docx" \) -newermt "5 minutes ago" 2>/dev/null)

if [ -z "$NEW_FILES" ]; then
    echo "Новых файлов не найдено"
    exit 0
fi

echo "Найдено новых файлов для обработки:"
echo "$NEW_FILES" | while read file; do
    echo "  - $file"
done

# Обрабатываем файлы
echo ""
echo "Добавление файлов в RAG систему..."
python scripts/add_documents.py --all 2>&1 | tee -a logs/sync.log

echo "✓ Обработка завершена"
ENDSSH

echo ""
echo "=== Готово ==="

