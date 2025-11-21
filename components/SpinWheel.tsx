import React, { useState, useRef } from 'react';
import { Button } from './common/Button';

export interface Prize {
  id: string;
  name: string;
  icon: string;
  color: string;
  probability: number; // 0-100
}

interface SpinWheelProps {
  prizes: Prize[];
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
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

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
    setSelectedPrize(null);

    const prize = selectPrizeByProbability();
    const prizeIndex = prizes.findIndex(p => p.id === prize.id);

    // Calcular rotación para que el premio quede arriba (en el indicador)
    const segmentAngle = 360 / prizes.length;
    const prizeAngle = prizeIndex * segmentAngle;

    // Girar múltiples vueltas + posición del premio
    const spins = 5 + Math.random() * 3; // 5-8 vueltas
    const finalRotation = rotation + (spins * 360) + (360 - prizeAngle) - (segmentAngle / 2);

    setRotation(finalRotation);

    // Esperar a que termine la animación
    setTimeout(() => {
      setIsSpinning(false);
      setSelectedPrize(prize);
      onSpinComplete(prize);
    }, 4000);
  };

  const segmentAngle = 360 / prizes.length;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Indicador */}
      <div className="relative">
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
          <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-expendio-red drop-shadow-lg" />
        </div>

        {/* Ruleta */}
        <div
          ref={wheelRef}
          className="relative w-72 h-72 rounded-full shadow-2xl overflow-hidden border-4 border-expendio-dark"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
          }}
        >
          {prizes.map((prize, index) => {
            const startAngle = index * segmentAngle;
            const endAngle = startAngle + segmentAngle;

            // Crear segmento con CSS conic-gradient
            return (
              <div
                key={prize.id}
                className="absolute w-full h-full flex items-center justify-center"
                style={{
                  clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((startAngle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((startAngle - 90) * Math.PI / 180)}%, ${50 + 50 * Math.cos((endAngle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((endAngle - 90) * Math.PI / 180)}%)`,
                  backgroundColor: prize.color,
                }}
              >
                <span
                  className="absolute text-2xl"
                  style={{
                    transform: `rotate(${startAngle + segmentAngle / 2}deg) translateY(-90px)`,
                    transformOrigin: 'center center'
                  }}
                >
                  {prize.icon}
                </span>
              </div>
            );
          })}

          {/* Centro de la ruleta */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-expendio-dark">
            <span className="text-2xl">🎰</span>
          </div>
        </div>
      </div>

      {/* Botón de girar */}
      <Button
        onClick={handleSpin}
        disabled={isSpinning || disabled}
        className="px-8 py-4 text-xl font-bold"
      >
        {isSpinning ? '🎰 Girando...' : '🎯 ¡GIRAR RULETA!'}
      </Button>

      {/* Premio seleccionado */}
      {selectedPrize && !isSpinning && (
        <div className="text-center animate-bounce">
          <p className="text-lg text-gray-600">¡Ganaste!</p>
          <p className="text-3xl font-bold text-expendio-dark">
            {selectedPrize.icon} {selectedPrize.name}
          </p>
        </div>
      )}
    </div>
  );
};

export { DEFAULT_PRIZES };
export default SpinWheel;
