import React, { useState, useRef, useEffect } from 'react';
import { Message, User, Attachment } from '../types.ts';

interface ChatWindowProps {
  messages: Message[];
  currentUser: User;
  activeRoom: string;
  peer: User | null;
  onSendMessage: (content: string, attachment?: Attachment) => void;
  isBotEnabled: boolean;
  onToggleBot: () => void;
  onAddReaction: (messageId: string, emoji: string) => void;
  onTyping: (isTyping: boolean) => void;
  typingUsers: string[];
}

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

// Helper for date formatting
const isSameDay = (ts1: number, ts2: number) => {
  const d1 = new Date(ts1);
  const d2 = new Date(ts2);
  return d1.getDate() === d2.getDate() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getFullYear() === d2.getFullYear();
};

const formatDate = (ts: number) => {
  const d = new Date(ts);
  const today = new Date();
  if (isSameDay(ts, today.getTime())) return 'Today';
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(ts, yesterday.getTime())) return 'Yesterday';

  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
};

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages, currentUser, activeRoom, peer, 
  onSendMessage, isBotEnabled, onToggleBot, onAddReaction, 
  onTyping, typingUsers 
}) => {
  const [inputText, setInputText] = useState('');
  const [activeReactionId, setActiveReactionId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, messages[messages.length - 1]?.reactions, typingUsers.length]); 

  // Outside click for reactions
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    
    // Typing indicator logic
    onTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
      onTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert(`File too large. Max size is 1MB for P2P stability.`);
      e.target.value = '';
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file';
      
      const attachment: Attachment = {
        id: `att-${Date.now()}`,
        name: file.name,
        type,
        mimeType: file.type,
        data: base64,
        size: file.size
      };

      onSendMessage("", attachment);
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.onerror = () => {
      console.error("File reading failed");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const toggleReactionPicker = (msgId: string) => {
    setActiveReactionId(activeReactionId === msgId ? null : msgId);
  };

  const renderAttachment = (att: Attachment) => {
    if (att.type === 'image') {
      return (
        <div className="mb-2 rounded-lg overflow-hidden border border-slate-200/20">
          <img src={att.data} alt={att.name} className="max-w-full max-h-[300px] object-cover" />
        </div>
      );
    } else if (att.type === 'video') {
      return (
        <div className="mb-2 rounded-lg overflow-hidden border border-slate-200/20">
          <video controls src={att.data} className="max-w-full max-h-[300px]" />
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg mb-2 border border-white/20 hover:bg-white/20 transition-colors">
           <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center text-white">
             <i className="fas fa-file-lines"></i>
           </div>
           <div className="flex-1 min-w-0">
             <div className="text-xs font-bold truncate">{att.name}</div>
             <div className="text-[10px] opacity-70">{(att.size / 1024).toFixed(1)} KB</div>
           </div>
           <a href={att.data} download={att.name} className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-full hover:bg-white/30 transition-colors">
             <i className="fas fa-download text-xs"></i>
           </a>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full bg-white shadow-xl" ref={wrapperRef}>
      {/* Enhanced Header */}
      <header className="px-6 py-4 border-b flex items-center justify-between bg-white z-10">
        <div className="flex items-center gap-3">
          {peer ? (
             <div className="relative">
                <img src={peer.avatar} className="w-10 h-10 rounded-full bg-slate-100 object-cover border border-slate-200" alt={peer.username} />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
             </div>
          ) : (
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <i className="fas fa-hashtag"></i>
            </div>
          )}
          
          <div>
            <h2 className="font-bold text-slate-800 leading-tight">
                {peer ? peer.username : activeRoom}
            </h2>
            <div className="flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                 {peer ? 'End-to-End Encrypted' : 'Encrypted Group'}
               </p>
            </div>
          </div>
        </div>
        <button 
          onClick={onToggleBot}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
            isBotEnabled ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}
        >
          <i className="fas fa-robot"></i>
          {isBotEnabled ? 'Bot On' : 'Bot Off'}
        </button>
      </header>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-1 custom-scrollbar bg-slate-50/50"
      >
        {messages.map((msg, index) => {
          if (msg.type === 'system') {
            return (
              <div key={msg.id} className="text-center my-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  {msg.content}
                </span>
              </div>
            );
          }

          // Grouping Logic
          const isOwn = msg.senderId === currentUser.id;
          const previousMsg = messages[index - 1];
          const nextMsg = messages[index + 1];
          
          const isSequence = previousMsg && previousMsg.senderId === msg.senderId && previousMsg.type !== 'system' && (msg.timestamp - previousMsg.timestamp < 300000); // 5 mins
          const isLastInSequence = !nextMsg || nextMsg.senderId !== msg.senderId || nextMsg.type === 'system' || (nextMsg.timestamp - msg.timestamp >= 300000);
          
          const showDateSeparator = !previousMsg || !isSameDay(msg.timestamp, previousMsg.timestamp);

          const reactions = (msg.reactions || {}) as Record<string, string[]>;
          const hasReactions = Object.keys(reactions).length > 0;
          const hasAttachment = !!msg.attachment;

          return (
            <React.Fragment key={msg.id}>
              {showDateSeparator && (
                <div className="flex items-center justify-center my-6">
                  <div className="bg-slate-200 h-px w-8"></div>
                  <span className="mx-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(msg.timestamp)}</span>
                  <div className="bg-slate-200 h-px w-8"></div>
                </div>
              )}

              <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} group relative animate-fade-in ${isSequence ? 'mt-1' : 'mt-4'}`}>
                
                {/* Sender Name (only if first in sequence and not own) */}
                {!isOwn && !isSequence && (
                  <span className="text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">{msg.senderName}</span>
                )}
                
                <div className="relative max-w-[80%] min-w-[120px]">
                  {/* Message Bubble */}
                  <div className={`px-4 py-2.5 shadow-sm relative text-sm
                    ${isOwn 
                      ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm' 
                      : 'bg-white text-slate-700 border border-slate-200 rounded-2xl rounded-tl-sm'}
                    ${isSequence && isOwn ? 'rounded-tr-2xl' : ''}
                    ${isSequence && !isOwn ? 'rounded-tl-2xl' : ''}
                  `}>
                    {hasAttachment && renderAttachment(msg.attachment!)}
                    {msg.content && <p className="leading-relaxed">{msg.content}</p>}
                    
                    <div className={`text-[9px] mt-1 flex items-center gap-1 ${isOwn ? 'justify-end text-indigo-200' : 'justify-start text-slate-300'}`}>
                       {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       {isOwn && <i className="fas fa-check-double"></i>}
                    </div>
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
                  <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'} max-w-[80%]`}>
                    {Object.entries(reactions).map(([emoji, users]) => {
                      const iReacted = users.includes(currentUser.id);
                      return (
                        <button 
                          key={emoji}
                          onClick={() => onAddReaction(msg.id, emoji)}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-medium transition-all shadow-sm
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
            </React.Fragment>
          );
        })}
        
        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
           <div className="flex items-center gap-2 mt-4 animate-fade-in">
              <div className="bg-slate-200 rounded-full px-3 py-2 flex gap-1">
                 <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                 <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                 <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></div>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                 {typingUsers.join(', ')} is typing...
              </span>
           </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t flex items-center gap-3 relative z-20">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileSelect} 
          accept="image/*,video/*,.pdf,.doc,.docx"
        />
        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-11 h-11 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-200 hover:text-slate-700 transition-all"
          title="Attach file (Max 1MB)"
        >
           {uploading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-paperclip"></i>}
        </button>
        <input 
          type="text"
          className="flex-1 bg-slate-100 border-none rounded-xl px-5 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          placeholder="Type a message..."
          value={inputText}
          onChange={handleInputChange}
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