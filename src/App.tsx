import React, { useEffect, useState, useCallback } from 'react';
import type { User, Room, ChatMessage } from './types';
import { api, authStorage } from './services/api';
import { AuthScreen } from './components/AuthScreen';
import { Sidebar } from './components/Sidebar';
import { ChatHeader } from './components/ChatHeader';
import { MessageList } from './components/MessageList';
import { MessageInput } from './components/MessageInput';
import { useWebSocket } from './hooks/useWebSocket';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(authStorage.getToken());
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState<string>('general');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Handle incoming real-time message
  const handleNewMessage = useCallback((newMsg: ChatMessage) => {
    setMessages((prev) => {
      // Prevent duplicate messages by id
      if (prev.some((m) => m.id === newMsg.id)) {
        return prev;
      }
      return [...prev, newMsg];
    });
  }, []);

  // WebSocket hook
  const {
    isConnected,
    onlineUsers,
    onlineCount,
    typingUsers,
    sendMessage: sendWSMessage,
    sendTyping,
  } = useWebSocket({
    token,
    currentRoomId,
    onNewMessage: handleNewMessage,
  });

  // Verify initial token on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await api.getMe();
        setCurrentUser(user);
        if (!user) {
          setToken(null);
        }
      } catch (err) {
        console.error('Failed to verify token:', err);
        setCurrentUser(null);
        setToken(null);
      } finally {
        setIsLoadingUser(false);
      }
    };

    initAuth();
  }, []);

  // Load rooms when authenticated
  useEffect(() => {
    if (!currentUser) return;

    const fetchRooms = async () => {
      try {
        const roomList = await api.getRooms();
        setRooms(roomList);
        if (roomList.length > 0 && !roomList.some((r) => r.id === currentRoomId)) {
          setCurrentRoomId(roomList[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch rooms:', err);
      }
    };

    fetchRooms();
  }, [currentUser]);

  // Load messages whenever current room changes
  useEffect(() => {
    if (!currentUser || !currentRoomId) return;

    let isMounted = true;
    setIsLoadingMessages(true);

    api
      .getRoomMessages(currentRoomId)
      .then((msgs) => {
        if (isMounted) {
          setMessages(msgs);
        }
      })
      .catch((err) => {
        console.error('Failed to load messages for room:', err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingMessages(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser, currentRoomId]);

  const handleAuthSuccess = (user: User, newToken: string) => {
    setCurrentUser(user);
    setToken(newToken);
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setToken(null);
    setMessages([]);
  };

  const handleSendMessage = (text: string) => {
    const sent = sendWSMessage(text);
    // If WS not open, fallback to REST
    if (!sent) {
      api.sendMessage(currentRoomId, text).catch((err) => {
        console.error('REST fallback message send failed:', err);
      });
    }
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Tizim yuklanmoqda...</p>
      </div>
    );
  }

  if (!currentUser || !token) {
    return <AuthScreen onSuccess={handleAuthSuccess} />;
  }

  const activeRoom = rooms.find((r) => r.id === currentRoomId) || rooms[0];
  const onlineInCurrentRoom = onlineUsers.filter((u) => u.currentRoomId === currentRoomId).length;

  return (
    <div className="h-screen w-screen flex bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        rooms={rooms}
        currentRoomId={currentRoomId}
        onSelectRoom={(id) => setCurrentRoomId(id)}
        onlineUsers={onlineUsers}
        currentUser={currentUser}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Chat View */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <ChatHeader
          currentRoom={activeRoom}
          isConnected={isConnected}
          onlineInRoom={onlineInCurrentRoom}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {isLoadingMessages ? (
          <div className="flex-1 flex items-center justify-center bg-slate-950/60">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span>Xabarlar yuklanmoqda...</span>
            </div>
          </div>
        ) : (
          <MessageList
            messages={messages}
            currentUser={currentUser}
            typingUsers={typingUsers}
          />
        )}

        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={sendTyping}
          disabled={!isConnected}
        />
      </main>
    </div>
  );
}
