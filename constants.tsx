import { User } from './types.ts';

export const COLORS = {
  primary: '#4f46e5',
  secondary: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
};

// Fixed: Aligned MOCK_PEER with the User interface by changing name to username
export const MOCK_PEER: User = {
  id: 'cipherbot-001',
  username: 'CipherBot (AI Peer)',
  avatar: 'https://picsum.photos/seed/bot/200',
  publicKey: 'MOCK-PUB-KEY-CIPHERBOT-STUB',
};