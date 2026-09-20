export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
  createdAt: number;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  displayName: string;
  avatarColor: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface OnlineUser {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
  currentRoomId?: string;
  lastActive: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

export type WSClientAction =
  | { type: 'auth'; token: string }
  | { type: 'join_room'; roomId: string }
  | { type: 'leave_room'; roomId: string }
  | { type: 'send_message'; roomId: string; text: string }
  | { type: 'typing'; roomId: string; isTyping: boolean }
  | { type: 'ping' };

export type WSServerAction =
  | { type: 'auth_success'; user: User }
  | { type: 'auth_error'; message: string }
  | { type: 'new_message'; message: ChatMessage }
  | { type: 'presence_update'; onlineUsers: OnlineUser[]; count: number }
  | { type: 'user_typing'; roomId: string; username: string; displayName: string; isTyping: boolean }
  | { type: 'pong' };
