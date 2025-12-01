import React, { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import type { Message } from "../types/data";

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage }) => {
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  const handleSend = () => {
    const trimmed = inputMessage.trim();
    if (trimmed) {
      onSendMessage(trimmed);
      setInputMessage("");
    }
  };

  const formatTime = (date: Date) => {
    const h = date.getHours() % 12 || 12;
    const m = date.getMinutes().toString().padStart(2, "0");
    const ampm = date.getHours() >= 12 ? "PM" : "AM";
    return `${h}:${m} ${ampm}`;
  };

  return (
    <div className="flex flex-col h-full max-h-[600px] bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-xs lg:max-w-md p-3 rounded-xl ${
              msg.sender === "user" ? "bg-blue-600 text-white rounded-br-none" : "bg-gray-200 text-gray-800 rounded-tl-none"
            }`}>
              <p>{msg.text}</p>
              <span className="text-xs block mt-1">{msg.time}</span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t flex items-center">
        <input
          type="text"
          className="flex-1 border rounded px-3 py-2 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Type a message..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend} className="px-3 py-2 bg-blue-600 text-white rounded">
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
