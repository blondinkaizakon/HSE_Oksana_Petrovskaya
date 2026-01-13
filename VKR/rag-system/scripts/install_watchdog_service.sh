#!/bin/bash
# Установка systemd service для watchdog

echo "=== Установка Watchdog Service ==="

# Проверяем, что venv существует
if [ ! -d "/root/LegalFlow/venv" ]; then
    echo "✗ Виртуальное окружение не найдено!"
    echo "Создайте его: cd /root/LegalFlow && python3 -m venv venv"
    exit 1
fi

# Создаем service файл
cat > /etc/systemd/system/rag-watchdog.service << 'EOF'
[Unit]
Description=RAG System File Watcher - Автоматическая обработка новых файлов
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/LegalFlow
Environment="PATH=/usr/bin:/usr/local/bin:/root/LegalFlow/venv/bin"
ExecStart=/root/LegalFlow/venv/bin/python /root/LegalFlow/scripts/watch_files.py
Restart=always
RestartSec=10
StandardOutput=append:/root/LegalFlow/logs/watchdog.log
StandardError=append:/root/LegalFlow/logs/watchdog_error.log

[Install]
WantedBy=multi-user.target
EOF

# Перезагружаем systemd
systemctl daemon-reload

echo "✓ Service создан: /etc/systemd/system/rag-watchdog.service"
echo ""
echo "Команды управления:"
echo "  Запустить:     systemctl start rag-watchdog"
echo "  Остановить:    systemctl stop rag-watchdog"
echo "  Статус:        systemctl status rag-watchdog"
echo "  Автозапуск:    systemctl enable rag-watchdog"
echo "  Отключить:     systemctl disable rag-watchdog"
echo "  Логи:          journalctl -u rag-watchdog -f"
echo ""

