import React, { useState, useRef, useEffect } from 'react';
import { Message, User } from '../types.ts';

interface ChatWindowProps {
  messages: Message[];
  currentUser: User;
  activeRoom: string;
  onSendMessage: (content: string) => void;
  isBotEnabled: boolean;
  onToggleBot: () => void;
  onAddReaction: (messageId: string, emoji: string) => void;
}

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, currentUser, activeRoom, onSendMessage, isBotEnabled, onToggleBot, onAddReaction }) => {
  const [inputText, setInputText] = useState('');
  const [activeReactionId, setActiveReactionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, messages[messages.length - 1]?.reactions]); // Auto scroll on new message or reaction

  // Close reaction picker on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setActiveReactionId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const toggleReactionPicker = (msgId: string) => {
    setActiveReactionId(activeReactionId === msgId ? null : msgId);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full bg-white shadow-xl" ref={wrapperRef}>
      {/* Header */}
      <header className="px-6 py-4 border-b flex items-center justify-between bg-white z-10">
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
        className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50"
      >
        {messages.map((msg) => {
          if (msg.type === 'system') {
            return (
              <div key={msg.id} className="text-center my-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
                  {msg.content}
                </span>
              </div>
            );
          }

          const isOwn = msg.senderId === currentUser.id;
          const reactions = (msg.reactions || {}) as Record<string, string[]>;
          const hasReactions = Object.keys(reactions).length > 0;

          return (
            <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} group relative animate-fade-in`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{msg.senderName}</span>
                <span className="text-[9px] text-slate-300">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              
              <div className="relative max-w-[80%]">
                {/* Message Bubble */}
                <div className={`px-4 py-2.5 rounded-2xl shadow-sm relative ${
                  isOwn ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                }`}>
                  <p className="text-sm">{msg.content}</p>
                </div>

                {/* Reaction Picker Button */}
                <button 
                  onClick={() => toggleReactionPicker(msg.id)}
                  className={`absolute top-1/2 -translate-y-1/2 ${isOwn ? '-left-8' : '-right-8'} 
                    w-6 h-6 rounded-full bg-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 
                    flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-10
                    ${activeReactionId === msg.id ? 'opacity-100 text-indigo-600 bg-indigo-50' : ''}`}
                >
                  <i className="fas fa-smile text-xs"></i>
                </button>

                {/* Reaction Picker Popover */}
                {activeReactionId === msg.id && (
                  <div className={`absolute bottom-full mb-2 ${isOwn ? 'right-0' : 'left-0'} 
                    bg-white border border-slate-200 shadow-xl rounded-full p-1.5 flex gap-1 z-20 animate-fade-in`}>
                    {REACTION_EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => {
                          onAddReaction(msg.id, emoji);
                          setActiveReactionId(null);
                        }}
                        className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full text-lg transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Display Reactions */}
              {hasReactions && (
                <div className={`flex flex-wrap gap-1 mt-1.5 ${isOwn ? 'justify-end' : 'justify-start'} max-w-[80%]`}>
                  {Object.entries(reactions).map(([emoji, users]) => {
                    const iReacted = users.includes(currentUser.id);
                    return (
                      <button 
                        key={emoji}
                        onClick={() => onAddReaction(msg.id, emoji)}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-medium transition-all
                          ${iReacted 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                      >
                        <span>{emoji}</span>
                        <span>{users.length}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t flex items-center gap-3 relative z-20">
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