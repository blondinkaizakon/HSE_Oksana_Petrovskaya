import { SYSTEM_INSTRUCTION } from "../constants";

interface AnalysisResult {
  commentary: string;
  state: string;
  healthImpact: number;
  risks: Array<{
    id: string;
    title: string;
    description: string;
    severity: string;
    matrixReference: string;
    suggestion: string;
  }>;
}

export class QwenService {
  private apiUrl: string;
  private apiKey: string;
  private modelId: string;
  private ragApiUrl: string;

  constructor() {
    // LLMost API (Google Gemini через LLMost)
    this.apiKey = 'llmost_KxTBngg_6TEGpMmC4XXrHXLaAHVuwnyU0TjNG7Gsp7wJS5eiaL9q2hDET0pmMrWm';
    
    // Используем прокси через Vite для обхода CORS
    // В браузере используем прокси, на сервере - прямой URL
    if (typeof window !== 'undefined') {
      // В браузере используем прокси через Vite
      this.apiUrl = '/api/llmost';
    } else {
      // На сервере используем прямой URL
      this.apiUrl = 'https://llmost.ru/api/v1';
    }
    
    this.modelId = 'google/gemini-2.5-flash';
    
    // RAG API остается локальным
    if (typeof window !== 'undefined') {
      this.ragApiUrl = '/api/rag';
    } else {
      this.ragApiUrl = 'http://localhost:8002';
    }
    
    console.log('🔧 Используется LLMost API:', this.apiUrl);
    console.log('🔧 Модель:', this.modelId);
    console.log('🔧 Используется RAG API на:', this.ragApiUrl);
  }

