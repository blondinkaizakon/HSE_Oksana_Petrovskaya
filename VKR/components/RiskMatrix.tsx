import React from 'react';
import { Risk } from '../types';

interface RiskMatrixProps {
  risks: Risk[];
}

const RiskMatrix: React.FC<RiskMatrixProps> = ({ risks }) => {
  // Позиционируем риски на матрице (вероятность vs влияние)
  // Для простоты используем severity как влияние, а порядок как вероятность
  const getRiskPosition = (risk: Risk, index: number) => {
    const normalizeSeverity = (s: string) => s.toLowerCase();
    const severityMap: Record<string, number> = { high: 3, medium: 2, low: 1 };
    const impact = severityMap[normalizeSeverity(risk.severity)] || 1;
    const probability = Math.min(3, Math.max(1, Math.ceil((index + 1) / Math.max(1, risks.length / 3))));
    
    // Координаты на сетке 3x3 (0-2 для каждой оси)
    const x = probability - 1;
    const y = 2 - (impact - 1); // Инвертируем Y, чтобы HIGH был сверху
    
    return { x, y, impact, probability };
  };

  const riskPositions = risks.map((risk, index) => ({
    ...risk,
    ...getRiskPosition(risk, index)
  }));

  // Создаем сетку для матрицы (адаптивная)
  const gridSize = 3;
  // Используем CSS для адаптивности вместо проверки window
  // Базовые размеры для мобильных, увеличиваются на больших экранах через CSS
  const cellSizeBase = 80; // Базовый размер для мобильных
  const paddingBase = 40;
  const totalSizeBase = gridSize * cellSizeBase + paddingBase * 2;

  // Цвета зон матрицы
  const getZoneColor = (x: number, y: number) => {
    const sum = x + (2 - y); // Инвертируем Y
    if (sum >= 4) return 'bg-rose-100 border-rose-300';
    if (sum >= 3) return 'bg-amber-100 border-amber-300';
    return 'bg-emerald-100 border-emerald-300';
  };

  return (
    <div className="w-full bg-white rounded-2xl border-2 border-indigo-100 p-3 sm:p-4 md:p-6 overflow-x-auto">
      <h4 className="text-base sm:text-lg md:text-xl font-black text-[#111C57] mb-3 sm:mb-4" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
        Матрица рисков
      </h4>
      
      <div className="relative mx-auto" style={{ 
        width: '100%', 
        maxWidth: totalSizeBase, 
        minWidth: 280,
        height: totalSizeBase,
        margin: '0 auto'
      }}>
        {/* Сетка матрицы */}
        {Array.from({ length: gridSize }).map((_, row) =>
          Array.from({ length: gridSize }).map((_, col) => (
            <div
              key={`${row}-${col}`}
              className={`absolute border-2 ${getZoneColor(col, row)}`}
              className="sm:w-[100px] sm:h-[100px] md:w-[120px] md:h-[120px]"
              style={{
                left: `calc(${paddingBase}px + ${col} * ${cellSizeBase}px)`,
                top: `calc(${paddingBase}px + ${row} * ${cellSizeBase}px)`,
                width: cellSizeBase,
                height: cellSizeBase
              }}
            />
          ))
        )}

        {/* Риски на матрице */}
        {riskPositions.map((risk, index) => {
          const normalizeSeverity = (s: string) => s.toLowerCase();
          const severityColors: Record<string, string> = {
            high: 'bg-rose-500',
            medium: 'bg-amber-500',
            low: 'bg-indigo-500'
          };
          
          const x = paddingBase + risk.x * cellSizeBase + cellSizeBase / 2;
          const y = paddingBase + risk.y * cellSizeBase + cellSizeBase / 2;
          const severityKey = normalizeSeverity(risk.severity);

          return (
            <div
              key={risk.id}
              className={`absolute ${severityColors[severityKey] || severityColors.low} rounded-full w-8 h-8 border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform`}
              style={{
                left: x - 16,
                top: y - 16,
                zIndex: 10
              }}
              title={risk.title}
            >
              <div className="flex items-center justify-center h-full text-white font-bold text-xs">
                {index + 1}
              </div>
            </div>
          );
        })}

        {/* Оси и подписи */}
        <div
          className="absolute text-xs sm:text-sm font-bold text-gray-600"
          style={{
            left: `calc(${paddingBase}px + ${gridSize} * ${cellSizeBase}px / 2 - 60px)`,
            top: `calc(${paddingBase}px + ${gridSize} * ${cellSizeBase}px + 15px)`,
            width: '120px',
            textAlign: 'center'
          }}
        >
          Вероятность →
        </div>
        
        <div
          className="absolute text-xs sm:text-sm font-bold text-gray-600 transform -rotate-90"
          style={{
            left: '5px',
            top: `calc(${paddingBase}px + ${gridSize} * ${cellSizeBase}px / 2 - 40px)`,
            width: '80px',
            textAlign: 'center'
          }}
        >
          Влияние ↑
        </div>

        {/* Легенда */}
        <div className="absolute bottom-0 left-0 right-0 flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6 mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-gray-200">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-rose-500 rounded-full border border-white"></div>
            <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Высокий</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-amber-500 rounded-full border border-white"></div>
            <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Средний</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-indigo-500 rounded-full border border-white"></div>
            <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Низкий</span>
          </div>
        </div>
      </div>

      {/* Список рисков с номерами */}
      <div className="mt-4 sm:mt-6 space-y-2">
        <div className="text-xs sm:text-sm font-bold text-gray-700 mb-2">Риски на матрице:</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {riskPositions.map((risk, index) => {
            const normalizeSeverity = (s: string) => s.toLowerCase();
            const severityKey = normalizeSeverity(risk.severity);
            return (
            <div key={risk.id} className="flex items-start gap-2 text-xs sm:text-sm">
              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${
                severityKey === 'high' ? 'bg-rose-500' :
                severityKey === 'medium' ? 'bg-amber-500' : 'bg-indigo-500'
              }`}>
                {index + 1}
              </div>
              <span className="text-gray-700 break-words leading-snug">{risk.title}</span>
            </div>
          );
          })}
        </div>
      </div>
    </div>
  );
};

export default RiskMatrix;

