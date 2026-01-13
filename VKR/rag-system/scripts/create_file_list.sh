#!/bin/bash
# Скрипт для создания списка файлов из локальной директории
# Использование: ./create_file_list.sh /path/to/knowledge_base > file_list.txt

if [ -z "$1" ]; then
    echo "Использование: $0 <путь_к_директории>"
    exit 1
fi

DIR="$1"

find "$DIR" -type f \( -name "*.md" -o -name "*.txt" -o -name "*.pdf" -o -name "*.docx" \) | while read file; do
    echo "$file"
done

