import React, { useState } from 'react';
import { Card } from './common/Card';
import { Button } from './common/Button';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);

  const slides = [
    {
      emoji: '🎉',
      title: '¡Bienvenido a Expendio!',
      description: 'Tu experiencia gastronómica comienza aquí. Disfruta de la mejor comida y bebidas con tecnología de punta.',
      highlight: 'Primera visita = 50 puntos de regalo'
    },
    {
      emoji: '⭐',
      title: 'Acumula Puntos',
      description: 'Cada persona que traigas suma 10 puntos. Por cada 100 puntos, obtén $50 MXN de descuento en tu próxima cuenta.',
      highlight: '10 puntos por persona'
    },
    {
      emoji: '📱',
      title: 'Menú Digital',
      description: 'Consulta nuestro menú completo, llama a un mesero o pide tu cuenta directamente desde tu celular.',
      highlight: 'Todo desde tu teléfono'
    },
    {
      emoji: '🎁',
      title: 'Promociones Exclusivas',
      description: 'Recibe ofertas especiales, descuentos en tu cumpleaños y promociones solo para miembros.',
      highlight: '¡Ofertas solo para ti!'
    }
  ];

  const currentSlide = slides[step - 1];

  const handleNext = () => {
    if (step < slides.length) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-expendio-teal to-expendio-dark z-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <div className="p-8 text-center">
          {/* Indicadores de paso */}
          <div className="flex justify-center gap-2 mb-6">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index + 1 === step
                    ? 'w-8 bg-expendio-teal'
                    : index + 1 < step
                    ? 'w-2 bg-expendio-teal'
                    : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Contenido del slide */}
          <div className="mb-8">
            <div className="text-7xl mb-4 animate-bounce">{currentSlide.emoji}</div>
            <h2 className="text-3xl font-bold text-expendio-dark mb-3">
              {currentSlide.title}
            </h2>
            <p className="text-gray-600 text-lg mb-4">
              {currentSlide.description}
            </p>
            <div className="bg-expendio-light rounded-lg p-4 inline-block">
              <p className="text-expendio-teal font-bold">
                {currentSlide.highlight}
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            {step < slides.length && (
              <Button
                variant="secondary"
                onClick={handleSkip}
                className="flex-1"
              >
                Saltar
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handleNext}
              className="flex-1"
            >
              {step < slides.length ? 'Siguiente' : '¡Empezar!'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Onboarding;
