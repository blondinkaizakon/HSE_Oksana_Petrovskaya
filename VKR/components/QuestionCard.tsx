import React from 'react';
import { LevelQuestion } from '../gameStructure';

interface QuestionCardProps {
  question: LevelQuestion;
  index: number;
  answer?: boolean | null;
  onAnswer: (questionId: number, answer: boolean) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, index, answer, onAnswer }) => {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border-2 border-indigo-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
          {question.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
            <span className="text-xs sm:text-sm font-bold text-indigo-600 uppercase tracking-wide">
              {question.zone}
            </span>
            <span className="text-xs font-semibold text-gray-400">
              {question.points} баллов
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#111C57] mb-3 leading-snug" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
            {question.question}
          </h3>
        </div>
      </div>
      
      <div className="flex gap-2 sm:gap-3">
        <button
          onClick={() => onAnswer(question.id, true)}
          className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl font-bold transition-all active:scale-95 text-sm sm:text-base ${
            answer === true
              ? 'bg-emerald-500 text-white shadow-lg'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-2 border-emerald-200'
          }`}
          style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
        >
          ✅ Да
        </button>
        <button
          onClick={() => onAnswer(question.id, false)}
          className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl font-bold transition-all active:scale-95 text-sm sm:text-base ${
            answer === false
              ? 'bg-rose-500 text-white shadow-lg'
              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-2 border-rose-200'
          }`}
          style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
        >
          ❌ Нет
        </button>
      </div>
    </div>
  );
};

export default QuestionCard;

