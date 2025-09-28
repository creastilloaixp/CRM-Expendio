import React, { useState, useRef, useEffect } from 'react';
import type { Visita, Message } from '../types';
import { getInsights } from '../services/geminiService';
import { Button } from './common/Button';

// New component for rendering markdown safely and dynamically
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const [html, setHtml] = useState('');

    useEffect(() => {
        let isMounted = true;
        // Dynamically import marked to prevent top-level load errors
        import('marked').then(({ marked }) => {
            // marked.parse can be async, so we handle it as a promise
            Promise.resolve(marked.parse(content, { gfm: true, breaks: true }))
              .then(parsedHtml => {
                if (isMounted && typeof parsedHtml === 'string') {
                    setHtml(parsedHtml);
                }
            }).catch(err => console.error("Failed to parse markdown", err));
        });
        return () => { isMounted = false; };
    }, [content]);

    // Render the parsed HTML
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

interface AIAssistantProps {
  visits: Visita[];
}

const SuggestionChip: React.FC<{ text: string, onClick: (text: string) => void }> = ({ text, onClick }) => (
    <button
        onClick={() => onClick(text)}
        className="px-3 py-1 bg-expendio-teal/10 text-expendio-teal text-sm rounded-full hover:bg-expendio-teal/20 transition-colors"
    >
        {text}
    </button>
);

const AIAssistant: React.FC<AIAssistantProps> = ({ visits }) => {
  const [messages, setMessages] = useState<Message[]>([
      { role: 'model', content: '¡Hola! Soy tu asistente de datos. Pregúntame lo que quieras saber sobre las visitas en este reporte.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      const aiResponse = await getInsights(visits, input);
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
    <div className="mt-8 p-4 bg-gray-50 rounded-lg border">
      <h3 className="text-xl font-bold text-expendio-dark mb-4 text-center">Analista de Datos AI</h3>
      <div className="h-80 bg-white rounded-md border p-4 overflow-y-auto flex flex-col space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg ${
                msg.role === 'user' ? 'bg-expendio-teal text-white' : 'bg-gray-200 text-expendio-dark'
              }`}
            >
              <MarkdownRenderer content={msg.content} />
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                 <div className="max-w-xs p-3 rounded-lg bg-gray-200 text-expendio-dark">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{animationDelay: '0s'}}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="mt-4 flex flex-col space-y-3">
        <div className="flex flex-wrap gap-2 justify-center">
            <SuggestionChip text="¿Cuáles son las horas pico?" onClick={handleSuggestionClick} />
            <SuggestionChip text="¿Quiénes son nuestros clientes más frecuentes?" onClick={handleSuggestionClick} />
            <SuggestionChip text="¿Cuál es el consumo promedio?" onClick={handleSuggestionClick} />
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Escribe tu pregunta aquí..."
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

export default AIAssistant;