  /**
   * Получает контекст из RAG системы для запроса
   */
  private async getRAGContext(query: string, k: number = 3): Promise<{context: string, sources: Array<{id: number, filename: string, source: string}>}> {
    try {
      console.log('🔍 Поиск в RAG системе для запроса:', query.substring(0, 100));
      
      const response = await fetch(`${this.ragApiUrl}/context`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          k: k
        }),
      });

      if (!response.ok) {
        console.warn('⚠️ RAG API недоступен, продолжаем без контекста');
        return { context: '', sources: [] };
      }

      const data = await response.json();
      const context = data.context || '';
      const sources = data.sources || [];
      
      console.log(`✅ Получен контекст из RAG: ${context.length} символов, источников: ${sources.length}`);
      return { context, sources };
    } catch (error) {
      console.warn('⚠️ Ошибка при получении контекста из RAG, продолжаем без него:', error);
      return { context: '', sources: [] };
    }
  }

  async analyzeText(text: string, levelDescription: string): Promise<AnalysisResult & {ragSources?: Array<{id: number, filename: string, source: string}>}> {
    try {
      // Получаем контекст из RAG системы
      const searchQuery = `${levelDescription} ${text.substring(0, 200)}`;
      const { context: ragContext, sources: ragSources } = await this.getRAGContext(searchQuery, 3);
      
      // Формируем промпт с контекстом из RAG
      let prompt = `Ты — Аня, «Блондинка в законе» 👱‍♀️⚖️. Юридический ассистент с характером.

Уровень аудита: ${levelDescription}

Текст для анализа:
${text.substring(0, 2000)}

`;

      // Добавляем контекст из RAG только если он релевантен
      if (ragContext && ragContext.length > 0) {
        // Простая проверка релевантности по ключевым словам
        const textLower = text.toLowerCase();
        const contextLower = ragContext.toLowerCase();
        const textWords = textLower.split(/\s+/).filter(w => w.length > 4).slice(0, 10);
        const isRelevant = textWords.some(word => contextLower.includes(word)) || 
                          levelDescription.toLowerCase().split(/\s+/).some(word => contextLower.includes(word));
        
        if (isRelevant) {
          prompt += `Дополнительная информация из базы знаний (используй ТОЛЬКО если действительно относится к теме запроса):
${ragContext.substring(0, 1500)}

ВАЖНО: 
- Используй эту информацию ТОЛЬКО если она действительно релевантна запросу пользователя
- Если информация не соответствует теме - полностью игнорируй её и полагайся на свои знания
- Если используешь информацию из базы знаний, упомяни источник в формате [Источник 1], [Источник 2] и т.д.

`;
        } else {
          console.log('⚠️ RAG контекст не релевантен, пропускаем');
        }
      }

      prompt += `Твоя задача — проанализировать КОНКРЕТНЫЙ ТЕКСТ пользователя выше и дать уникальный ответ.

🚨 КРИТИЧЕСКИ ВАЖНО - ССЫЛКИ НА НОРМЫ ПРАВА:
- ВСЕГДА указывай конкретные статьи законов и кодексов (например: ТК РФ ст. 123, НК РФ ст. 54.1, ГК РФ ст. 432, ФЗ-152 ст. 18 и т.д.)
- ВСЕГДА ссылайся на судебную практику, если она есть (например: Постановление Пленума ВС РФ №2 от 17.03.2004, Определение ВС РФ от..., Постановление ФАС...)
- ВСЕГДА указывай конкретные нормы КоАП РФ для штрафов и санкций (например: ст. 5.27 КоАП РФ)
- Если упоминаешь риск или нарушение - ОБЯЗАТЕЛЬНО указывай конкретную норму права, которая его регулирует
- НЕ используй общие фразы типа "согласно законодательству" - всегда указывай конкретную статью и кодекс
- Формат ссылок: "Согласно ст. [номер] [название кодекса/закона]" или "В соответствии с [название документа] от [дата]"

ВАЖНО:
- Анализируй конкретный текст, который написал пользователь
- Если используешь информацию из базы знаний выше, указывай источник в формате [Источник 1], [Источник 2] и т.д.
- НЕ выдумывай источники, которые не были предоставлены
- Давай конкретные ответы на основе текста пользователя и информации из базы знаний
- Каждый ответ должен быть уникальным и относиться к конкретному вопросу
- Длина commentary может быть до 4000 символов - давай подробный анализ
- Используй характерный стиль Ани - дружелюбный, немного дерзкий, профессиональный
- В разделе "🔍 Юридическое обоснование" ВСЕГДА указывай минимум 2-3 конкретные ссылки на нормы права или судебную практику
- ОБЯЗАТЕЛЬНО используй МАРКИРОВАННЫЕ СПИСКИ (• или -) для структурирования информации - это улучшает читаемость
- Все списки должны быть отформатированы с маркерами, каждый пункт с новой строки

Верни JSON (начни с { и закончи с }):
{
  "commentary": "Подробный анализ текста пользователя с характером Ани. ОБЯЗАТЕЛЬНО включи раздел '🔍 Юридическое обоснование' с конкретными ссылками на статьи законов/кодексов и судебную практику (минимум 2-3 ссылки). Если используешь информацию из базы знаний, указывай источник в формате [Источник 1], [Источник 2]. Длина: до 4000 символов.",
  "state": "DANGER|SUCCESS|IDLE",
  "healthImpact": число от -50 до 50,
  "risks": [
    {
      "id": "уникальный_id",
      "title": "Конкретное название риска из текста пользователя",
      "description": "Описание риска на основе конкретного текста. ОБЯЗАТЕЛЬНО укажи конкретную норму права (статью кодекса/закона), которая регулирует этот риск.",
      "severity": "HIGH|MEDIUM|LOW",
      "matrixReference": "Уровень: ${levelDescription}",
      "suggestion": "Конкретная рекомендация по устранению риска с указанием конкретных норм права, которые нужно соблюдать"
    }
  ]
}`;

      // Запрос к LLMost API (OpenAI Compatible)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 180 секунд таймаут для длинных ответов
      
      const apiEndpoint = `${this.apiUrl}/chat/completions`;
      console.log('📤 Отправка запроса к LLMost API:', apiEndpoint);
      console.log('📤 Модель:', this.modelId);
      console.log('📤 Промпт (первые 200 символов):', prompt.substring(0, 200));
      
      let response: Response;
      try {
        response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: this.modelId,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 4000, // Максимальная длина ответа
            temperature: 0.7,
            top_p: 0.9,
            // Добавляем параметры для более полных ответов
            stop: null // Не останавливаем генерацию раньше времени
          }),
        });
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        console.error('❌ Ошибка при выполнении fetch:', fetchError);
        console.error('❌ Детали ошибки:', {
          name: fetchError?.name,
          message: fetchError?.message,
          stack: fetchError?.stack,
          cause: fetchError?.cause,
          type: typeof fetchError
        });
        
        // Создаем более информативную ошибку
        const errorMessage = fetchError?.message || fetchError?.toString() || 'Неизвестная ошибка';
        const errorName = fetchError?.name || 'Error';
        
        // Специальная обработка для "Load failed"
        if (errorName === 'TypeError' && (errorMessage.includes('Load failed') || errorMessage.includes('Failed to fetch'))) {
          const detailedError = new Error(
            'Не удалось подключиться к LLMost API. Возможные причины:\n' +
            '1. Проблема с интернет-соединением\n' +
            '2. Блокировка запросов браузером или расширениями\n' +
            '3. Проблема с CORS (проверьте настройки браузера)\n' +
            '4. Временная недоступность API сервера\n\n' +
            'Проверьте консоль браузера (F12) для деталей.'
          );
          detailedError.name = 'NetworkError';
          throw detailedError;
        }
        
        // Пробрасываем ошибку для обработки в catch блоке
        throw fetchError;
      }
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('❌ LLMost API error:', response.status, response.statusText, errorText);
        
        // Специальная обработка для ошибки 500
        if (response.status === 500) {
          throw new Error(
            'Ошибка сервера LLMost API (500 Internal Server Error).\n\n' +
            'Это временная проблема на стороне сервера. Возможные причины:\n' +
            '• Перегрузка сервера API\n' +
            '• Временная недоступность модели\n' +
            '• Проблемы с обработкой запроса\n\n' +
            'Рекомендации:\n' +
            '1. Подождите несколько секунд и попробуйте снова\n' +
            '2. Упростите запрос (сократите текст документа)\n' +
            '3. Проверьте статус API на https://llmost.ru\n' +
            '4. Если проблема сохраняется, попробуйте позже'
          );
        }
        
        throw new Error(`LLMost API error: ${response.status} ${response.statusText}. ${errorText}`);
      }

      const data = await response.json();
      
      // LLMost API возвращает ответ в формате OpenAI
      const responseText = data.choices?.[0]?.message?.content || '';
      const tokensGenerated = data.usage?.completion_tokens || 0;
      const finishReason = data.choices?.[0]?.finish_reason || '';
      
      console.log('📥 Получен ответ от API, длина:', responseText?.length || 0);
      console.log('📥 Токенов сгенерировано:', tokensGenerated);
      console.log('📥 Причина завершения:', finishReason);
      
      // Проверяем, не был ли ответ обрезан из-за лимита токенов
      if (finishReason === 'length' || finishReason === 'max_tokens') {
        console.warn('⚠️ Ответ может быть обрезан из-за достижения лимита токенов');
      }
      
      // Извлекаем JSON из текста ответа
      let result: AnalysisResult & {ragSources?: Array<{id: number, filename: string, source: string}>};
      try {
        let text = responseText;
        
        // Убираем повторение промпта из ответа (если есть)
        const promptStart = prompt.substring(0, 100);
        if (text.includes(promptStart)) {
          const parts = text.split(promptStart);
          if (parts.length > 1) {
            text = parts.slice(1).join(promptStart).trim();
          }
        }
        
        // Ищем JSON в тексте - используем более надежный метод
        // Сначала пытаемся найти полный JSON объект
        let jsonStr = '';
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        
        if (firstBrace >= 0 && lastBrace > firstBrace) {
          // Берем весь текст между первой { и последней }
          jsonStr = text.substring(firstBrace, lastBrace + 1);
          
          // Пытаемся найти полный JSON, начиная с более консервативного подхода
          let parsed = null;
          let attempts = [jsonStr];
          
          // Пробуем найти commentary даже если JSON обрывается
          // Используем более гибкое регулярное выражение для длинных строк
          const commentaryStart = jsonStr.indexOf('"commentary"');
          if (commentaryStart >= 0) {
            // Находим начало значения commentary
            const valueStart = jsonStr.indexOf(':', commentaryStart) + 1;
            const firstQuote = jsonStr.indexOf('"', valueStart);
            
            if (firstQuote >= 0) {
              // Ищем закрывающую кавычку, учитывая экранированные
              let i = firstQuote + 1;
              let foundEnd = false;
              
              while (i < jsonStr.length) {
                if (jsonStr[i] === '"' && jsonStr[i - 1] !== '\\') {
                  foundEnd = true;
                  break;
                }
                i++;
              }
              
              // Если не нашли закрывающую кавычку, значит commentary обрезан
              if (!foundEnd && i >= jsonStr.length) {
                // Пробуем восстановить JSON: добавляем закрывающие кавычки и скобки
                const commentaryValue = jsonStr.substring(firstQuote + 1);
                // Пробуем найти где должен заканчиваться commentary (по следующему полю)
                const nextFieldMatch = jsonStr.match(/",\s*"(state|risks|healthImpact)"/);
                if (!nextFieldMatch) {
                  // Commentary обрезан, восстанавливаем JSON
                  try {
                    const escapedValue = commentaryValue.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
                    const fixedJsonStr = jsonStr.substring(0, firstQuote + 1) + escapedValue + 
                                        '", "state": "IDLE", "healthImpact": 0, "risks": []}';
                    attempts.push(fixedJsonStr);
                  } catch (e) {
                    // Если не удалось восстановить, пропускаем
                  }
                }
              }
            }
          }
          
          // Пытаемся распарсить все варианты
          for (const attempt of attempts) {
            try {
              parsed = JSON.parse(attempt);
              jsonStr = attempt;
              break;
            } catch (e) {
              // Продолжаем с следующим вариантом
              continue;
            }
          }
          
          // Если не удалось распарсить, пробуем более агрессивный подход
          if (!parsed) {
            // Пытаемся извлечь commentary вручную даже из обрезанного JSON
            const commentaryMatch = text.match(/"commentary"\s*:\s*"([\s\S]*?)(?:"\s*,|\s*"\s*}|$)/);
            if (commentaryMatch) {
              try {
                // Собираем минимальный валидный JSON
                const commentaryText = commentaryMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                const minimalJson = `{
                  "commentary": ${JSON.stringify(commentaryText)},
                  "state": "IDLE",
                  "healthImpact": 0,
                  "risks": []
                }`;
                parsed = JSON.parse(minimalJson);
                jsonStr = minimalJson;
              } catch (e) {
                // Не удалось восстановить
              }
            }
          }
          
          if (parsed) {
            result = parsed;
          } else {
            // Последняя попытка: извлекаем текст commentary напрямую из ответа
            // Пробуем найти начало commentary и взять весь текст до конца
            const commentaryStartMatch = text.match(/"commentary"\s*:\s*"([\s\S]*)/);
            if (commentaryStartMatch) {
              let commentaryText = commentaryStartMatch[1];
              // Убираем экранированные кавычки в начале
              if (commentaryText.startsWith('\\"')) {
                commentaryText = commentaryText.substring(2);
              }
              // Берем весь текст до следующего поля или до конца
              const nextFieldIndex = commentaryText.search(/",\s*"(state|risks|healthImpact)"/);
              if (nextFieldIndex > 0) {
                commentaryText = commentaryText.substring(0, nextFieldIndex);
              }
              // Убираем экранированные символы
              commentaryText = commentaryText.replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n');
              
              result = {
                commentary: commentaryText || text.substring(0, 500).replace(/[{}]/g, '').trim() || 'Анализ выполнен',
                state: 'IDLE',
                healthImpact: 0,
                risks: []
              };
            } else {
              throw new Error('Не удалось распарсить JSON');
            }
          }
        } else {
          // Если JSON не найден, пробуем извлечь commentary из текста напрямую
          const commentaryMatch = text.match(/"commentary"\s*:\s*"([\s\S]*?)(?:"\s*,|"|$)/);
          if (commentaryMatch) {
            let commentaryText = commentaryMatch[1];
            // Убираем экранированные символы
            commentaryText = commentaryText.replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n');
            result = {
              commentary: commentaryText || text.substring(0, 500).replace(/[{}]/g, '').trim() || 'Анализ выполнен',
              state: 'IDLE',
              healthImpact: 0,
              risks: []
            };
          } else {
            throw new Error('JSON не найден в ответе');
          }
        }
        
        // Валидация и нормализация
        if (!result.commentary || typeof result.commentary !== 'string') {
          // Пробуем извлечь текст из ответа напрямую
          const textContent = responseText.replace(/[{}]/g, '').trim();
          result.commentary = textContent.substring(0, 500) || 'Анализ выполнен';
        }
        
        // Если commentary обрезан (заканчивается не на знак препинания), добавляем предупреждение
        const commentary = result.commentary.trim();
        if (commentary.length > 0 && !/[.!?]$/.test(commentary) && !commentary.includes('...')) {
          // Проверяем, не обрезан ли текст (если последние символы не выглядят как конец предложения)
          const lastWords = commentary.split(/\s+/).slice(-3).join(' ');
          if (lastWords.length < 20) { // Если последние слова короткие, возможно текст обрезан
            result.commentary = commentary + '... [Ответ может быть обрезан из-за ограничений API]';
          }
        }
        if (!result.state || !['ANALYZING', 'DANGER', 'SUCCESS', 'IDLE'].includes(result.state)) {
          result.state = 'IDLE';
        }
        if (typeof result.healthImpact !== 'number' || result.healthImpact < -50 || result.healthImpact > 50) {
          result.healthImpact = 0;
        }
        if (!Array.isArray(result.risks)) {
          result.risks = [];
        }
        
        // Не обрезаем commentary - пусть будет полным
        
        // Добавляем источники RAG к результату
        if (ragSources && ragSources.length > 0) {
          result.ragSources = ragSources;
        }
      } catch (parseError) {
        console.warn('Не удалось распарсить JSON, создаем структурированный ответ:', parseError);
        console.warn('Ответ от модели:', responseText.substring(0, 300));
        result = this.parseTextToResult(responseText, levelDescription);
        // Добавляем источники RAG даже при ошибке парсинга
        if (ragSources && ragSources.length > 0) {
          result.ragSources = ragSources;
        }
      }

      return result;
    } catch (error: any) {
      console.error("LLMost API Analysis Error:", error);
      console.error("Error details:", {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        cause: error?.cause
      });
      
      // Обработка ошибок
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        throw new Error('Превышено время ожидания ответа от API (3 минуты). Попробуйте упростить запрос или подождите.');
      }
      
      // Проверяем различные варианты ошибок сети
      const errorMessage = error?.message || error?.toString() || '';
      const errorMessageLower = errorMessage.toLowerCase();
      const errorName = error?.name || '';
      
      // Специальная обработка для CORS ошибок
      if (errorMessageLower.includes('access-control-allow-origin') || 
          errorMessageLower.includes('cors') ||
          (errorName === 'TypeError' && errorMessageLower.includes('load failed') && errorMessageLower.includes('access control'))) {
        throw new Error(
          'Ошибка CORS: LLMost API не разрешает запросы с вашего домена.\n\n' +
          'Решение: Используется прокси через Vite для обхода CORS.\n' +
          'Убедитесь, что dev server запущен и прокси настроен в vite.config.ts.\n\n' +
          'Если проблема сохраняется:\n' +
          '1. Перезапустите dev server (npm run dev)\n' +
          '2. Проверьте, что vite.config.ts содержит настройку прокси /api/llmost\n' +
          '3. Проверьте консоль браузера (F12) для деталей'
        );
      }
      
      // Специальная обработка для TypeError с "Load failed"
      if (errorName === 'TypeError' && errorMessageLower.includes('load failed')) {
        throw new Error(
          'Ошибка подключения к LLMost API: Load failed.\n\n' +
          'Это означает, что браузер не смог выполнить запрос. Возможные причины:\n' +
          '• Проблема с интернет-соединением\n' +
          '• Блокировка запросов расширениями браузера (AdBlock, Privacy Badger и т.д.)\n' +
          '• Проблема с CORS (проверьте настройки браузера)\n' +
          '• Временная недоступность API сервера\n\n' +
          'Попробуйте:\n' +
          '1. Проверить интернет-соединение\n' +
          '2. Отключить расширения браузера\n' +
          '3. Попробовать другой браузер\n' +
          '4. Проверить консоль браузера (F12) для деталей'
        );
      }
      
      if (errorMessageLower.includes('load failed') || 
          errorMessageLower.includes('failed to fetch') || 
          errorMessageLower.includes('networkerror') ||
          errorMessageLower.includes('network request failed') ||
          errorMessageLower.includes('fetch failed') ||
          (errorName === 'TypeError' && errorMessageLower.includes('fetch'))) {
        throw new Error('LLMost API недоступен. Проверьте интернет-соединение и доступность API. Если проблема сохраняется, проверьте настройки прокси и CORS в браузере.');
      }
      
      if (errorMessageLower.includes('401') || errorMessageLower.includes('unauthorized')) {
        throw new Error('Ошибка аутентификации LLMost API. Проверьте API ключ.');
      }
      
      if (errorMessageLower.includes('402') || 
          errorMessageLower.includes('403') || 
          errorMessageLower.includes('insufficient') || 
          errorMessageLower.includes('permission') || 
          errorMessageLower.includes('credits') || 
          errorMessageLower.includes('quota')) {
        throw new Error('Недостаточно средств или квоты на LLMost API. Проверьте баланс на https://llmost.ru');
      }
      
      if (errorMessageLower.includes('404') || errorMessageLower.includes('not found')) {
        throw new Error('Модель не найдена. Проверьте правильность идентификатора модели.');
      }
      
      if (errorMessageLower.includes('500') || errorMessageLower.includes('internal server error')) {
        throw new Error(
          'Ошибка сервера LLMost API (500 Internal Server Error).\n\n' +
          'Это временная проблема на стороне сервера. Возможные причины:\n' +
          '• Перегрузка сервера API\n' +
          '• Временная недоступность модели\n' +
          '• Проблемы с обработкой запроса\n\n' +
          'Рекомендации:\n' +
          '1. Подождите несколько секунд и попробуйте снова\n' +
          '2. Упростите запрос (сократите текст документа)\n' +
          '3. Проверьте статус API на https://llmost.ru\n' +
          '4. Если проблема сохраняется, попробуйте позже'
        );
      }
      
      if (errorMessageLower.includes('504') || errorMessageLower.includes('timeout') || errorMessageLower.includes('gateway timeout')) {
        throw new Error('Модель не успела сгенерировать ответ за отведенное время. Попробуйте переформулировать запрос или подождите.');
      }
      
      if (errorMessageLower.includes('cors') || errorMessageLower.includes('cross-origin')) {
        throw new Error('Ошибка CORS при обращении к LLMost API. Проверьте настройки браузера или используйте прокси.');
      }
      
      // Если это объект ошибки с response, пытаемся получить больше информации
      if (error?.response) {
        const status = error.response.status;
        const statusText = error.response.statusText;
        throw new Error(`Ошибка LLMost API: ${status} ${statusText}. Проверьте подключение и настройки API.`);
      }
      
      // Общая ошибка с деталями
      throw new Error(`Ошибка при обращении к LLMost API: ${errorMessage || 'Неизвестная ошибка'}. Проверьте консоль браузера (F12) для деталей.`);
    }
  }

  private parseTextToResult(text: string, levelDescription: string): AnalysisResult {
    // Парсим текст в структурированный ответ, если JSON не получен
    const risks: AnalysisResult['risks'] = [];
    
    // Пытаемся извлечь информацию о рисках из текста
    const riskMatches = text.match(/(?:риск|опасность|проблема)[:]\s*([^.!?]+)/gi);
    if (riskMatches && riskMatches.length > 0) {
      riskMatches.slice(0, 3).forEach((match, index) => {
        risks.push({
          id: `risk_${Date.now()}_${index}`,
          title: match.substring(0, 50),
          description: match,
          severity: index === 0 ? 'HIGH' : index === 1 ? 'MEDIUM' : 'LOW',
          matrixReference: levelDescription,
          suggestion: 'Требуется дополнительный анализ'
        });
      });
    }

    // Определяем состояние и влияние на здоровье
    let state = 'IDLE';
    let healthImpact = 0;

    if (text.toLowerCase().includes('опасно') || text.toLowerCase().includes('риск')) {
      state = 'DANGER';
      healthImpact = -20;
    } else if (text.toLowerCase().includes('отлично') || text.toLowerCase().includes('хорошо') || text.toLowerCase().includes('успех')) {
      state = 'SUCCESS';
      healthImpact = 10;
    }

    return {
      commentary: text.substring(0, 500),
      state: state,
      healthImpact: healthImpact,
      risks: risks.length > 0 ? risks : []
    };
  }

  async checkHealth(): Promise<boolean> {
    try {
      // Проверяем доступность LLMost API через список моделей
      try {
        const response = await fetch(`${this.apiUrl}/models`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
        });
        return response.ok;
      } catch (error) {
        console.error('Ошибка проверки здоровья API:', error);
        return false;
      }
    } catch {
      return false;
    }
  }
}

export const qwen = new QwenService();
