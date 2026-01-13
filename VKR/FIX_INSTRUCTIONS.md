# Исправление проблемы: Бот не отвечает

## Проблема
Приложение загружается, но бот не реагирует на вопросы и не анализирует файлы.

## Причина
Не настроен API ключ Gemini или он указан как заглушка `your_api_key_here`.

## Решение (ШАГ ЗА ШАГОМ)

### Шаг 1: Получите API ключ Gemini

1. Перейдите на https://aistudio.google.com/apikey
2. Войдите в аккаунт Google
3. Нажмите "Create API Key" (Создать API ключ)
4. Скопируйте созданный ключ

### Шаг 2: Добавьте API ключ на сервер

**Вариант A: Через SSH и редактор**

```bash
ssh root@92.53.104.183
cd /root/blondinkaizakon
nano .env.local
```

Замените содержимое на (вставьте ВАШ реальный ключ):
```
VITE_GEMINI_API_KEY=ваш_реальный_api_ключ_здесь
GEMINI_API_KEY=ваш_реальный_api_ключ_здесь
```

Сохраните: `Ctrl+X`, затем `Y`, затем `Enter`

**Вариант B: Через одну команду**

```bash
ssh root@92.53.104.183 "cd /root/blondinkaizakon && echo 'VITE_GEMINI_API_KEY=ваш_реальный_api_ключ_здесь' > .env.local && echo 'GEMINI_API_KEY=ваш_реальный_api_ключ_здесь' >> .env.local"
```

**ВАЖНО:** Замените `ваш_реальный_api_ключ_здесь` на ваш настоящий ключ!

### Шаг 3: Перезапустите приложение

```bash
ssh root@92.53.104.183
cd /root/blondinkaizakon

# Остановить старое приложение
pkill -f "blondinkaizakon.*vite"

# Запустить заново
npm run dev > dev.log 2>&1 &
```

Или в одну команду:
```bash
ssh root@92.53.104.183 "cd /root/blondinkaizakon && pkill -f 'blondinkaizakon.*vite' && sleep 2 && npm run dev > dev.log 2>&1 &"
```

### Шаг 4: Проверьте работу

1. Откройте в браузере: http://92.53.104.183:3000
2. Откройте консоль разработчика (F12 -> Console)
3. Попробуйте отправить сообщение или загрузить файл

**Что должно произойти:**
- В консоли НЕ должно быть ошибок "API key not found"
- Бот должен начать отвечать
- При загрузке файла должен начаться анализ

**Если всё ещё не работает:**

Проверьте логи на сервере:
```bash
ssh root@92.53.104.183
tail -50 /root/blondinkaizakon/dev.log
```

Проверьте консоль браузера (F12) на наличие ошибок.

## Быстрая проверка API ключа

На сервере выполните:
```bash
cd /root/blondinkaizakon
cat .env.local | grep -v "your_api_key_here" | grep "VITE_GEMINI_API_KEY"
```

Если выводится пустая строка или `your_api_key_here` - ключ не настроен правильно.

## Дополнительная информация

- Файл с инструкциями: `/root/blondinkaizakon/SETUP_API_KEY.md`
- Логи приложения: `/root/blondinkaizakon/dev.log`
- Конфигурация: `/root/blondinkaizakon/vite.config.ts`

