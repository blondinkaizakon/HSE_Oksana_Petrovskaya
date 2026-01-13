
import React from 'react';
import { AvatarState } from '../types';

interface AvatarProps {
  state: AvatarState;
  size?: 'small' | 'medium' | 'large';
  avatarUrl?: string; // URL или base64 изображения профиля
}

const Avatar: React.FC<AvatarProps> = ({ state, size = 'large', avatarUrl }) => {
  const sizeClasses = {
    small: 'w-16 h-16 text-2xl',
    medium: 'w-24 h-24 text-4xl',
    large: 'w-32 h-32 text-5xl'
  };

  const getAvatarConfig = () => {
    switch (state) {
      case AvatarState.ANALYZING:
        return {
          emoji: '🧐',
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-400',
          accessory: '👓',
          label: 'Анализ...',
          image: '👩‍💼'
        };
      case AvatarState.DANGER:
        return {
          emoji: '🤨',
          bgColor: 'bg-rose-50',
          borderColor: 'border-rose-400',
          accessory: '🔥',
          label: 'Опасно!',
          image: '👩‍💼'
        };
      case AvatarState.SUCCESS:
        return {
          emoji: '💅',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-400',
          accessory: '✨',
          label: 'Идеально',
          image: '👩‍💼'
        };
      default:
        return {
          emoji: '👩‍💼',
          bgColor: 'bg-white',
          borderColor: 'border-indigo-200',
          accessory: '',
          label: 'Мой профиль',
          image: '👩‍💼'
        };
    }
  };

  const config = getAvatarConfig();
  const isSmall = size === 'small';

  // Анимации для маленького аватара в зависимости от состояния
  const getSmallAvatarAnimation = () => {
    if (isSmall) {
      switch (state) {
        case AvatarState.ANALYZING:
          return 'animate-pulse';
        case AvatarState.DANGER:
          return 'animate-shake';
        case AvatarState.SUCCESS:
          return 'animate-bounce';
        default:
          return '';
      }
    }
    return '';
  };

  // Статичное изображение профиля для большого аватара (без анимации float)
  const ProfileImage = () => (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 overflow-hidden">
      {avatarUrl ? (
        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
      ) : (
        <svg viewBox="0 0 100 100" className="w-3/4 h-3/4">
          {/* Голова */}
          <circle cx="50" cy="40" r="25" fill="#fdbcb4" stroke="#e89a91" strokeWidth="1.5"/>
          
          {/* Волосы (блонд) */}
          <path d="M 30 35 Q 25 15, 35 12 Q 45 10, 55 12 Q 65 10, 70 15 Q 72 25, 70 35" 
                fill="#ffd700" stroke="#ffc700" strokeWidth="1.5"/>
          
          {/* Глаза */}
          <circle cx="42" cy="38" r="2.5" fill="#654321"/>
          <circle cx="58" cy="38" r="2.5" fill="#654321"/>
          
          {/* Улыбка */}
          <path d="M 42 45 Q 50 50, 58 45" stroke="#654321" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          
          {/* Тело (деловой костюм - черный пиджак, белая рубашка) */}
          <rect x="40" y="65" width="20" height="30" rx="3" fill="#2c2c2c"/>
          <rect x="42" y="67" width="16" height="15" rx="2" fill="#ffffff"/>
        </svg>
      )}
    </div>
  );

  return (
    <div className={`flex flex-col items-center gap-2 ${isSmall ? 'flex-row gap-3' : ''}`}>
      <div className={`relative ${sizeClasses[size]} rounded-full border-4 shadow-xl ${config.borderColor} ${config.bgColor} flex items-center justify-center overflow-hidden transition-all duration-700 ${getSmallAvatarAnimation()}`}>
        {size === 'large' ? (
          <ProfileImage />
        ) : (
          <div className={`text-6xl select-none leading-none transition-transform duration-300 ${
            state === AvatarState.ANALYZING ? 'animate-spin-slow' : 
            state === AvatarState.DANGER ? 'animate-shake' : 
            state === AvatarState.SUCCESS ? 'animate-bounce' : 
            ''
          }`}>
            {state === AvatarState.DANGER ? '🤨' : state === AvatarState.SUCCESS ? '💅' : state === AvatarState.ANALYZING ? '🧐' : '👩‍💼'}
          </div>
        )}
        {config.accessory && !isSmall && (
          <div className="absolute top-2 right-2 text-3xl animate-bounce">
            {config.accessory}
          </div>
        )}
        {state === AvatarState.ANALYZING && !isSmall && (
          <div className="absolute inset-0 bg-indigo-500/5 flex items-center justify-center">
            <div className="w-full h-2 bg-indigo-400/30 animate-[pulse_1s_infinite]"></div>
          </div>
        )}
      </div>
      {!isSmall && (
        <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide border-2 ${config.borderColor} bg-white text-[#111C57]`}>
          {config.label}
        </span>
      )}
    </div>
  );
};

export default Avatar;
