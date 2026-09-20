import type { User, Room, ChatMessage } from '../types';

const TOKEN_KEY = 'chat_auth_token';

export const authStorage = {
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setToken(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Ignore
    }
  },
  clearToken() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Ignore
    }
  },
};

export const api = {
  async register(username: string, password: string, displayName?: string): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, displayName }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Ro'yxatdan o'tishda xatolik yuz berdi");
    }
    authStorage.setToken(data.token);
    return data;
  },

  async login(username: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Kirishda xatolik yuz berdi');
    }
    authStorage.setToken(data.token);
    return data;
  },

  async getMe(): Promise<User | null> {
    const token = authStorage.getToken();
    if (!token) return null;

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        authStorage.clearToken();
        return null;
      }
      const data = await res.json();
      return data.user || null;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    const token = authStorage.getToken();
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Ignore
      }
    }
    authStorage.clearToken();
  },

  async getRooms(): Promise<Room[]> {
    const res = await fetch('/api/rooms');
    if (!res.ok) throw new Error('Xonalarni yuklab bo‘lmadi');
    const data = await res.json();
    return data.rooms || [];
  },

  async getRoomMessages(roomId: string): Promise<ChatMessage[]> {
    const res = await fetch(`/api/rooms/${roomId}/messages`);
    if (!res.ok) throw new Error('Xabarlarni yuklab bo‘lmadi');
    const data = await res.json();
    return data.messages || [];
  },

  async sendMessage(roomId: string, text: string): Promise<ChatMessage> {
    const token = authStorage.getToken();
    const res = await fetch(`/api/rooms/${roomId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Xabar yuborishda xatolik');
    }
    return data.message;
  },
};
