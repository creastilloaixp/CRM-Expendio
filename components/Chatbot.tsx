import React, { useState, useRef, useEffect } from 'react';
import type { Message, Mesa, Reserva } from '../types';
import type { Chat } from '@google/genai';
import { createChat } from '../services/geminiService';
import { getMesas, getUpcomingReservations } from '../services/api';
import { supabase } from '../services/supabaseClient';
import { Button } from './common/Button';
import { Card } from './common/Card';

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

const SuggestionChip: React.FC<{ text: string, onClick: (text: string) => void }> = ({ text, onClick }) => (
    <button
        onClick={() => onClick(text)}
        className="px-3 py-1 bg-expendio-teal/10 text-expendio-teal text-sm rounded-full hover:bg-expendio-teal/20 transition-colors"
    >
        {text}
    </button>
);

const Chatbot: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', content: '¡Hola! 👋 Soy el asistente virtual de **Expendio Cervecería Popular**. Tengo acceso en tiempo real al estado del restaurante. ¿En qué puedo ayudarte?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mesas, setMesas] = useState<Mesa[]>([]);
    const [reservas, setReservas] = useState<Reserva[]>([]);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Cargar datos en tiempo real
    useEffect(() => {
        const loadData = async () => {
            const { data: mesasData } = await getMesas();
            const { data: reservasData } = await getUpcomingReservations();
            if (mesasData) setMesas(mesasData);
            if (reservasData) setReservas(reservasData);
        };
        loadData();

        // 🔄 Realtime Subscriptions en lugar de polling
        const mesasChannel = supabase
            .channel('chatbot-mesas')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'mesas'
                },
                () => {
                    console.log('🔄 Realtime: Cambio en mesas');
                    getMesas().then(({ data }) => data && setMesas(data));
                }
            )
            .subscribe();

        const reservasChannel = supabase
            .channel('chatbot-reservas')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'reservas'
                },
                () => {
                    console.log('🔄 Realtime: Cambio en reservas');
                    getUpcomingReservations().then(({ data }) => data && setReservas(data));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(mesasChannel);
            supabase.removeChannel(reservasChannel);
        };
    }, []);

    useEffect(() => {
        const initChat = async () => {
          try {
            const mesasLibres = mesas.filter(m => m.estado === 'Libre').length;
            const mesasOcupadas = mesas.filter(m => m.estado === 'Ocupada').length;
            const mesasReservadas = mesas.filter(m => m.estado === 'Reservada').length;

            const systemInstruction = `Eres el asistente virtual inteligente de 'Expendio Cervecería Popular', un restaurante de cervezas artesanales y comida de calidad.

## INFORMACIÓN DEL RESTAURANTE

**Ubicación**: Querétaro, México

**Horarios**:
- Lunes a Jueves: 2:00 PM - 11:00 PM
- Viernes y Sábado: 2:00 PM - 1:00 AM
- Domingo: 2:00 PM - 10:00 PM

**Menú Destacado**:
- 🍺 Cervezas Artesanales: IPA, Stout, Lager, Amber, Pilsner (de barriles locales)
- 🍔 Hamburguesas Gourmet: Clásica, BBQ, Hawaiana, Vegana
- 🌮 Tacos Fusion: Pastor, Arrachera, Pescado, Gobernador
- 🍟 Entradas: Alitas, Nachos, Papas Gourmet, Dedos de Queso
- 🥗 Ensaladas: César, Mediterránea, Tropical

**Estado Actual en Tiempo Real**:
- Total de mesas: ${mesas.length}
- Mesas disponibles: ${mesasLibres}
- Mesas ocupadas: ${mesasOcupadas}
- Mesas reservadas: ${mesasReservadas}
- Reservas confirmadas hoy: ${reservas.length}

## TU COMPORTAMIENTO

**Personalidad**: Amigable, servicial, conocedor, casual pero profesional

**Puedes**:
- Informar sobre el menú y hacer recomendaciones personalizadas
- Dar horarios de apertura y cierre
- Informar disponibilidad de mesas EN TIEMPO REAL
- Explicar cómo funciona el sistema de reservaciones
- Responder sobre ubicación y contacto
- Sugerir maridajes de cervezas con platillos
- Dar información nutricional general

**NO puedes**:
- Hacer reservaciones directamente (informa que deben contactar al personal o usar el sistema)
- Procesar pagos
- Modificar o cancelar reservas existentes
- Dar información sobre pedidos en curso

**Formato**:
- Usa emojis para hacer las respuestas más amigables
- Usa markdown (**, *, listas) para mejor formato
- Sé conciso pero completo
- Pregunta para clarificar si necesitas más info
- Siempre termina sugiriendo el siguiente paso

**Ejemplos de respuesta**:
- Si preguntan disponibilidad: "¡Claro! 😊 Tenemos **${mesasLibres} mesas disponibles** ahora mismo. ¿Para cuántas personas?"
- Si preguntan por recomendaciones: "¡Excelente elección! 🍺 Te recomiendo nuestra **IPA** que combina perfectamente con la **Hamburguesa BBQ**."
- Si preguntan por reservas: "Para hacer una reserva, el personal puede ayudarte desde el sistema 📱. ¿Para qué día y hora te gustaría?"`;

            chatRef.current = await createChat(systemInstruction);
          } catch (e) {
            setMessages(prev => [...prev, { role: 'model', content: 'No se pudo iniciar el chat. Por favor, intenta de nuevo más tarde.' }]);
          }
        };
        if (mesas.length > 0) {
            initChat();
        }
    }, [mesas, reservas]);

    useEffect(scrollToBottom, [messages]);
    
    const handleSend = async () => {
        if (!input.trim() || isLoading || !chatRef.current) return;
    
        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
    
        try {
          const stream = await chatRef.current.sendMessageStream({ message: input });
          
          let modelResponse = '';
          setMessages(prev => [...prev, { role: 'model', content: '...' }]);

          for await (const chunk of stream) {
            modelResponse += chunk.text;
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].content = modelResponse;
                return newMessages;
            });
          }
        } catch (error) {
          const errorMessage: Message = { role: 'model', content: "Hubo un error al contactar al asistente. Inténtalo más tarde." };
          setMessages(prev => [...prev, errorMessage]);
        } finally {
          setIsLoading(false);
        }
    };
    
    const suggestionChips = [
        "¿Tienen mesas disponibles ahora?",
        "¿Qué cervezas artesanales tienen?",
        "Recomiéndame un platillo",
        "¿Cuál es el horario de hoy?",
        "¿Cómo hago una reservación?",
        "Mejor maridaje cerveza-platillo"
    ];

    const mesasLibres = mesas.filter(m => m.estado === 'Libre').length;

    return (
        <Card className="max-w-3xl mx-auto">
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-expendio-dark">Chatbot Inteligente</h2>
                    <div className="flex items-center gap-2">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            🟢 En vivo
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {mesasLibres} mesas libres
                        </span>
                    </div>
                </div>
                 <div className="h-96 bg-white rounded-md border p-4 overflow-y-auto flex flex-col space-y-4">
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
                    {isLoading && messages[messages.length -1].role !== 'model' && (
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
                        {suggestionChips.map((text, i) => (
                            <SuggestionChip key={i} text={text} onClick={(t) => setInput(t)} />
                        ))}
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
        </Card>
    );
};

export default Chatbot;
