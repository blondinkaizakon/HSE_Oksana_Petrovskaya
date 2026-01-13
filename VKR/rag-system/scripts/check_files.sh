#!/bin/bash
# Скрипт для проверки скопированных файлов

echo "=== Проверка файлов в RAG системе ==="
echo ""

DOCUMENTS_DIR="/root/LegalFlow/documents"

if [ ! -d "$DOCUMENTS_DIR" ]; then
    echo "✗ Папка documents не найдена!"
    exit 1
fi

echo "Структура папок:"
echo "--------------"
find "$DOCUMENTS_DIR" -type d -not -path "*/\.*" | sort | sed 's|'$DOCUMENTS_DIR'||' | sed 's|^/||' | sed 's|^|  |'
echo ""

echo "Количество файлов по категориям:"
echo "--------------"
for dir in "$DOCUMENTS_DIR"/*/; do
    if [ -d "$dir" ]; then
        count=$(find "$dir" -type f \( -name "*.md" -o -name "*.txt" -o -name "*.pdf" -o -name "*.docx" \) | wc -l)
        dirname=$(basename "$dir")
        echo "  $dirname: $count файлов"
    fi
done

echo ""
echo "Общее количество файлов:"
total=$(find "$DOCUMENTS_DIR" -type f \( -name "*.md" -o -name "*.txt" -o -name "*.pdf" -o -name "*.docx" \) | wc -l)
echo "  Всего: $total файлов"

echo ""
echo "Размер файлов:"
du -sh "$DOCUMENTS_DIR"/*/ 2>/dev/null | sort -hr

