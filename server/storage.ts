import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { User, Room, ChatMessage } from '../src/types.js';

interface StoredUser extends User {
  passwordHash: string;
  salt: string;
}

interface Session {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

interface DatabaseSchema {
  users: StoredUser[];
  sessions: Session[];
  rooms: Room[];
  messages: ChatMessage[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

const AVATAR_COLORS = [
  '#2563eb', // Blue
  '#059669', // Emerald
  '#7c3aed', // Violet
  '#db2777', // Pink
  '#d97706', // Amber
  '#0891b2', // Cyan
  '#4f46e5', // Indigo
  '#e11d48', // Rose
];

const DEFAULT_ROOMS: Room[] = [
  {
    id: 'general',
    name: 'Umumiy Guruh',
    description: 'Barcha ishtirokchilar uchun umumiy muloqot va do‘stona suhbat maydoni',
    icon: 'MessageSquare',
  },
  {
    id: 'it-tech',
    name: 'IT & Dasturlash',
    description: 'Kod yozish, texnologiyalar, dasturlash tillari va yangiliklar',
    icon: 'Code2',
  },
  {
    id: 'qa-help',
    name: 'Savol-Javob & Yordam',
    description: 'Qiyinchiliklar, savollar va bir-biriga yordam berish',
    icon: 'HelpCircle',
  },
  {
    id: 'random',
    name: 'Erkin Suhbat',
    description: 'Har qanday qiziqarli mavzulardagi bepul suhbatlar',
    icon: 'Coffee',
  },
];

class StorageService {
  private db: DatabaseSchema = {
    users: [],
    sessions: [],
    rooms: [],
    messages: [],
  };
  private isSavePending = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.db = JSON.parse(raw);
      } else {
        this.db = {
          users: [],
          sessions: [],
          rooms: DEFAULT_ROOMS,
          messages: [],
        };
        this.seedInitialData();
        this.saveSync();
      }

      // Ensure all default rooms exist
      for (const defRoom of DEFAULT_ROOMS) {
        if (!this.db.rooms.some((r) => r.id === defRoom.id)) {
          this.db.rooms.push(defRoom);
        }
      }
    } catch (err) {
      console.error('Failed to initialize database, falling back to clean state:', err);
      this.db = {
        users: [],
        sessions: [],
        rooms: DEFAULT_ROOMS,
        messages: [],
      };
      this.seedInitialData();
      this.saveSync();
    }
  }

  private seedInitialData() {
    // Initial welcome system message
    this.db.messages.push({
      id: 'welcome-msg-1',
      roomId: 'general',
      userId: 'system',
      username: 'Tizim',
      displayName: 'Tizim Xabarchisi',
      avatarColor: '#2563eb',
      text: 'Salom! Suhbat tizimiga xush kelibsiz. Bu yerda bemalol boshqalar bilan jonli xabar almashishingiz mumkin.',
      timestamp: Date.now(),
      isSystem: true,
    });
  }

