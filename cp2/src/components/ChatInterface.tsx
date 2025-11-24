// src/components/ChatInterface.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import type { Message } from '../types/data'; // Import the interface

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage }) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null); // Use HTMLDivElement

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = () => {
    const trimmedMessage = inputMessage.trim();
    if (trimmedMessage !== '') {
      onSendMessage(trimmedMessage);
      setInputMessage('');
    }
  };

  return (
    // ... (rest of the JSX structure remains the same)
    <div className="flex flex-col h-full max-h-[600px] bg-white rounded-xl shadow-lg border border-gray-100">
      {/* ... Header and Message Area (map over messages) ... */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => ( // TypeScript knows msg is a Message
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md p-3 rounded-xl ${
              msg.sender === 'user'
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-gray-200 text-gray-800 rounded-tl-none'
            }`}>
              <p>{msg.text}</p>
              {msg.blockchainTxHash && (
                  <span className="text-xs block mt-1 text-yellow-200">
                      Tx: {msg.blockchainTxHash.substring(0, 8)}...
                  </span>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t flex items-center">
        <input
          // ... (input props)
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSend()} // Use React.KeyboardEvent
          // ...
        />
        <button
          onClick={handleSend}
          // ...
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;