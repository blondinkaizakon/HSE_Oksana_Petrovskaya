import { qwen } from './qwenService';
import { GameLevel, Risk, Message } from '../types';
import { ProfileData } from '../App';

interface FinalAnalysisRequest {
  level: GameLevel;
  levelName: string;
  risks: Risk[];
  messages: Message[];
  questions: Array<{ id: number; text: string; answer: boolean | null }>;
  profileData: ProfileData;
  totalScore: number;
  maxScore: number;
}

interface FinalAnalysisResult {
  summary: string;
  riskMatrix: {
    high: Risk[];
    medium: Risk[];
    low: Risk[];
  };
  recommendations: Array<{
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    title: string;
    description: string;
    actions: string[];
  }>;
  overallAssessment: string;
}

export class AnalysisService {
  async generateFinalAnalysis(request: FinalAnalysisRequest): Promise<FinalAnalysisResult> {
    try {
      // Формируем контекст для анализа
      const context = this.buildAnalysisContext(request);
      
      // Создаем промпт для итогового анализа
      const prompt = `Ты — Аня, «Блондинка в законе» 👱‍♀️⚖️. Проведи итоговый анализ аудита.

Уровень аудита: ${request.levelName}

Контекст анализа:
${context}

Твоя задача — провести комплексный итоговый анализ на основе:
1. Выявленных рисков (${request.risks.length} шт.)
2. Вопросов аудита и ответов пользователя
3. Документов, загруженных в чате
4. Информации из профиля пользователя

🚨 КРИТИЧЕСКИ ВАЖНО:
- Если есть ответы "Нет" на вопросы аудита ИЛИ балл ниже 20% - ТЫ ДОЛЖНА указать, что риски ВЫЯВЛЕНЫ!
- НЕ можешь писать "риски не выявлены" или "выявлено 0 рисков" если есть ответы "Нет" или низкий балл!
- В riskMatrix ВСЕГДА должен быть хотя бы один риск, если есть ответы "Нет" или низкий балл!
- В summary ОБЯЗАТЕЛЬНО укажи, что риски ВЫЯВЛЕНЫ, если есть ответы "Нет" или низкий балл!
- ЕСЛИ все ответы "Да" И балл >= 80% И пользователь НЕ загружал документы И НЕ задавал вопросы в чате - ТЫ ДОЛЖНА написать "рисков не выявлено"!
- ЕСЛИ есть неотвеченные вопросы (answer === null) - ОБЯЗАТЕЛЬНО укажи в summary и overallAssessment: "информация для анализа предоставлена неполная"!

Верни JSON (начни с { и закончи с }):
{
  "summary": "Краткое резюме анализа (3-5 предложений). ВАЖНО: Если есть ответы 'Нет' на вопросы аудита ИЛИ балл ниже 20% - ОБЯЗАТЕЛЬНО пиши что риски ВЫЯВЛЕНЫ! Если все ответы 'Да', балл >= 80% и пользователь не загружал документы - пиши 'рисков не выявлено'. Если есть неотвеченные вопросы - ОБЯЗАТЕЛЬНО укажи 'информация для анализа предоставлена неполная'.",
  "riskMatrix": {
    "high": [список критических рисков с полями: id, title, description, severity, matrixReference, suggestion],
    "medium": [список средних рисков с полями: id, title, description, severity, matrixReference, suggestion],
    "low": [список низких рисков с полями: id, title, description, severity, matrixReference, suggestion]
  },
  "recommendations": [
    {
      "priority": "HIGH|MEDIUM|LOW",
      "title": "Название рекомендации",
      "description": "Подробное описание",
      "actions": ["Действие 1", "Действие 2"]
    }
  ],
  "overallAssessment": "Общая оценка ситуации и выводы (5-7 предложений). ВАЖНО: Если есть ответы 'Нет' или низкий балл - ОБЯЗАТЕЛЬНО укажи наличие рисков! Если все ответы 'Да', балл >= 80% и пользователь не загружал документы - укажи что рисков не выявлено. Если есть неотвеченные вопросы - ОБЯЗАТЕЛЬНО укажи 'информация для анализа предоставлена неполная'."
}`;

      // Запрос к LLMost API через прокси для обхода CORS
      // В браузере используем прокси, на сервере - прямой URL
      const apiUrl = typeof window !== 'undefined' 
        ? '/api/llmost/chat/completions'  // Прокси через Vite
        : 'https://llmost.ru/api/v1/chat/completions';  // Прямой URL на сервере
      
      console.log('📤 Отправка запроса к LLMost API:', apiUrl);
      console.log('📤 Используется прокси:', typeof window !== 'undefined');
      
      let response: Response;
      try {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer llmost_KxTBngg_6TEGpMmC4XXrHXLaAHVuwnyU0TjNG7Gsp7wJS5eiaL9q2hDET0pmMrWm'
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 3000,
            temperature: 0.7
          }),
        });
      } catch (fetchError: any) {
        console.error('❌ Ошибка при выполнении fetch в analysisService:', fetchError);
        const errorMessage = fetchError?.message || fetchError?.toString() || 'Неизвестная ошибка';
        const errorName = fetchError?.name || '';
        
        // Специальная обработка для CORS и сетевых ошибок
        if (errorName === 'TypeError' && (errorMessage.includes('Load failed') || errorMessage.includes('Failed to fetch'))) {
          throw new Error(
            'Не удалось подключиться к LLMost API через прокси. Возможные причины:\n' +
            '1. Dev server не запущен или прокси не настроен\n' +
            '2. Проблема с интернет-соединением\n' +
            '3. Блокировка запросов браузером или расширениями (особенно в Яндекс.Браузере)\n' +
            '4. Проблема с CORS (проверьте настройки браузера)\n\n' +
            'Решение:\n' +
            '1. Убедитесь, что dev server запущен (npm run dev)\n' +
            '2. Проверьте консоль браузера (F12) для деталей\n' +
            '3. Перезапустите dev server\n' +
            '4. В Яндекс.Браузере: отключите расширения, блокирующие запросы'
          );
        }
        
        throw fetchError;
      }

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
      const responseText = data.choices?.[0]?.message?.content || '';
      
      // Парсим JSON из ответа
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON not found in response');
      }
      
      const result: FinalAnalysisResult = JSON.parse(jsonMatch[0]);
      
      // Проверяем ответы "Нет" ДО валидации
      const noAnswers = request.questions.filter(q => q.answer === false);
      const yesAnswers = request.questions.filter(q => q.answer === true);
      const unansweredQuestions = request.questions.filter(q => q.answer === null);
      const allQuestionsAnswered = request.questions.length > 0 && request.questions.every(q => q.answer !== null);
      const allAnswersYes = allQuestionsAnswered && noAnswers.length === 0 && yesAnswers.length === request.questions.length;
      const hasUnansweredQuestions = unansweredQuestions.length > 0;
      
      // Проверяем процент балла - если 0% или очень низкий, это означает наличие рисков
      const scorePercentage = request.maxScore > 0 ? Math.round((request.totalScore / request.maxScore) * 100) : 0;
      const hasLowScore = scorePercentage < 20; // Если меньше 20%, считаем что есть риски
      const hasHighScore = scorePercentage >= 80; // Если >= 80%, считаем что все хорошо
      
      // Проверяем, есть ли загруженные документы или вопросы пользователя в чате
      // Исключаем системные сообщения (приветствие и т.д.)
      const userMessages = request.messages.filter(m => m.role === 'user');
      const hasUserDocuments = userMessages.some(m => m.content.length > 100); // Документы обычно длинные
      const hasUserQuestions = userMessages.some(m => m.content.length <= 100 && m.content.trim().length > 0); // Вопросы обычно короткие
      const hasUserActivity = hasUserDocuments || hasUserQuestions;
      
      // Валидация и нормализация
      if (!result.summary) result.summary = 'Анализ выполнен';
      if (!result.riskMatrix) {
        const normalizeSeverity = (s: string) => s.toUpperCase();
        result.riskMatrix = {
          high: request.risks.filter(r => normalizeSeverity(r.severity) === 'HIGH'),
          medium: request.risks.filter(r => normalizeSeverity(r.severity) === 'MEDIUM'),
          low: request.risks.filter(r => normalizeSeverity(r.severity) === 'LOW')
        };
      }
      
      // Если есть неотвеченные вопросы - добавляем предупреждение
      if (hasUnansweredQuestions) {
        const unansweredCount = unansweredQuestions.length;
        const unansweredText = unansweredCount === 1 
          ? 'один вопрос не отвечен' 
          : unansweredCount === request.questions.length
          ? 'все вопросы не отвечены'
          : `${unansweredCount} вопроса не отвечены`;
        
        // Добавляем предупреждение в summary
        if (!result.summary.toLowerCase().includes('неполная') && !result.summary.toLowerCase().includes('не отвечен')) {
          result.summary = `⚠️ Информация для анализа предоставлена неполная: ${unansweredText}. ${result.summary}`;
        }
        
        // Добавляем предупреждение в overallAssessment
        if (!result.overallAssessment.toLowerCase().includes('неполная') && !result.overallAssessment.toLowerCase().includes('не отвечен')) {
          result.overallAssessment = `⚠️ Информация для анализа предоставлена неполная: ${unansweredText}. Для полного анализа необходимо ответить на все вопросы аудита. ${result.overallAssessment}`;
        }
      }
      // Если есть ответы "Нет" или низкий балл, но riskMatrix пуст - добавляем риск
      if (noAnswers.length > 0 || hasLowScore) {
        const totalRisksInMatrix = result.riskMatrix.high.length + result.riskMatrix.medium.length + result.riskMatrix.low.length;
        if (totalRisksInMatrix === 0 && request.risks.length === 0) {
          // Создаем автоматический риск
          const autoRisk = {
            id: 'auto_risk_no_answers',
            title: hasLowScore ? 'Критически низкий балл блока' : 'Обнаружены ответы "Нет" в вопросах аудита',
            description: hasLowScore 
              ? `Общий балл блока составляет ${scorePercentage}%, что значительно ниже нормы. Это указывает на наличие системных проблем.`
              : `На вопросы аудита были даны ответы "Нет" (${noAnswers.length} ответов), что указывает на наличие рисков в данном блоке.`,
            severity: 'HIGH' as const,
            matrixReference: request.levelName,
            suggestion: 'Требуется комплексная работа по устранению выявленных проблем и повышению уровня соответствия требованиям.'
          };
          result.riskMatrix.high.push(autoRisk);
        }
      }
      if (!result.recommendations) result.recommendations = [];
      if (!result.overallAssessment) result.overallAssessment = 'Требуется дополнительный анализ';
      
      // Проверяем условие "рисков не выявлено": все ответы "Да", высокий балл, нет активности пользователя в чате
      const noRisksDetected = allAnswersYes && hasHighScore && !hasUserActivity && request.risks.length === 0;
      
      // ОБЯЗАТЕЛЬНО добавляем информацию о рисках, если есть ответы "Нет" ИЛИ низкий балл
      if (noAnswers.length > 0 || hasLowScore) {
        // ВСЕГДА перезаписываем summary, если есть ответы "Нет"
        const summaryLower = result.summary.toLowerCase();
        const hasNoProblemsPhrase = summaryLower.includes('не выявлен') || 
            summaryLower.includes('проблем нет') ||
            summaryLower.includes('все в порядке') ||
            summaryLower.includes('соответствует всем требованиям') ||
            summaryLower.includes('риски не выявлены') ||
            summaryLower.includes('риск не обнаружен');
        
        if (hasNoProblemsPhrase) {
          if (hasLowScore && scorePercentage === 0) {
            result.summary = `⚠️ Риски выявлены! Общий балл блока составляет 0%, что указывает на критическое состояние. Требуется немедленная комплексная работа по устранению рисков.`;
          } else if (hasLowScore) {
            result.summary = `⚠️ Риски выявлены! Общий балл блока составляет ${scorePercentage}%, что значительно ниже нормы. ${noAnswers.length > 0 ? `На основе анализа ответов "Нет" на вопросы аудита (${noAnswers.length} ответов) ` : ''}Выявлены потенциальные проблемы. Требуется дополнительный анализ и принятие мер.`;
          } else if (noAnswers.length > 0) {
            result.summary = `⚠️ Риски выявлены! На основе анализа ответов "Нет" на вопросы аудита (${noAnswers.length} ответов) выявлены потенциальные проблемы. Требуется дополнительный анализ и принятие мер.`;
          } else {
            result.summary = `⚠️ Риски выявлены! Требуется дополнительный анализ и принятие мер.`;
          }
        } else if (!result.summary.toLowerCase().includes('риск')) {
          result.summary = `⚠️ Риски выявлены! ${result.summary}`;
        }
        
        // ВСЕГДА перезаписываем overallAssessment, если есть ответы "Нет" ИЛИ низкий балл
        const assessmentLower = result.overallAssessment.toLowerCase();
        const hasNoProblemsAssessment = assessmentLower.includes('не выявлен') || 
            assessmentLower.includes('проблем нет') ||
            assessmentLower.includes('все в порядке') ||
            assessmentLower.includes('соответствует всем требованиям') ||
            assessmentLower.includes('риски не выявлены') ||
            assessmentLower.includes('риск не обнаружен');
        
        if (hasNoProblemsAssessment) {
          if (hasLowScore && scorePercentage === 0) {
            result.overallAssessment = `Общий балл блока составляет 0%, что указывает на критическое состояние и наличие системных проблем. Требуется немедленная комплексная работа по устранению выявленных рисков.`;
          } else if (hasLowScore) {
            result.overallAssessment = `Общий балл блока составляет ${scorePercentage}%, что значительно ниже нормы. ${noAnswers.length > 0 ? `Обнаружено ${noAnswers.length} ответов "Нет" на вопросы аудита. ` : ''}Требуется принятие мер по устранению выявленных проблем.`;
          } else if (noAnswers.length > 0) {
            result.overallAssessment = `Обнаружено ${noAnswers.length} ответов "Нет" на вопросы аудита, что указывает на наличие рисков в данном блоке. Требуется принятие мер по устранению выявленных проблем.`;
          } else {
            result.overallAssessment = `Выявлены риски в данном блоке. Требуется принятие мер по устранению выявленных проблем.`;
          }
        } else if (!result.overallAssessment.toLowerCase().includes('нет') && !result.overallAssessment.toLowerCase().includes('ответ') && !result.overallAssessment.toLowerCase().includes('балл')) {
          if (hasLowScore) {
            result.overallAssessment = `Общий балл блока составляет ${scorePercentage}%, что ниже нормы. ${result.overallAssessment}`;
          } else if (noAnswers.length > 0) {
            result.overallAssessment = `Обнаружено ${noAnswers.length} ответов "Нет" на вопросы аудита. ${result.overallAssessment}`;
          }
        }
      }
      
      // Если все условия выполнены - указываем что рисков не выявлено
      if (noRisksDetected) {
        // Перезаписываем summary и overallAssessment если AI написал про риски
        const summaryLower = result.summary.toLowerCase();
        const assessmentLower = result.overallAssessment.toLowerCase();
        const hasRisksPhrase = summaryLower.includes('риск') || 
            summaryLower.includes('проблем') ||
            summaryLower.includes('нарушен') ||
            assessmentLower.includes('риск') ||
            assessmentLower.includes('проблем') ||
            assessmentLower.includes('нарушен');
        
        if (hasRisksPhrase || result.riskMatrix.high.length > 0 || result.riskMatrix.medium.length > 0 || result.riskMatrix.low.length > 0) {
          result.summary = `✅ Риски не выявлены. Блок "${request.levelName}" соответствует всем требованиям. Все вопросы аудита получили положительные ответы, общий балл составляет ${scorePercentage}%.`;
          result.overallAssessment = `Оценка: ${request.totalScore}/${request.maxScore}. Рисков не выявлено.`;
          // Очищаем матрицу рисков
          result.riskMatrix = {
            high: [],
            medium: [],
            low: []
          };
          // Очищаем рекомендации или оставляем только общие
          result.recommendations = [{
            priority: 'LOW' as const,
            title: 'Поддержание текущего уровня',
            description: 'Рекомендуется продолжать соблюдать установленные процедуры и требования для поддержания текущего уровня соответствия.',
            actions: ['Регулярно проводить внутренние проверки', 'Обновлять документацию при необходимости', 'Обучать сотрудников актуальным требованиям']
          }];
        }
      }
      
      return result;
    } catch (error) {
      console.error('Final analysis error:', error);
      // Возвращаем базовый анализ при ошибке
      return this.getDefaultAnalysis(request);
    }
  }

  private buildAnalysisContext(request: FinalAnalysisRequest): string {
    let context = `Оценка: ${request.totalScore}/${request.maxScore} (${Math.round((request.totalScore / request.maxScore) * 100)}%)\n\n`;
    
    // Профиль пользователя
    if (request.profileData.company || request.profileData.name) {
      context += `Профиль пользователя:\n`;
      if (request.profileData.name) context += `- Имя: ${request.profileData.name}\n`;
      if (request.profileData.company) context += `- Компания: ${request.profileData.company}\n`;
      if (request.profileData.industry) context += `- Отрасль: ${request.profileData.industry}\n`;
      if (request.profileData.employees) context += `- Количество сотрудников: ${request.profileData.employees}\n`;
      context += '\n';
    }
    
      // Вопросы и ответы
      if (request.questions.length > 0) {
        context += `Вопросы аудита:\n`;
        const noAnswers = request.questions.filter(q => q.answer === false);
        const yesAnswers = request.questions.filter(q => q.answer === true);
        const unansweredQuestions = request.questions.filter(q => q.answer === null);
        const allQuestionsAnswered = request.questions.length > 0 && request.questions.every(q => q.answer !== null);
        const allAnswersYes = allQuestionsAnswered && noAnswers.length === 0 && yesAnswers.length === request.questions.length;
        const scorePercentage = request.maxScore > 0 ? Math.round((request.totalScore / request.maxScore) * 100) : 0;
        const hasLowScore = scorePercentage < 20;
        const hasHighScore = scorePercentage >= 80;
        const hasUnansweredQuestions = unansweredQuestions.length > 0;
        
        // Проверяем активность пользователя в чате
        const userMessages = request.messages.filter(m => m.role === 'user');
        const hasUserDocuments = userMessages.some(m => m.content.length > 100);
        const hasUserQuestions = userMessages.some(m => m.content.length <= 100 && m.content.trim().length > 0);
        const hasUserActivity = hasUserDocuments || hasUserQuestions;
        
        // Если есть неотвеченные вопросы - добавляем предупреждение
        if (hasUnansweredQuestions) {
          const unansweredCount = unansweredQuestions.length;
          context += `\n⚠️ ВАЖНО:\n`;
          context += `Не все вопросы аудита получили ответы: ${unansweredCount} из ${request.questions.length} вопросов не отвечены!\n`;
          context += `Это означает, что информация для анализа предоставлена неполная.\n`;
          context += `Ты ДОЛЖНА указать в summary и overallAssessment, что "информация для анализа предоставлена неполная".\n`;
          context += `Список неотвеченных вопросов:\n`;
          unansweredQuestions.forEach((q, i) => {
            const qIndex = request.questions.indexOf(q) + 1;
            context += `${i + 1}. Вопрос ${qIndex}: ${q.text}\n`;
          });
          context += '\n';
        }
      
      if (noAnswers.length > 0 || hasLowScore) {
        context += `\n🚨 КРИТИЧЕСКИ ВАЖНО:\n`;
        if (hasLowScore) {
          context += `Общий балл блока составляет ${scorePercentage}% (${request.totalScore}/${request.maxScore})!\n`;
          if (scorePercentage === 0) {
            context += `Балл равен 0% - это ОБЯЗАТЕЛЬНО означает наличие критических рисков!\n`;
          } else {
            context += `Балл значительно ниже нормы - это ОБЯЗАТЕЛЬНО означает наличие рисков!\n`;
          }
        }
        if (noAnswers.length > 0) {
          context += `Обнаружено ${noAnswers.length} ответов "Нет" на вопросы аудита!\n`;
          context += `Это ОБЯЗАТЕЛЬНО означает наличие рисков в данном блоке!\n`;
          context += `Список вопросов с ответом "Нет":\n`;
          noAnswers.forEach((q, i) => {
            const qIndex = request.questions.indexOf(q) + 1;
            context += `${i + 1}. Вопрос ${qIndex}: ${q.text}\n`;
          });
        }
        context += `\nТы ДОЛЖЕН указать, что риски ВЫЯВЛЕНЫ, и НЕ можешь писать что "риски не выявлены" или "все соответствует требованиям"!\n`;
        context += '\n';
      } else if (allAnswersYes && hasHighScore && !hasUserActivity && request.risks.length === 0) {
        // Если все ответы "Да", высокий балл, нет активности пользователя и нет рисков
        context += `\n✅ ВАЖНО:\n`;
        context += `Все вопросы аудита получили положительные ответы (${yesAnswers.length} ответов "Да")!\n`;
        context += `Общий балл блока составляет ${scorePercentage}% (${request.totalScore}/${request.maxScore}), что является хорошим показателем!\n`;
        context += `Пользователь НЕ загружал документы и НЕ задавал вопросы в чате.\n`;
        context += `Выявленных рисков нет (${request.risks.length} рисков).\n`;
        context += `\nТы ДОЛЖНА написать что "рисков не выявлено" и указать что блок соответствует всем требованиям!\n`;
        context += '\n';
      }
      request.questions.forEach((q, i) => {
        const answer = q.answer === true ? 'Да' : q.answer === false ? 'Нет' : 'Не отвечен';
        context += `${i + 1}. ${q.text} - Ответ: ${answer}\n`;
      });
      context += '\n';
    }
    
    // Документы из чата
    const documents = request.messages.filter(m => m.role === 'user' && m.content.length > 100);
    if (documents.length > 0) {
      context += `Документы в чате (${documents.length}):\n`;
      documents.forEach((doc, i) => {
        context += `Документ ${i + 1}: ${doc.content.substring(0, 200)}...\n`;
      });
      context += '\n';
    }
    
    // Риски
    if (request.risks.length > 0) {
      context += `Выявленные риски (${request.risks.length}):\n`;
      request.risks.forEach((risk, i) => {
        context += `${i + 1}. [${risk.severity}] ${risk.title}: ${risk.description}\n`;
      });
    }
    
    return context;
  }

  private getDefaultAnalysis(request: FinalAnalysisRequest): FinalAnalysisResult {
    const normalizeSeverity = (s: string) => s.toUpperCase();
    return {
      summary: `Проведен анализ уровня "${request.levelName}". Выявлено ${request.risks.length} рисков.`,
      riskMatrix: {
        high: request.risks.filter(r => normalizeSeverity(r.severity) === 'HIGH'),
        medium: request.risks.filter(r => normalizeSeverity(r.severity) === 'MEDIUM'),
        low: request.risks.filter(r => normalizeSeverity(r.severity) === 'LOW')
      },
      recommendations: request.risks.slice(0, 5).map(risk => ({
        priority: risk.severity as 'HIGH' | 'MEDIUM' | 'LOW',
        title: risk.title,
        description: risk.description,
        actions: [risk.suggestion]
      })),
      overallAssessment: `Оценка: ${request.totalScore}/${request.maxScore}. Требуется внимание к выявленным рискам.`
    };
  }
}

export const analysisService = new AnalysisService();

