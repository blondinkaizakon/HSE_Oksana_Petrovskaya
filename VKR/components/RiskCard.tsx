
import React, { useState } from 'react';
import { Risk } from '../types';

interface RiskCardProps {
  risk: Risk;
}

const RiskCard: React.FC<RiskCardProps> = ({ risk }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const getSeverityKey = (severity: string): 'high' | 'medium' | 'low' => {
    const normalized = severity.toLowerCase();
    if (normalized === 'high') return 'high';
    if (normalized === 'medium') return 'medium';
    return 'low';
  };

  const severityStyles = {
    high: 'border-rose-200 text-rose-700 bg-rose-50',
    medium: 'border-amber-200 text-amber-700 bg-amber-50',
    low: 'border-indigo-200 text-indigo-700 bg-indigo-50'
  };

  const severityDot = {
    high: 'bg-rose-500',
    medium: 'bg-amber-500',
    low: 'bg-indigo-500'
  };

  const severityKey = getSeverityKey(risk.severity);

  return (
    <div 
      className="perspective-1000 w-full h-48 sm:h-56 cursor-pointer group touch-manipulation"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
        {/* Front Side */}
        <div className={`absolute inset-0 backface-hidden border-2 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 flex flex-col justify-between shadow-lg ${severityStyles[severityKey]} glass-panel`}>
          <div>
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full animate-pulse ${severityDot[severityKey]}`}></div>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-60">
                {severityKey === 'high' ? 'Критическая Угроза' : 'Внимание'}
              </span>
            </div>
            <h3 className="text-sm sm:text-base lg:text-lg font-extrabold text-[#111C57] leading-tight mb-1 sm:mb-2">{risk.title}</h3>
            <p className="text-xs sm:text-sm opacity-80 line-clamp-2 leading-relaxed">{risk.description}</p>
          </div>
          <div className="text-[9px] sm:text-[10px] font-bold text-[#111C57]/40 uppercase flex justify-between items-center">
             <span>Подробнее ➔</span>
             <span className="font-mono hidden sm:inline">{risk.matrixReference}</span>
          </div>
        </div>

        {/* Back Side */}
        <div className={`absolute inset-0 backface-hidden rotate-y-180 border-2 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 flex flex-col justify-between bg-white border-indigo-100 shadow-2xl overflow-y-auto`}>
          <div>
            <h4 className="text-[9px] sm:text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 sm:mb-3">Совет Блондинки</h4>
            <p className="text-xs sm:text-sm text-[#111C57] font-medium leading-relaxed">{risk.suggestion}</p>
          </div>
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-indigo-50 text-[9px] sm:text-[10px] text-indigo-300 font-bold uppercase">
             Вернуться к риску ➔
          </div>
        </div>
      </div>

      <style jsx>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default RiskCard;
