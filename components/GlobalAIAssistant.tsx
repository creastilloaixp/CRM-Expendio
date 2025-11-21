import React, { useState, useRef, useEffect } from 'react';
import type { Message } from '../types';
import { getInsightsWithFullContext, type AppContext } from '../services/geminiService';
import { Button } from './common/Button';

// Markdown renderer
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const [html, setHtml] = useState('');

    useEffect(() => {
        let isMounted = true;
        import('marked').then(({ marked }) => {
            Promise.resolve(marked.parse(content, { gfm: true, breaks: true }))
              .then(parsedHtml => {
                if (isMounted && typeof parsedHtml === 'string') {
                    setHtml(parsedHtml);
                }
            }).catch(err => console.error("Failed to parse markdown", err));
        });
        return () => { isMounted = false; };
    }, [content]);

    return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
};

interface GlobalAIAssistantProps {
  context: AppContext;
}

const SuggestionChip: React.FC<{ text: string, onClick: (text: string) => void }> = ({ text, onClick }) => (
    <button
        onClick={() => onClick(text)}
        className="px-3 py-1 bg-expendio-teal/10 text-expendio-teal text-sm rounded-full hover:bg-expendio-teal/20 transition-colors"
    >
        {text}
    </button>
);

const GlobalAIAssistant: React.FC<GlobalAIAssistantProps> = ({ context }) => {
  const [messages, setMessages] = useState<Message[]>([
      { role: 'model', content: '¡Hola! Soy el asistente inteligente del restaurante. Tengo acceso a **toda la información en tiempo real**: mesas, reservas, visitas, clientes y notificaciones. ¿En qué puedo ayudarte?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestionChips = [
    "¿Cuál es el estado actual del restaurante?",
    "¿Cuántas mesas tenemos disponibles?",
    "¿Cuáles son las reservas de hoy?",
    "¿Cuánto hemos facturado hoy?",
    "¿Qué notificaciones hay pendientes?",
    "Dame insights sobre nuestros clientes frecuentes"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const aiResponse = await getInsightsWithFullContext(context, input);
      const modelMessage: Message = { role: 'model', content: aiResponse };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      const errorMessage: Message = { role: 'model', content: "Hubo un error al contactar al asistente. Inténtalo más tarde." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (text: string) => {
    setInput(text);
  };

  return (
    <div className="mt-6 p-4 bg-white rounded-lg border-2 border-expendio-teal/20 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🤖</span>
        <h3 className="text-xl font-bold text-expendio-dark">Asistente Inteligente</h3>
        <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
          En tiempo real
        </span>
      </div>

      <div className="h-96 bg-gray-50 rounded-md border p-4 overflow-y-auto flex flex-col space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs md:max-w-md lg:max-w-2xl p-3 rounded-lg ${
                msg.role === 'user' ? 'bg-expendio-teal text-white' : 'bg-white text-expendio-dark border border-gray-200'
              }`}
            >
              <MarkdownRenderer content={msg.content} />
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                 <div className="max-w-xs p-3 rounded-lg bg-white border border-gray-200">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-expendio-teal rounded-full animate-pulse" style={{animationDelay: '0s'}}></div>
                        <div className="w-2 h-2 bg-expendio-teal rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-expendio-teal rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-4 flex flex-col space-y-3">
        <div className="flex flex-wrap gap-2">
            {suggestionChips.map((text, i) => (
                <SuggestionChip key={i} text={text} onClick={handleSuggestionClick} />
            ))}
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pregunta lo que quieras sobre el restaurante..."
            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-expendio-teal focus:border-expendio-teal block w-full p-2.5"
            disabled={isLoading}
            aria-label="Pregunta para el asistente de IA"
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            {isLoading ? '...' : 'Enviar'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GlobalAIAssistant;
