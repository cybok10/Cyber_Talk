export interface User {
  id: string;
  username: string;
  avatar: string;
  publicKey: string;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  type: 'text' | 'system';
}

export interface ChatState {
  user: User | null;
  activeRoom: string;
  messages: Message[];
  isAuthenticated: boolean;
  connectionStatus: {
    status: 'disconnected' | 'connecting' | 'host' | 'client' | 'error';
    label: string;
  };
}