import React, { useState, useEffect } from 'react';
import { User, Message, ChatState } from './types.ts';
import { socket } from './services/socketService.ts';
import { getGeminiResponse } from './services/geminiService.ts';
import Auth from './components/Auth.tsx';
import ChatWindow from './components/ChatWindow.tsx';
import Sidebar from './components/Sidebar.tsx';

const App: React.FC = () => {
  const [state, setState] = useState<ChatState>({
    user: null,
    activeRoom: 'Global',
    messages: [],
    isAuthenticated: false,
    connectionStatus: { status: 'disconnected', label: 'Offline' }
  });

  const [isBotEnabled, setIsBotEnabled] = useState(false);

  useEffect(() => {
    // Message Listener
    const handleMessage = (msg: Message) => {
      // Strict room check not needed as P2P channels are room-specific, 
      // but good for safety if we switch back to global socket later.
      if (msg.roomId !== state.activeRoom) return;

      setState(prev => {
        // Deduplication
        if (prev.messages.find(m => m.id === msg.id)) return prev;
        return { ...prev, messages: [...prev.messages, msg] };
      });
    };

    // Status Listener
    const handleStatus = (status: any) => {
      setState(prev => ({ ...prev, connectionStatus: status }));
    };

    socket.on('message', handleMessage);
    socket.on('status', handleStatus);

    return () => {
      socket.off('message', handleMessage);
      socket.off('status', handleStatus);
    };
  }, [state.activeRoom]);

  const handleJoin = (username: string, roomId: string) => {
    // 1. Initialize P2P Connection
    socket.connect(roomId);

    // 2. Create local User State
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

    // 3. Emit Join Message (Will be queued until P2P connects)
    const joinMsg: Message = {
      id: `sys-${Date.now()}`,
      roomId: roomId,
      senderId: 'system',
      senderName: 'System',
      content: `${username} has entered the encrypted channel.`,
      timestamp: Date.now(),
      type: 'system'
    };
    
    // We emit immediately. socketService handles queuing.
    socket.emit('message', joinMsg);
  };

  const handleSendMessage = async (content: string) => {
    if (!state.user) return;

    const msg: Message = {
      id: `m-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      roomId: state.activeRoom,
      senderId: state.user.id,
      senderName: state.user.username,
      content,
      timestamp: Date.now(),
      type: 'text'
    };

    socket.emit('message', msg);

    if (isBotEnabled) {
      const response = await getGeminiResponse(content);
      if (response) {
        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          roomId: state.activeRoom,
          senderId: 'bot',
          senderName: 'CipherBot',
          content: response,
          timestamp: Date.now(),
          type: 'text'
        };
        socket.emit('message', botMsg);
      }
    }
  };

  if (!state.isAuthenticated) {
    return <Auth onJoin={handleJoin} />;
  }

  // Find a peer from messages
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
      />
      <div className="flex-1 flex flex-col min-w-0">
        <ChatWindow 
          messages={state.messages}
          currentUser={state.user!}
          activeRoom={state.activeRoom}
          onSendMessage={handleSendMessage}
          isBotEnabled={isBotEnabled}
          onToggleBot={() => setIsBotEnabled(!isBotEnabled)}
        />
      </div>
    </div>
  );
};

export default App;