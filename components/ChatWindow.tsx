import React, { useState, useRef, useEffect } from 'react';
import { Message, User } from '../types.ts';

interface ChatWindowProps {
  messages: Message[];
  currentUser: User;
  activeRoom: string;
  onSendMessage: (content: string) => void;
  isBotEnabled: boolean;
  onToggleBot: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, currentUser, activeRoom, onSendMessage, isBotEnabled, onToggleBot }) => {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full bg-white shadow-xl">
      {/* Header */}
      <header className="px-6 py-4 border-b flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white">
            <i className="fas fa-hashtag"></i>
          </div>
          <div>
            <h2 className="font-bold text-slate-800">{activeRoom}</h2>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Active Session</p>
          </div>
        </div>
        <button 
          onClick={onToggleBot}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
            isBotEnabled ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}
        >
          <i className="fas fa-robot"></i>
          {isBotEnabled ? 'Bot Active' : 'Enable Bot'}
        </button>
      </header>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/50"
      >
        {messages.map((msg) => {
          if (msg.type === 'system') {
            return (
              <div key={msg.id} className="text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
                  {msg.content}
                </span>
              </div>
            );
          }

          const isOwn = msg.senderId === currentUser.id;
          return (
            <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} animate-fade-in`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{msg.senderName}</span>
                <span className="text-[9px] text-slate-300">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] shadow-sm ${
                isOwn ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
              }`}>
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t flex items-center gap-3">
        <input 
          type="text"
          className="flex-1 bg-slate-100 border-none rounded-xl px-5 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          placeholder="Type a message..."
          value={inputText}
          onChange={e => setInputText(e.target.value)}
        />
        <button 
          type="submit"
          className="w-11 h-11 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <i className="fas fa-paper-plane"></i>
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;