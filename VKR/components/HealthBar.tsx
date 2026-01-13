
import React from 'react';
import { getScoreZone, SCORE_ZONES } from '../gameStructure';

interface HealthBarProps {
  score: number; // Используем score вместо health
  maxScore?: number; // Максимальный балл (1000)
}

const HealthBar: React.FC<HealthBarProps> = ({ score, maxScore = 1000 }) => {
  const zone = getScoreZone(score);
  const percentage = Math.min(100, (score / maxScore) * 100);

  const getColor = () => {
    if (zone.color === 'emerald') return 'bg-emerald-500';
    if (zone.color === 'amber') return 'bg-amber-500';
    return 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)]';
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex justify-between items-end mb-2 px-1">
        <span className="text-xs font-black text-[#111C57] uppercase tracking-widest opacity-60">Юридическое здоровье</span>
        <span className="text-2xl font-black text-[#111C57] italic">{score}/{maxScore}</span>
      </div>
      <div className="h-8 w-full bg-indigo-50 rounded-2xl border-2 border-indigo-100 p-1 overflow-hidden shadow-sm">
        <div 
          className={`h-full ${getColor()} hp-bar-transition rounded-xl relative`}
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent"></div>
        </div>
      </div>
      <div className="mt-2 px-1">
        <div className={`text-xs font-bold ${zone.color === 'emerald' ? 'text-emerald-600' : zone.color === 'amber' ? 'text-amber-600' : 'text-rose-600'}`}>
          {zone.description || zone.name}
        </div>
      </div>
    </div>
  );
};

export default HealthBar;
