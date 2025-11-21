import React, { useState } from 'react';
import { Button } from './common/Button';

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
}

const DEFAULT_PRIZES: Prize[] = [
  { id: 'bebida', name: 'Bebida Gratis', icon: '🍺', color: '#FF6B6B', probability: 10 },
  { id: 'postre', name: 'Postre Cortesía', icon: '🍰', color: '#4ECDC4', probability: 10 },
  { id: 'descuento10', name: '10% Descuento', icon: '💰', color: '#45B7D1', probability: 15 },
  { id: '2x1', name: '2x1 Próxima Visita', icon: '🎁', color: '#96CEB4', probability: 10 },
  { id: 'puntos', name: '20 Puntos Extra', icon: '⭐', color: '#FFEAA7', probability: 20 },
  { id: 'shot', name: 'Shot Sorpresa', icon: '🎉', color: '#DDA0DD', probability: 10 },
  { id: 'suerte', name: '¡Próxima satisfacción!', icon: '🍀', color: '#95A5A6', probability: 25 },
];

const SpinWheel: React.FC<SpinWheelProps> = ({
  prizes = DEFAULT_PRIZES,
  onSpinComplete,
  disabled = false
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);

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
    }, 4000);
  };

  // Crear gradiente cónico para los segmentos
  const segmentAngle = 360 / prizes.length;
  const conicGradient = prizes.map((prize, i) => {
    const start = i * segmentAngle;
    const end = (i + 1) * segmentAngle;
    return `${prize.color} ${start}deg ${end}deg`;
  }).join(', ');

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Indicador */}
      <div className="relative">
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10 text-4xl">
          ▼
        </div>

        {/* Ruleta simplificada con conic-gradient */}
        <div
          className="relative w-64 h-64 rounded-full shadow-2xl border-4 border-gray-800"
          style={{
            background: `conic-gradient(${conicGradient})`,
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
          }}
        >
          {/* Iconos en cada segmento */}
          {prizes.map((prize, index) => {
            const angle = index * segmentAngle + segmentAngle / 2 - 90;
            const radius = 85;
            const x = 50 + radius * Math.cos(angle * Math.PI / 180) / 1.28;
            const y = 50 + radius * Math.sin(angle * Math.PI / 180) / 1.28;

            return (
              <span
                key={prize.id}
                className="absolute text-xl"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {prize.icon}
              </span>
            );
          })}

          {/* Centro */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-gray-800">
            <span className="text-xl">🎰</span>
          </div>
        </div>
      </div>

      {/* Botón */}
      <Button
        onClick={handleSpin}
        disabled={isSpinning || disabled}
        className="px-8 py-4 text-xl font-bold"
      >
        {isSpinning ? '🎰 Girando...' : '🎯 ¡GIRAR!'}
      </Button>
    </div>
  );
};

export { DEFAULT_PRIZES };
export default SpinWheel;
