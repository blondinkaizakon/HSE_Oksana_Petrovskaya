# Документы для RAG системы

Поместите сюда документы, которые вы хотите добавить в RAG систему.

## Поддерживаемые форматы:

- PDF (.pdf)
- Текстовые файлы (.txt)
- Word документы (.docx)
- CSV файлы (.csv)
- Markdown (.md, .markdown)

## Как добавить документы:

1. Скопируйте файлы в эту папку
2. Запустите: `python scripts/add_documents.py --all`

Или используйте API:
```bash
curl -X POST "http://localhost:8000/documents/upload" \
  -F "file=@ваш_файл.pdf"
```

