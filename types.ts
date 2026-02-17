export interface User {
  username: string;
  isAdmin?: boolean;
  isSuspended?: boolean;
  suspendedReason?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  image?: string; // Base64 string including data URI scheme
  timestamp: number;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}