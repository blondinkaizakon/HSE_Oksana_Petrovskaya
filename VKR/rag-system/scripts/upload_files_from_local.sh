#!/bin/bash
# Скрипт для загрузки файлов с локальной машины на сервер
# Использование: ./upload_files_from_local.sh <локальный_путь> <категория>

LOCAL_PATH="$1"
CATEGORY="$2"
SERVER="root@92.53.104.183"
REMOTE_DIR="/root/LegalFlow/documents"

if [ -z "$LOCAL_PATH" ]; then
    echo "Использование: $0 <локальный_путь_к_файлам> [категория]"
    echo "Категории: tax_law, corp_law, infobez, contract_law, work_law, base_law"
    exit 1
fi

if [ -z "$CATEGORY" ]; then
    CATEGORY=""
fi

echo "Загрузка файлов из: $LOCAL_PATH"
echo "Категория: ${CATEGORY:-'корневая папка documents'}"

if [ -n "$CATEGORY" ]; then
    REMOTE_PATH="$REMOTE_DIR/$CATEGORY"
else
    REMOTE_PATH="$REMOTE_DIR"
fi

# Создаем директорию на сервере если не существует
ssh $SERVER "mkdir -p $REMOTE_PATH"

# Копируем файлы
if [ -d "$LOCAL_PATH" ]; then
    echo "Копирование директории..."
    scp -r "$LOCAL_PATH"/* "$SERVER:$REMOTE_PATH/"
else
    echo "Копирование файла..."
    scp "$LOCAL_PATH" "$SERVER:$REMOTE_PATH/"
fi

echo "✓ Файлы загружены!"
echo ""
echo "Теперь добавьте их в RAG систему:"
echo "  ssh $SERVER"
echo "  cd /root/LegalFlow"
echo "  source venv/bin/activate"
echo "  python scripts/add_documents.py --all"