  private saveSync() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.db, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Error saving database to file:', err);
    }
  }

  private scheduleSave() {
    if (this.isSavePending) return;
    this.isSavePending = true;
    setTimeout(() => {
      this.isSavePending = false;
      this.saveSync();
    }, 150);
  }

  private hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  }

  public register(usernameRaw: string, passwordRaw: string, displayNameRaw?: string): { user: User; token: string } {
    const username = usernameRaw.trim().toLowerCase();
    const displayName = displayNameRaw?.trim() || usernameRaw.trim();

    if (!username || username.length < 3 || username.length > 25) {
      throw new Error("Foydalanuvchi nomi 3 tadan 25 tagacha belgidan iborat bo'lishi kerak");
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      throw new Error("Foydalanuvchi nomi faqat lotin harflari, raqamlar, '_' va '-' dan iborat bo'lishi mumkin");
    }

    if (!passwordRaw || passwordRaw.length < 4) {
      throw new Error("Parol kamida 4 ta belgidan iborat bo'lishi lozim");
    }

    const existing = this.db.users.find((u) => u.username.toLowerCase() === username);
    if (existing) {
      throw new Error("Bunday foydalanuvchi nomi allaqachon ro'yxatdan o'tgan");
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = this.hashPassword(passwordRaw, salt);

    // Pick avatar color based on username hash
    const colorIndex = Math.abs(
      username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    ) % AVATAR_COLORS.length;
    const avatarColor = AVATAR_COLORS[colorIndex];

    const newUser: StoredUser = {
      id: crypto.randomUUID(),
      username,
      displayName: displayName || username,
      avatarColor,
      passwordHash,
      salt,
      createdAt: Date.now(),
    };

    this.db.users.push(newUser);

    // Create session token
    const token = crypto.randomBytes(32).toString('hex');
    this.db.sessions.push({
      token,
      userId: newUser.id,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    this.scheduleSave();

    const { passwordHash: _, salt: __, ...publicUser } = newUser;
    return { user: publicUser, token };
  }

  public login(usernameRaw: string, passwordRaw: string): { user: User; token: string } {
    const username = usernameRaw.trim().toLowerCase();
    if (!username || !passwordRaw) {
      throw new Error("Foydalanuvchi nomi va parol kiritilishi shart");
    }

    const user = this.db.users.find((u) => u.username.toLowerCase() === username);
    if (!user) {
      throw new Error("Foydalanuvchi nomi yoki parol noto'g'ri");
    }

    const calculatedHash = this.hashPassword(passwordRaw, user.salt);
    if (calculatedHash !== user.passwordHash) {
      throw new Error("Foydalanuvchi nomi yoki parol noto'g'ri");
    }

    // Clean old expired sessions
    this.db.sessions = this.db.sessions.filter((s) => s.expiresAt > Date.now());

    // Issue new session token
    const token = crypto.randomBytes(32).toString('hex');
    this.db.sessions.push({
      token,
      userId: user.id,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });

    this.scheduleSave();

    const { passwordHash: _, salt: __, ...publicUser } = user;
    return { user: publicUser, token };
  }

  public getUserByToken(token: string): User | null {
    if (!token) return null;
    const session = this.db.sessions.find((s) => s.token === token && s.expiresAt > Date.now());
    if (!session) return null;

    const user = this.db.users.find((u) => u.id === session.userId);
    if (!user) return null;

    const { passwordHash: _, salt: __, ...publicUser } = user;
    return publicUser;
  }

  public logout(token: string): boolean {
    const prevLen = this.db.sessions.length;
    this.db.sessions = this.db.sessions.filter((s) => s.token !== token);
    if (this.db.sessions.length !== prevLen) {
      this.scheduleSave();
      return true;
    }
    return false;
  }

  public getRooms(): Room[] {
    return this.db.rooms;
  }

  public getMessages(roomId: string, limit = 100): ChatMessage[] {
    const msgs = this.db.messages.filter((m) => m.roomId === roomId);
    return msgs.slice(-limit);
  }

  public addMessage(roomId: string, user: User, textRaw: string, isSystem = false): ChatMessage {
    const text = textRaw.trim();
    if (!text && !isSystem) {
      throw new Error("Xabar matni bo'sh bo'lishi mumkin emas");
    }

    if (text.length > 2000) {
      throw new Error("Xabar juda uzun (maksimal 2000 belgi)");
    }

    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      roomId,
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarColor: user.avatarColor,
      text,
      timestamp: Date.now(),
      isSystem,
    };

    this.db.messages.push(newMessage);

    // Keep database size bounded if too many messages accumulate (e.g. 5,000 max)
    if (this.db.messages.length > 5000) {
      this.db.messages = this.db.messages.slice(-4000);
    }

    this.scheduleSave();
    return newMessage;
  }
}

export const storage = new StorageService();
