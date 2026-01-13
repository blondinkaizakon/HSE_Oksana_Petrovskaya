import React, { useState, useEffect } from 'react';
import { Risk, GameLevel, Message } from '../types';
import RiskCard from './RiskCard';
import RiskMatrix from './RiskMatrix';
import RiskRecommendations from './RiskRecommendations';
import { analysisService } from '../services/analysisService';

interface RiskSummaryProps {
  level: GameLevel;
  levelName: string;
  risks: Risk[];
  totalScore: number;
  maxScore: number;
  messages: Message[];
  questions: Array<{ id: number; text: string; answer: boolean | null }>;
  profileData: {
    name: string;
    company: string;
    position: string;
    email: string;
    phone: string;
    industry: string;
    employees: string;
  };
}

const RiskSummary: React.FC<RiskSummaryProps> = ({ 
  level, 
  levelName, 
  risks, 
  totalScore, 
  maxScore,
  messages,
  questions,
  profileData
}) => {
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Генерируем итоговый анализ с ИИ при загрузке
  useEffect(() => {
    const generateAnalysis = async () => {
      // Проверяем, есть ли сохраненный анализ для этого уровня
      const savedAnalysisKey = `analysis_${level}_${levelName}`;
      const savedData = localStorage.getItem(savedAnalysisKey);
      
      // Создаем ключ для проверки изменений
      const dataHash = JSON.stringify({
        risks: risks.map(r => r.id),
        messagesCount: messages.length,
        questionsCount: questions.length,
        questionsAnswers: questions.map(q => q.answer),
        hasNoAnswers: questions.some(q => q.answer === false) // Добавляем проверку на "Нет"
      });
      const savedHash = localStorage.getItem(`${savedAnalysisKey}_hash`);
      
      // Если данные не изменились, используем сохраненный анализ
      if (savedData && savedHash === dataHash) {
        try {
          setAiAnalysis(JSON.parse(savedData));
          return;
        } catch (e) {
          console.warn('Failed to load saved analysis:', e);
        }
      }
      
      // Генерируем новый анализ
      setIsGenerating(true);
      try {
        const analysis = await analysisService.generateFinalAnalysis({
          level,
          levelName,
          risks,
          messages,
          questions,
          profileData,
          totalScore,
          maxScore
        });
        setAiAnalysis(analysis);
        
        // Сохраняем анализ и хеш данных
        localStorage.setItem(savedAnalysisKey, JSON.stringify(analysis));
        localStorage.setItem(`${savedAnalysisKey}_hash`, dataHash);
      } catch (error) {
        console.error('Error generating analysis:', error);
      } finally {
        setIsGenerating(false);
      }
    };

    if (risks.length > 0 || messages.length > 0 || questions.length > 0) {
      generateAnalysis();
    }
  }, [level, levelName, risks.length, messages.length, questions.length]);

  // Группируем риски по severity
  const risksBySeverity = {
    HIGH: risks.filter(r => r.severity.toUpperCase() === 'HIGH'),
    MEDIUM: risks.filter(r => r.severity.toUpperCase() === 'MEDIUM'),
    LOW: risks.filter(r => r.severity.toUpperCase() === 'LOW')
  };

  const scorePercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const healthStatus = scorePercentage >= 80 ? 'excellent' : scorePercentage >= 60 ? 'good' : scorePercentage >= 40 ? 'warning' : 'danger';

  return (
    <div className="bg-white rounded-2xl border-2 border-indigo-100 shadow-lg p-6 mb-6">
      {/* Заголовок уровня */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl md:text-2xl font-black text-[#111C57] mb-1 sm:mb-2 leading-tight break-words" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
            {levelName}
          </h3>
          <p className="text-xs sm:text-sm text-indigo-600 font-medium">Анализ рисков</p>
        </div>
        <div className="text-left sm:text-right flex-shrink-0">
          <div className="text-2xl sm:text-3xl font-black text-[#111C57]" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
            {totalScore}/{maxScore}
          </div>
          <div className={`text-xs sm:text-sm font-bold ${
            healthStatus === 'excellent' ? 'text-emerald-600' :
            healthStatus === 'good' ? 'text-indigo-600' :
            healthStatus === 'warning' ? 'text-amber-600' :
            'text-rose-600'
          }`}>
            {scorePercentage}%
          </div>
        </div>
      </div>

      {/* Статистика рисков */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-rose-50 border-2 border-rose-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-rose-600 mb-1" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
            {risksBySeverity.HIGH.length}
          </div>
          <div className="text-sm font-bold text-rose-700">Критические</div>
        </div>
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-amber-600 mb-1" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
            {risksBySeverity.MEDIUM.length}
          </div>
          <div className="text-sm font-bold text-amber-700">Средние</div>
        </div>
        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-indigo-600 mb-1" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
            {risksBySeverity.LOW.length}
          </div>
          <div className="text-sm font-bold text-indigo-700">Низкие</div>
        </div>
      </div>

      {/* Описание обнаруженных рисков */}
      {risks.length > 0 && (
        <div className="mb-6 bg-rose-50 border-2 border-rose-200 rounded-xl p-4 sm:p-6">
          <h4 className="text-lg sm:text-xl font-black text-[#111C57] mb-4" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
            ⚠️ Обнаруженные риски по итогам аудита
          </h4>
          <div className="space-y-3 sm:space-y-4">
            {risks.map((risk, index) => (
              <div key={risk.id} className="bg-white rounded-xl p-4 border-2 border-rose-100">
                <div className="flex items-start gap-3 mb-2">
                  <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                    risk.severity.toUpperCase() === 'HIGH' ? 'bg-rose-500 text-white' :
                    risk.severity.toUpperCase() === 'MEDIUM' ? 'bg-amber-500 text-white' :
                    'bg-indigo-500 text-white'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-[#111C57] mb-1 text-sm sm:text-base" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
                      {risk.title}
                    </h5>
                    <p className="text-indigo-700 text-xs sm:text-sm leading-relaxed mb-2" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
                      {risk.description}
                    </p>
                    {risk.suggestion && (
                      <div className="bg-indigo-50 rounded-lg p-2 sm:p-3 mt-2">
                        <p className="text-xs sm:text-sm font-semibold text-indigo-800 mb-1" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
                          💡 Рекомендация:
                        </p>
                        <p className="text-xs sm:text-sm text-indigo-700 leading-relaxed" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
                          {risk.suggestion}
                        </p>
                      </div>
                    )}
                    {risk.matrixReference && (
                      <p className="text-xs text-indigo-400 mt-2 font-mono">
                        {risk.matrixReference}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Матрица рисков */}
      {risks.length > 0 && (
        <div className="mb-6">
          <RiskMatrix risks={risks} />
        </div>
      )}

      {/* Итоговый анализ с ИИ */}
      {isGenerating && (
        <div className="mb-6 bg-indigo-50 border-2 border-indigo-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin-slow text-2xl">🧐</div>
            <div className="text-indigo-700 font-bold" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
              Аня анализирует данные...
            </div>
          </div>
        </div>
      )}

      {aiAnalysis && !isGenerating && (
        <div className="mb-6 space-y-4">
          {/* Резюме анализа */}
          {aiAnalysis.summary && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6">
              <h4 className="text-lg font-black text-[#111C57] mb-3" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
                📊 Итоговое резюме
              </h4>
              <p className="text-indigo-700 leading-relaxed" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
                {aiAnalysis.summary}
              </p>
            </div>
          )}

          {/* Общая оценка */}
          {aiAnalysis.overallAssessment && (
            <div className="bg-white border-2 border-indigo-100 rounded-xl p-4 sm:p-6">
              <h4 className="text-base sm:text-lg font-black text-[#111C57] mb-3" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
                🎯 Общая оценка
              </h4>
              <p className="text-sm sm:text-base text-indigo-700 leading-relaxed whitespace-pre-line" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
                {aiAnalysis.overallAssessment}
              </p>
            </div>
          )}

          {/* Рекомендации от ИИ */}
          {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
              <h4 className="text-lg font-black text-[#111C57] mb-4" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
                💡 Рекомендации от Ани
              </h4>
              <div className="space-y-4">
                {aiAnalysis.recommendations.map((rec: any, idx: number) => (
                  <div key={idx} className="bg-white rounded-lg p-4 border border-amber-200">
                    <div className="flex items-start gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        rec.priority === 'HIGH' ? 'bg-rose-500 text-white' :
                        rec.priority === 'MEDIUM' ? 'bg-amber-500 text-white' :
                        'bg-indigo-500 text-white'
                      }`}>
                        {rec.priority}
                      </span>
                      <h5 className="font-bold text-[#111C57]" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
                        {rec.title}
                      </h5>
                    </div>
                    <p className="text-indigo-700 text-sm mb-2" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
                      {rec.description}
                    </p>
                    {rec.actions && rec.actions.length > 0 && (
                      <ul className="list-disc list-inside text-sm text-indigo-600 space-y-1">
                        {rec.actions.map((action: string, actIdx: number) => (
                          <li key={actIdx}>{action}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Матрица рисков от ИИ */}
          {aiAnalysis.riskMatrix && (() => {
            // Преобразуем riskMatrix в массив рисков
            const allRisksFromAI = [
              ...(aiAnalysis.riskMatrix.high || []),
              ...(aiAnalysis.riskMatrix.medium || []),
              ...(aiAnalysis.riskMatrix.low || [])
            ];
            return allRisksFromAI.length > 0 ? (
              <div className="bg-white border-2 border-indigo-100 rounded-xl p-6">
                <h4 className="text-lg font-black text-[#111C57] mb-4" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
                  📊 Матрица рисков
                </h4>
                <RiskMatrix risks={allRisksFromAI} />
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* Матрица рисков (базовая, если нет от ИИ) */}
      {(!aiAnalysis || !aiAnalysis.riskMatrix || (() => {
        const allRisksFromAI = [
          ...(aiAnalysis?.riskMatrix?.high || []),
          ...(aiAnalysis?.riskMatrix?.medium || []),
          ...(aiAnalysis?.riskMatrix?.low || [])
        ];
        return allRisksFromAI.length === 0;
      })()) && (
        <div className="mb-6 bg-white border-2 border-indigo-100 rounded-xl p-6">
          <h4 className="text-lg font-black text-[#111C57] mb-4" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
            📊 Матрица рисков
          </h4>
          <RiskMatrix risks={risks} />
        </div>
      )}

      {/* Итоговые рекомендации (базовые) */}
      <div className="mb-6">
        <RiskRecommendations 
          risks={risks} 
          levelName={levelName}
          scorePercentage={scorePercentage}
          questions={questions}
        />
      </div>

      {/* Список рисков */}
      {(() => {
        // Проверяем, есть ли ответы "Нет" в вопросах
        const hasNoAnswers = questions.some(q => q.answer === false);
        // Если балл 0% или очень низкий (< 20%), это означает наличие рисков
        const hasLowScore = scorePercentage < 20;
        // Проверяем, есть ли риски в сообщениях
        const hasRisks = risks.length > 0 || hasNoAnswers || hasLowScore;
        
        // Если есть риски, но их список пуст, создаем общий риск на основе низкого балла
        const displayRisks = risks.length > 0 ? risks : (hasLowScore || hasNoAnswers ? [{
          id: 'low_score_risk',
          title: hasLowScore ? 'Критически низкий балл блока' : 'Обнаружены ответы "Нет" в вопросах аудита',
          description: hasLowScore 
            ? `Общий балл блока составляет ${scorePercentage}%, что значительно ниже нормы. Это указывает на наличие системных проблем и требует немедленного внимания.`
            : 'На вопросы аудита были даны ответы "Нет", что указывает на наличие рисков в данном блоке.',
          severity: 'HIGH' as const,
          matrixReference: levelName,
          suggestion: 'Требуется комплексная работа по устранению выявленных проблем и повышению уровня соответствия требованиям.'
        }] : []);
        
        return hasRisks ? (
        <div>
          <h4 className="text-base sm:text-lg font-black text-[#111C57] mb-3 sm:mb-4" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
            Выявленные риски:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {displayRisks.map(risk => (
              <RiskCard key={risk.id} risk={risk} />
            ))}
          </div>
        </div>
        ) : (
          <div className="text-center py-8 bg-emerald-50 border-2 border-emerald-200 rounded-xl">
            <div className="text-4xl mb-2">✅</div>
            <div className="text-lg font-bold text-emerald-700" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
              Риски не выявлены
            </div>
            <div className="text-sm text-emerald-600 mt-1">
              Этот блок соответствует всем требованиям
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default RiskSummary;

