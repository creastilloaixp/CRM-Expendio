import React, { useState } from 'react';
import { Button } from './common/Button';
import type { VIPLevel } from '../services/prizeService';
import { VIP_INFO } from '../services/prizeService';

export interface Prize {
  id: string;
  name: string;
  icon: string;
  color: string;
  probability: number;
}

interface SpinWheelProps {
  prizes?: Prize[];
  onSpinComplete: (prize: Prize) => void;
  disabled?: boolean;
  vipLevel?: VIPLevel;
}

const DEFAULT_PRIZES: Prize[] = [
  { id: 'bebida', name: 'Bebida Gratis', icon: '🍺', color: '#FF8C42', probability: 10 },
  { id: 'postre', name: 'Postre Cortesía', icon: '🍰', color: '#FFD93D', probability: 10 },
  { id: 'descuento10', name: '10% Descuento', icon: '💰', color: '#6BCF7F', probability: 15 },
  { id: '2x1', name: '2x1 Próxima Visita', icon: '🎁', color: '#FF6B9D', probability: 10 },
  { id: 'puntos', name: '20 Puntos Extra', icon: '⭐', color: '#FFC837', probability: 20 },
  { id: 'shot', name: 'Shot Sorpresa', icon: '🥃', color: '#D4A574', probability: 10 },
  { id: 'suerte', name: '¡Próxima vez!', icon: '🍀', color: '#95A5A6', probability: 25 },
];

