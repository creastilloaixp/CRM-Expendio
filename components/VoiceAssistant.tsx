import React from 'react';
import { Card } from './common/Card';

const MicIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 opacity-40" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.39-.98.88C16.58 14.83 14.48 17 12 17s-4.58-2.17-4.93-5.12c-.08-.49-.49-.88-.98-.88s-.9.39-.88.98C5.58 15.99 8.51 19 12 19s6.42-3.01 6.8-7.12c.02-.49-.37-.98-.88-.98z"/>
    </svg>
);

const VoiceAssistant: React.FC = () => {
    return (
        <Card className="max-w-3xl mx-auto">
            <div className="p-12 flex flex-col items-center text-center">
                <MicIcon />
                <h2 className="text-2xl font-bold text-expendio-dark mt-6 mb-3">
                    Asistente de Voz
                </h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
                    <p className="text-gray-700 mb-2">
                        🚧 <strong>Próximamente disponible</strong>
                    </p>
                    <p className="text-gray-600 text-sm">
                        La funcionalidad de asistente de voz está temporalmente deshabilitada
                        mientras actualizamos el SDK de IA a la versión más estable.
                    </p>
                    <p className="text-gray-600 text-sm mt-3">
                        Mientras tanto, puedes usar el <strong>AI Assistant</strong> en la
                        sección de Analytics para hacer preguntas sobre tus datos.
                    </p>
                </div>
                <button
                    onClick={() => window.location.hash = '/analytics'}
                    className="mt-6 px-6 py-3 bg-expendio-teal text-white rounded-lg hover:bg-expendio-teal/90 transition-colors"
                >
                    Ir a Analytics (AI Assistant)
                </button>
            </div>
        </Card>
    );
};

export default VoiceAssistant;
