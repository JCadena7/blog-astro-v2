import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    setIsLoading(true);
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim()
    };
    setMessages(msgs => [...msgs, userMessage]);
    setInputValue('');
    try {
      const response = await fetch('/api/chatbot/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: userMessage.content }),
      });
      if (!response.ok) throw new Error('Error en la respuesta del servidor');
      const data = await response.json();
      setMessages(msgs => [
        ...msgs,
        {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: data.answer || 'No se pudo obtener respuesta.'
        }
      ]);
    } catch (error) {
      setMessages(msgs => [
        ...msgs,
        {
          id: (Date.now() + 2).toString(),
          type: 'bot',
          content: 'Error al obtener respuesta.'
        }
      ]);
    }
    setIsLoading(false);
  };



  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-primary-500 text-white p-4 rounded-full shadow-lg hover:bg-primary-600 transition-colors"
        aria-label="Abrir chat"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    );
  }

  return (
    <div
      style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 99999 }}
      className={
        `w-96 h-[600px] rounded-lg shadow-xl flex flex-col ` +
        `bg-white text-gray-900 dark:bg-neutral-900 dark:text-gray-100`
      }
    >
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center bg-primary-500 text-white rounded-t-lg dark:bg-neutral-800">
        <h3 className="font-semibold">Chat de Ayuda</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:text-neutral-200 transition-colors"
        >
          <span className="sr-only">Cerrar</span>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex w-full mb-2 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`msg ${msg.type}
                ${msg.type === 'user'
                  ? 'bg-blue-600 text-white dark:bg-blue-700 dark:text-white'
                  : 'bg-gray-200 text-gray-900 dark:bg-blue-100 dark:text-blue-900'}
                `}
              style={{
                borderRadius: 16,
                padding: '10px 16px',
                maxWidth: '75%',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                wordBreak: 'break-word',
                fontSize: '1rem',
                marginLeft: msg.type === 'user' ? 'auto' : 0,
                marginRight: msg.type === 'user' ? 0 : 'auto',
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="msg bot bg-blue-100 text-blue-900 dark:bg-neutral-800 dark:text-blue-200" style={{ margin: '8px 0', borderRadius: 8, padding: '6px 12px', display: 'inline-block', maxWidth: '80%' }}>Escribiendo...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={e => {
          e.preventDefault();
          if (!isLoading) handleSend();
        }}
        className="p-4 border-t border-neutral-200 dark:border-neutral-700"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            disabled={isLoading}
            placeholder="Escribe tu pregunta..."
            className="flex-1 mr-2 p-2 rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="px-4 py-2 rounded-md bg-blue-600 text-white border-0 cursor-pointer hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            Enviar
          </button>
        </div>
      </form>
    </div>
  );
}