const SpinWheel: React.FC<SpinWheelProps> = ({
  prizes = DEFAULT_PRIZES,
  onSpinComplete,
  disabled = false,
  vipLevel = 'bronce'
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);

  const vipInfo = VIP_INFO[vipLevel];

  const selectPrizeByProbability = (): Prize => {
    const totalProb = prizes.reduce((sum, p) => sum + p.probability, 0);
    let random = Math.random() * totalProb;

    for (const prize of prizes) {
      random -= prize.probability;
      if (random <= 0) return prize;
    }
    return prizes[prizes.length - 1];
  };

  const handleSpin = () => {
    if (isSpinning || disabled) return;

    setIsSpinning(true);

    const prize = selectPrizeByProbability();
    const prizeIndex = prizes.findIndex(p => p.id === prize.id);
    const segmentAngle = 360 / prizes.length;
    const prizeAngle = prizeIndex * segmentAngle;

    // 5-8 vueltas + posición del premio
    const spins = 5 + Math.random() * 3;
    const finalRotation = rotation + (spins * 360) + (360 - prizeAngle) - (segmentAngle / 2);

    setRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      onSpinComplete(prize);
    }, 4500);
  };

  const segmentAngle = 360 / prizes.length;

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Badge de nivel VIP */}
      {vipLevel !== 'bronce' && (
        <div
          className="px-6 py-3 rounded-full font-bold text-white shadow-2xl animate-pulse"
          style={{
            backgroundColor: vipInfo.color,
            boxShadow: `0 0 20px ${vipInfo.color}80`
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">{vipInfo.icon}</span>
            <span className="text-lg">Cliente {vipInfo.name}</span>
          </div>
          <p className="text-xs text-center opacity-90 mt-1">¡Mejores probabilidades!</p>
        </div>
      )}

      {/* Marco de la ruleta - estilo cervecería */}
      <div className="relative">
        {/* Título decorativo */}
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 text-center z-20">
          <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 via-orange-500 to-yellow-600 drop-shadow-lg" style={{ fontFamily: 'Impact, sans-serif' }}>
            RULETA EXPENDIO
          </h3>
        </div>

        {/* Indicador - estilo flecha de bar */}
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-20">
          <div className="relative">
            <div
              className="text-6xl drop-shadow-2xl"
              style={{
                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))',
                color: '#8B4513'
              }}
            >
              ▼
            </div>
          </div>
        </div>

        {/* Marco exterior decorativo - madera */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none z-10"
          style={{
            width: '320px',
            height: '320px',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(135deg, #8B4513 0%, #654321 50%, #8B4513 100%)',
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5), 0 10px 40px rgba(0,0,0,0.3)',
            border: '8px solid #654321'
          }}
        >
          {/* Tornillos decorativos */}
          {[0, 90, 180, 270].map((deg) => (
            <div
              key={deg}
              className="absolute w-4 h-4 bg-gray-700 rounded-full"
              style={{
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-150px)`,
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                border: '1px solid #555'
              }}
            />
          ))}
        </div>

        {/* Ruleta principal */}
        <div
          className="relative rounded-full"
          style={{
            width: '288px',
            height: '288px',
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? 'transform 4.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
            transformOrigin: 'center',
            boxShadow: '0 15px 50px rgba(0,0,0,0.4), inset 0 0 20px rgba(0,0,0,0.2)'
          }}
        >
          {/* Segmentos de la ruleta */}
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              {prizes.map((prize, i) => (
                <linearGradient key={`grad-${i}`} id={`gradient-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: prize.color, stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: prize.color, stopOpacity: 0.8 }} />
                </linearGradient>
              ))}
            </defs>
            {prizes.map((prize, index) => {
              const startAngle = (index * segmentAngle - 90) * (Math.PI / 180);
              const endAngle = ((index + 1) * segmentAngle - 90) * (Math.PI / 180);
              const largeArc = segmentAngle > 180 ? 1 : 0;

              const x1 = 50 + 45 * Math.cos(startAngle);
              const y1 = 50 + 45 * Math.sin(startAngle);
              const x2 = 50 + 45 * Math.cos(endAngle);
              const y2 = 50 + 45 * Math.sin(endAngle);

              return (
                <path
                  key={prize.id}
                  d={`M 50 50 L ${x1} ${y1} A 45 45 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={`url(#gradient-${index})`}
                  stroke="#2C1810"
                  strokeWidth="0.5"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                  }}
                />
              );
            })}
          </svg>

          {/* Iconos y texto en cada segmento */}
          {prizes.map((prize, index) => {
            const angle = index * segmentAngle + segmentAngle / 2 - 90;
            const iconRadius = 28;
            const textRadius = 36;
            const iconX = 50 + iconRadius * Math.cos(angle * Math.PI / 180);
            const iconY = 50 + iconRadius * Math.sin(angle * Math.PI / 180);
            const textX = 50 + textRadius * Math.cos(angle * Math.PI / 180);
            const textY = 50 + textRadius * Math.sin(angle * Math.PI / 180);

            return (
              <React.Fragment key={`content-${prize.id}`}>
                {/* Icono */}
                <div
                  className="absolute text-4xl transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${iconX}%`,
                    top: `${iconY}%`,
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                  }}
                >
                  {prize.icon}
                </div>
              </React.Fragment>
            );
          })}

          {/* Centro - logo expendio */}
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center"
            style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.4), inset 0 2px 8px rgba(255,255,255,0.4)',
              border: '4px solid #8B4513'
            }}
          >
            <div className="text-center">
              <div className="text-3xl mb-1">🍺</div>
              <div className="text-xs font-bold text-amber-900">GIRA</div>
            </div>
          </div>
        </div>
      </div>

      {/* Botón de girar - estilo cervecero */}
      <Button
        onClick={handleSpin}
        disabled={isSpinning || disabled}
        className="px-10 py-5 text-2xl font-black rounded-xl transform transition-all duration-200 hover:scale-105 disabled:scale-100"
        style={{
          background: isSpinning
            ? 'linear-gradient(135deg, #666 0%, #444 100%)'
            : 'linear-gradient(135deg, #FF8C42 0%, #FF6B35 100%)',
          boxShadow: isSpinning
            ? 'inset 0 4px 8px rgba(0,0,0,0.3)'
            : '0 8px 20px rgba(255, 107, 53, 0.4), inset 0 -2px 8px rgba(0,0,0,0.2)',
          border: '3px solid #8B4513',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          color: 'white'
        }}
      >
        {isSpinning ? (
          <span className="flex items-center gap-3">
            <span className="animate-spin">🎰</span>
            <span>GIRANDO...</span>
          </span>
        ) : (
          <span className="flex items-center gap-3">
            <span>🍺</span>
            <span>¡GIRA Y GANA!</span>
            <span>🍺</span>
          </span>
        )}
      </Button>

      {/* Texto decorativo */}
      {!isSpinning && (
        <p className="text-sm text-gray-600 text-center max-w-xs animate-pulse">
          ✨ Prueba tu suerte y gana increíbles premios ✨
        </p>
      )}
    </div>
  );
};

export { DEFAULT_PRIZES };
export default SpinWheel;
