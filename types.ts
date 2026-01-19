export interface User {
  id: string;
  username: string;
  avatar: string;
  publicKey: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'video' | 'file';
  mimeType: string;
  data: string; // Base64 Data URI
  size: number;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string; // Text content (caption if attachment exists)
  timestamp: number;
  type: 'text' | 'system';
  reactions?: { [emoji: string]: string[] }; // emoji -> array of userIds
  attachment?: Attachment;
  isDeleted?: boolean; // New flag for soft deletion
}

export interface ReactionPayload {
  messageId: string;
  emoji: string;
  userId: string;
}

export interface DeletePayload {
  messageIds: string[];
}

export interface ChatState {
  user: User | null;
  activeRoom: string;
  messages: Message[];
  typingUsers: string[]; // List of usernames currently typing
  isAuthenticated: boolean;
  connectionStatus: {
    status: 'disconnected' | 'connecting' | 'host' | 'client' | 'error';
    label: string;
  };
}