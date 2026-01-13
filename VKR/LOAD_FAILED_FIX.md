# Исправление ошибки "Load failed" при обращении к LLMost API

## Проблема

Ошибка `TypeError: Load failed` возникает в браузере при попытке выполнить fetch запрос к LLMost API.

## Причины ошибки "Load failed"

1. **CORS (Cross-Origin Resource Sharing)**
   - Браузер блокирует запросы к другому домену
   - LLMost API должен поддерживать CORS, но может быть проблема с настройками

2. **Блокировка расширениями браузера**
   - AdBlock, Privacy Badger, uBlock Origin и другие
   - Могут блокировать запросы к внешним API

3. **Проблемы с сетью**
   - Нестабильное интернет-соединение
   - Прокси или файрвол блокируют запросы

4. **Временная недоступность API**
   - Сервер LLMost может быть временно недоступен

## Что было исправлено

1. **Улучшена обработка ошибки в `qwenService.ts`:**
   - Добавлена специальная обработка для `TypeError: Load failed`
   - Более детальное логирование ошибок
   - Информативные сообщения для пользователя

2. **Улучшены сообщения об ошибках в `App.tsx`:**
   - Более подробные инструкции по решению проблемы
   - Указание на возможные причины

## Решения

### 1. Проверка CORS

Откройте консоль браузера (F12) и проверьте:
- Есть ли ошибка "CORS policy" или "blocked by CORS"
- Если есть - это проблема на стороне LLMost API

**Временное решение:** Используйте прокси через Vite или настройте CORS на стороне сервера.

### 2. Отключение расширений браузера

1. Откройте браузер в режиме инкогнито (расширения обычно отключены)
2. Или временно отключите расширения:
   - Chrome: `chrome://extensions/`
   - Firefox: `about:addons`
   - Safari: Настройки → Расширения

### 3. Проверка сети

Выполните в консоли браузера (F12):
```javascript
// Проверка доступности API
fetch('https://llmost.ru/api/v1/models', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer llmost_KxTBngg_6TEGpMmC4XXrHXLaAHVuwnyU0TjNG7Gsp7wJS5eiaL9q2hDET0pmMrWm'
  }
})
.then(r => r.json())
.then(data => console.log('✅ API доступен:', data))
.catch(err => console.error('❌ Ошибка:', err));
```

### 4. Использование прокси через Vite

Можно настроить прокси в `vite.config.ts` для обхода CORS:

```typescript
proxy: {
  '/api/llmost': {
    target: 'https://llmost.ru/api/v1',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/llmost/, ''),
  }
}
```

Затем изменить URL в `qwenService.ts` на `/api/llmost`.

### 5. Проверка через curl

Проверьте доступность API с сервера:
```bash
curl -H "Authorization: Bearer llmost_KxTBngg_6TEGpMmC4XXrHXLaAHVuwnyU0TjNG7Gsp7wJS5eiaL9q2hDET0pmMrWm" \
     https://llmost.ru/api/v1/models
```

Если curl работает, а браузер нет - проблема в CORS или расширениях браузера.

## Диагностика

1. **Откройте консоль браузера (F12)**
2. **Перейдите на вкладку Network**
3. **Попробуйте выполнить анализ текста**
4. **Найдите запрос к `llmost.ru`**
5. **Проверьте:**
   - Статус ответа
   - Заголовки запроса/ответа
   - Ошибки в консоли

## Альтернативные решения

Если проблема сохраняется:

1. **Использовать локальный API** (Qwen на порту 8001)
2. **Настроить прокси-сервер** для обхода CORS
3. **Обратиться в поддержку LLMost** для проверки CORS настроек

## Контакты

- LLMost API: https://llmost.ru
- Документация: см. README.md

