#!/bin/bash
# Скрипт для настройки автоматической синхронизации

echo "=== Настройка автоматической синхронизации ==="
echo ""

# Создаем папки
mkdir -p /root/LegalFlow/logs
chmod +x /root/LegalFlow/scripts/*.py
chmod +x /root/LegalFlow/scripts/*.sh

echo "1. Создание systemd service для автоматической синхронизации..."

cat > /etc/systemd/system/rag-auto-sync.service << 'EOF'
[Unit]
Description=RAG System Auto Sync Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/LegalFlow
Environment="PATH=/usr/bin:/usr/local/bin:/root/LegalFlow/venv/bin"
ExecStart=/root/LegalFlow/venv/bin/python /root/LegalFlow/scripts/auto_sync_service.py --continuous --interval 30
Restart=always
RestartSec=60
StandardOutput=append:/root/LegalFlow/logs/auto_sync_service.log
StandardError=append:/root/LegalFlow/logs/auto_sync_service_error.log

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload

echo "✓ Service создан"
echo ""
echo "2. Настройка cron для периодической синхронизации..."

# Добавляем задание в crontab (каждые 30 минут)
(crontab -l 2>/dev/null | grep -v "rag-auto-sync"; echo "*/30 * * * * cd /root/LegalFlow && source venv/bin/activate && python scripts/auto_sync_service.py --once >> logs/cron_sync.log 2>&1") | crontab -

echo "✓ Cron job настроен (каждые 30 минут)"
echo ""
echo "=== Доступные команды ==="
echo ""
echo "Запустить service вручную:"
echo "  systemctl start rag-auto-sync"
echo ""
echo "Включить автозапуск service:"
echo "  systemctl enable rag-auto-sync"
echo ""
echo "Посмотреть статус:"
echo "  systemctl status rag-auto-sync"
echo ""
echo "Посмотреть логи:"
echo "  tail -f /root/LegalFlow/logs/auto_sync.log"
echo ""
echo "Однократная синхронизация:"
echo "  cd /root/LegalFlow && source venv/bin/activate && python scripts/auto_sync_service.py --once"
echo ""
echo "Запустить watchdog (мониторинг в реальном времени):"
echo "  cd /root/LegalFlow && source venv/bin/activate && python scripts/watch_files.py"

