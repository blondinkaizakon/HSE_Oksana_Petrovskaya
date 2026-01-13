import React from 'react';
import { Risk } from '../types';

interface RiskRecommendationsProps {
  risks: Risk[];
  levelName: string;
  scorePercentage: number;
}

interface RiskRecommendationsProps {
  risks: Risk[];
  levelName: string;
  scorePercentage: number;
  questions?: Array<{ text: string; answer: boolean | null }>; // Добавляем вопросы
}

const RiskRecommendations: React.FC<RiskRecommendationsProps> = ({ risks, levelName, scorePercentage, questions = [] }) => {
  // Группируем риски по severity
  const highRisks = risks.filter(r => r.severity.toUpperCase() === 'HIGH');
  const mediumRisks = risks.filter(r => r.severity.toUpperCase() === 'MEDIUM');
  const lowRisks = risks.filter(r => r.severity.toUpperCase() === 'LOW');

  // Генерируем итоговые рекомендации
  const generateRecommendations = () => {
    const recommendations: string[] = [];

    if (highRisks.length > 0) {
      recommendations.push(
        `🔴 Критично: Выявлено ${highRisks.length} критических рисков. Требуется немедленное устранение.`
      );
      if (highRisks.length > 3) {
        recommendations.push(
          `⚠️ Высокий уровень критических рисков (${highRisks.length}). Рекомендуется привлечение экспертов.`
        );
      }
    }

    if (mediumRisks.length > 0) {
      recommendations.push(
        `🟡 Внимание: ${mediumRisks.length} рисков среднего уровня требуют внимания в ближайшее время.`
      );
    }

    if (lowRisks.length > 0 && highRisks.length === 0) {
      recommendations.push(
        `🟢 Низкий уровень рисков: ${lowRisks.length} рисков низкого уровня. Система работает стабильно.`
      );
    }

    if (scorePercentage < 50) {
      recommendations.push(
        `📉 Общий балл блока ${scorePercentage}% ниже нормы. Требуется комплексная работа по устранению рисков.`
      );
    } else if (scorePercentage < 70) {
      recommendations.push(
        `📊 Общий балл блока ${scorePercentage}% требует улучшения. Рекомендуется устранить критические риски.`
      );
    } else if (scorePercentage >= 80) {
      recommendations.push(
        `✅ Отличный результат: ${scorePercentage}% баллов. Блок соответствует требованиям безопасности.`
      );
    }

    // Добавляем приоритетные рекомендации из рисков
    if (highRisks.length > 0) {
      const topRisk = highRisks[0];
      recommendations.push(
        `🎯 Приоритет: Начать с устранения риска "${topRisk.title}". ${topRisk.suggestion || 'Требуется детальный анализ.'}`
      );
    }

    // Общие рекомендации
    if (risks.length > 5) {
      recommendations.push(
        `📋 Всего выявлено ${risks.length} рисков. Рекомендуется составить план устранения с приоритетами.`
      );
    }

    // Проверяем, что на все вопросы аудита стоят положительные ответы (все "Да")
    const allQuestionsAnsweredYes = questions.length > 0 && questions.every(q => q.answer === true);
    
    // "Риски не выявлены" только если нет рисков И на все вопросы ответ "Да"
    if (risks.length === 0 && allQuestionsAnsweredYes) {
      recommendations.push(
        `✅ Риски не выявлены. Блок "${levelName}" соответствует всем требованиям безопасности.`
      );
    } else if (risks.length === 0 && !allQuestionsAnsweredYes) {
      // Если есть вопросы с ответом "Нет" или не отвеченные, но нет рисков - все равно указываем на проблемы
      const noAnswers = questions.filter(q => q.answer === false);
      if (noAnswers.length > 0) {
        recommendations.push(
          `⚠️ Обнаружены ответы "Нет" в вопросах аудита (${noAnswers.length} шт.), что указывает на наличие рисков.`
        );
      }
    }

    return recommendations;
  };

  const recommendations = generateRecommendations();

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-rose-50 rounded-2xl border-2 border-indigo-200 p-6">
      <h4 className="text-xl font-black text-[#111C57] mb-4" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
        Итоговые рекомендации
      </h4>
      
      <div className="space-y-3">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className="bg-white/80 rounded-xl p-4 border border-indigo-100 shadow-sm"
          >
            <p className="text-base font-medium text-[#111C57] leading-relaxed" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
              {rec}
            </p>
          </div>
        ))}
      </div>

      {/* Сводка по приоритетам */}
      {risks.length > 0 && (
        <div className="mt-6 bg-white/60 rounded-xl p-4 border border-indigo-200">
          <div className="text-sm font-bold text-[#111C57] mb-3" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
            План действий:
          </div>
          <div className="space-y-2 text-sm text-gray-700">
            {highRisks.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="font-bold text-rose-600">1.</span>
                <span>Устранить {highRisks.length} критических рисков (высокий приоритет)</span>
              </div>
            )}
            {mediumRisks.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="font-bold text-amber-600">2.</span>
                <span>Проработать {mediumRisks.length} рисков среднего уровня (средний приоритет)</span>
              </div>
            )}
            {lowRisks.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="font-bold text-indigo-600">3.</span>
                <span>Проверить {lowRisks.length} рисков низкого уровня (низкий приоритет)</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskRecommendations;

