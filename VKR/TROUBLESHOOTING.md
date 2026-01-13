# Устранение проблем: приложение не отвечает на запросы

## Диагностика

### Проверка 1: Qwen API запущен?
```bash
curl http://localhost:8001/health
```
Должен вернуть: `{"status":"ok","model_loaded":true}`

### Проверка 2: Приложение запущено?
```bash
ps aux | grep vite | grep blondinkaizakon
```

### Проверка 3: Проверить логи браузера
Откройте DevTools (F12) → Console и посмотрите ошибки

### Проверка 4: Проверить Network
Откройте DevTools (F12) → Network → отправить запрос → найти запрос к `/generate` → проверить статус и ошибки

## Возможные проблемы

### 1. CORS ошибка
**Симптом:** В консоли ошибка "CORS policy" или "blocked by CORS"
**Решение:** Проверить, что CORS настроен в Qwen API (уже настроен)

### 2. API недоступен
**Симптом:** Ошибка "Failed to fetch" или "NetworkError"
**Решение:**
```bash
cd /root/qwen-model
source venv/bin/activate
python -m uvicorn api.main:app --host 0.0.0.0 --port 8001
```

### 3. Таймаут
**Симптом:** Ошибка "AbortError" или долгое ожидание (90 секунд)
**Решение:** Это нормально для CPU модели. Генерация занимает 15-30 секунд.

### 4. Неправильный URL
**Симптом:** Ошибка подключения
**Решение:** Проверить, что API доступен по тому же хосту, что и приложение

## Тестирование

### Тест API напрямую:
```bash
curl -X POST http://localhost:8001/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Тест", "max_new_tokens": 50}'
```

### Тест из браузера:
Откройте консоль (F12) и выполните:
```javascript
fetch('http://localhost:8001/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

Если ошибка - значит проблема с доступом к API из браузера.

