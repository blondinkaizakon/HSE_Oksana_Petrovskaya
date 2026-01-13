#!/bin/bash

# Скрипт для запуска RAG API

cd /root/LegalFlow

# Активируем виртуальное окружение
source venv/bin/activate

# Проверяем, запущен ли процесс
PID=$(pgrep -f "uvicorn.*api.main.*8002")

if [ -n "$PID" ]; then
    echo "RAG API уже запущен (PID: $PID). Останавливаю..."
    kill $PID
    sleep 2
    echo "Процесс остановлен."
fi

echo "Запускаю RAG API на порту 8002..."
# Запускаем Uvicorn в фоновом режиме
cd /root/LegalFlow
nohup python -m uvicorn api.main:app --host 0.0.0.0 --port 8002 > /root/LegalFlow/rag_api.log 2>&1 &

# Сохраняем PID
echo $! > /root/LegalFlow/rag_api.pid

sleep 3
echo "RAG API запущен, PID: $(cat /root/LegalFlow/rag_api.pid)"
echo "Логи доступны в /root/LegalFlow/rag_api.log"
echo "API доступен на: http://localhost:8002"
echo "Документация: http://localhost:8002/docs"

