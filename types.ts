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
  reactions?: { [emoji: string]: string[] }; // emoji -> array of userIds
}

export interface ReactionPayload {
  messageId: string;
  emoji: string;
  userId: string;
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