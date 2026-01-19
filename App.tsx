import React, { useState, useEffect, useRef } from 'react';
import { User, Message, ChatState, ReactionPayload, Attachment } from './types.ts';
import { socket } from './services/socketService.ts';
import { getGeminiResponse } from './services/geminiService.ts';
import Auth from './components/Auth.tsx';
import ChatWindow from './components/ChatWindow.tsx';
import Sidebar from './components/Sidebar.tsx';

const STORAGE_KEY = 'ciphertalk_v2_storage';

const App: React.FC = () => {
  // Initialize state from local storage if available
  const [state, setState] = useState<ChatState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // We restore the user and messages, but reset connection status and typing
        return {
          ...parsed,
          typingUsers: [],
          connectionStatus: { status: 'disconnected', label: 'Reconnecting...' }
        };
      }
    } catch (e) {
      console.warn("Failed to load session from storage:", e);
    }
    
    return {
      user: null,
      activeRoom: 'Global',
      messages: [],
      typingUsers: [],
      isAuthenticated: false,
      connectionStatus: { status: 'disconnected', label: 'Offline' }
    };
  });

  const [isBotEnabled, setIsBotEnabled] = useState(false);
  const typingTimeouts = useRef<{ [key: string]: ReturnType<typeof setTimeout> }>({});

  // 1. Persist state to local storage on change
  useEffect(() => {
    if (state.isAuthenticated) {
      const { user, activeRoom, messages, isAuthenticated } = state;
      try {
         localStorage.setItem(STORAGE_KEY, JSON.stringify({
           user, activeRoom, messages, isAuthenticated
         }));
      } catch (e) {
         console.warn("Storage quota exceeded, likely due to file attachments.");
      }
    }
  }, [state.user, state.activeRoom, state.messages, state.isAuthenticated]);

  // 2. Attempt reconnection on mount if authenticated
  useEffect(() => {
    if (state.isAuthenticated && state.activeRoom) {
      console.log(`[App] Restoring session for room: ${state.activeRoom}`);
      socket.connect(state.activeRoom);
    }
  }, []); // Run once on mount

  // 3. Handle Logout
  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  useEffect(() => {
    // Message Listener
    const handleMessage = (msg: Message) => {
      if (msg.roomId !== state.activeRoom) return;

      setState(prev => {
        // Remove user from typing list if they sent a message
        const newTyping = prev.typingUsers.filter(u => u !== msg.senderName);
        
        // Deduplication
        if (prev.messages.find(m => m.id === msg.id)) return { ...prev, typingUsers: newTyping };
        return { ...prev, messages: [...prev.messages, msg], typingUsers: newTyping };
      });
    };

    // Reaction Listener
    const handleReactionEvent = (payload: ReactionPayload) => {
      setState(prev => {
        const updatedMessages = prev.messages.map(msg => {
          if (msg.id !== payload.messageId) return msg;

          const reactions = { ...(msg.reactions || {}) };
          const users = reactions[payload.emoji] || [];
          
          if (users.includes(payload.userId)) {
            // Remove reaction
            reactions[payload.emoji] = users.filter(id => id !== payload.userId);
            if (reactions[payload.emoji].length === 0) {
              delete reactions[payload.emoji];
            }
          } else {
            // Add reaction
            reactions[payload.emoji] = [...users, payload.userId];
          }

          return { ...msg, reactions };
        });
        return { ...prev, messages: updatedMessages };
      });
    };

    // Typing Listener
    const handleTypingEvent = ({ username, isTyping }: { username: string, isTyping: boolean }) => {
      if (username === state.user?.username) return; // Ignore self

      setState(prev => {
        const others = prev.typingUsers.filter(u => u !== username);
        if (isTyping) {
            // Clear existing timeout to prevent premature removal
            if (typingTimeouts.current[username]) clearTimeout(typingTimeouts.current[username]);
            
            // Auto-remove after 3 seconds if no 'stop' event received
            typingTimeouts.current[username] = setTimeout(() => {
                setState(p => ({ ...p, typingUsers: p.typingUsers.filter(u => u !== username) }));
            }, 3000);

            return { ...prev, typingUsers: [...others, username] };
        } else {
            return { ...prev, typingUsers: others };
        }
      });
    };

    // Status Listener
    const handleStatus = (status: any) => {
      setState(prev => ({ ...prev, connectionStatus: status }));
    };

    socket.on('message', handleMessage);
    socket.on('reaction', handleReactionEvent);
    socket.on('typing', handleTypingEvent);
    socket.on('status', handleStatus);

    return () => {
      socket.off('message', handleMessage);
      socket.off('reaction', handleReactionEvent);
      socket.off('typing', handleTypingEvent);
      socket.off('status', handleStatus);
    };
  }, [state.activeRoom, state.user]);

  const handleJoin = (username: string, roomId: string) => {
    socket.connect(roomId);

    const newUser: User = {
      id: `u-${Math.random().toString(36).substr(2, 9)}`,
      username,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      publicKey: `PUB-${Math.random().toString(36).substr(2, 16).toUpperCase()}`,
    };

    setState(prev => ({
      ...prev,
      user: newUser,
      activeRoom: roomId,
      isAuthenticated: true,
      connectionStatus: { status: 'connecting', label: 'Initializing...' }
    }));

    const joinMsg: Message = {
      id: `sys-${Date.now()}`,
      roomId: roomId,
      senderId: 'system',
      senderName: 'System',
      content: `${username} has entered the encrypted channel.`,
      timestamp: Date.now(),
      type: 'system'
    };
    
    socket.emit('message', joinMsg);
  };

  const handleSendMessage = async (content: string, attachment?: Attachment) => {
    if (!state.user) return;

    const msg: Message = {
      id: `m-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      roomId: state.activeRoom,
      senderId: state.user.id,
      senderName: state.user.username,
      content,
      timestamp: Date.now(),
      type: 'text',
      reactions: {},
      attachment
    };

    socket.emit('message', msg);

    if (isBotEnabled && !attachment) {
      const response = await getGeminiResponse(content);
      if (response) {
        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          roomId: state.activeRoom,
          senderId: 'bot',
          senderName: 'CipherBot',
          content: response,
          timestamp: Date.now(),
          type: 'text',
          reactions: {}
        };
        socket.emit('message', botMsg);
      }
    }
  };

  const handleAddReaction = (messageId: string, emoji: string) => {
    if (!state.user) return;
    const payload: ReactionPayload = { messageId, emoji, userId: state.user.id };
    socket.emit('reaction', payload);
  };

  const handleTyping = (isTyping: boolean) => {
    if (!state.user) return;
    socket.emit('typing', { username: state.user.username, isTyping });
  };

  if (!state.isAuthenticated) {
    return <Auth onJoin={handleJoin} />;
  }

  // Identify Peer (Last person who isn't us or bot)
  const lastOtherMessage = [...state.messages].reverse().find(m => m.senderId !== state.user?.id && m.type === 'text' && m.senderId !== 'bot');
  const mockPeer: User | null = lastOtherMessage ? {
    id: lastOtherMessage.senderId,
    username: lastOtherMessage.senderName,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${lastOtherMessage.senderName}`,
    publicKey: `REMOTE-PUB-${lastOtherMessage.senderId.toUpperCase()}`,
  } : null;

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        user={state.user}
        activeRoom={state.activeRoom}
        peer={mockPeer}
        isBotEnabled={isBotEnabled}
        setIsBotEnabled={setIsBotEnabled}
        sessionStats={{}}
        connectionStatus={state.connectionStatus}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <ChatWindow 
          messages={state.messages}
          currentUser={state.user!}
          activeRoom={state.activeRoom}
          peer={mockPeer}
          onSendMessage={handleSendMessage}
          isBotEnabled={isBotEnabled}
          onToggleBot={() => setIsBotEnabled(!isBotEnabled)}
          onAddReaction={handleAddReaction}
          onTyping={handleTyping}
          typingUsers={state.typingUsers}
        />
      </div>
    </div>
  );
};

export default App;