import { useEffect, useRef, useState, useCallback } from 'react';
import type { ChatMessage, OnlineUser, WSClientAction, WSServerAction } from '../types';

interface UseWebSocketOptions {
  token: string | null;
  currentRoomId: string;
  onNewMessage?: (message: ChatMessage) => void;
}

export function useWebSocket({ token, currentRoomId, onNewMessage }: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [typingMap, setTypingMap] = useState<Record<string, { username: string; displayName: string; timer: any }>>({});

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const pingIntervalRef = useRef<any>(null);
  const onNewMessageRef = useRef(onNewMessage);
  onNewMessageRef.current = onNewMessage;

  const currentRoomIdRef = useRef(currentRoomId);
  currentRoomIdRef.current = currentRoomId;

  const connect = useCallback(() => {
    if (!token) return;

    // Build ws url based on current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        // Authenticate
        const authPayload: WSClientAction = { type: 'auth', token };
        ws.send(JSON.stringify(authPayload));

        // Join current room
        const joinPayload: WSClientAction = { type: 'join_room', roomId: currentRoomIdRef.current };
        ws.send(JSON.stringify(joinPayload));

        // Heartbeat keep-alive
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 20000);
      };

      ws.onmessage = (event) => {
        try {
          const action: WSServerAction = JSON.parse(event.data);

          switch (action.type) {
            case 'new_message': {
              if (onNewMessageRef.current) {
                onNewMessageRef.current(action.message);
              }
              break;
            }

            case 'presence_update': {
              setOnlineUsers(action.onlineUsers);
              setOnlineCount(action.count);
              break;
            }

            case 'user_typing': {
              if (action.roomId === currentRoomIdRef.current) {
                setTypingMap((prev) => {
                  const updated = { ...prev };
                  if (updated[action.username]?.timer) {
                    clearTimeout(updated[action.username].timer);
                  }

                  if (action.isTyping) {
                    const timer = setTimeout(() => {
                      setTypingMap((curr) => {
                        const copy = { ...curr };
                        delete copy[action.username];
                        return copy;
                      });
                    }, 3000);

                    updated[action.username] = {
                      username: action.username,
                      displayName: action.displayName,
                      timer,
                    };
                  } else {
                    delete updated[action.username];
                  }
                  return updated;
                });
              }
              break;
            }

            case 'pong':
              // Alive
              break;
          }
        } catch (err) {
          console.error('Error handling WS event:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

        // Schedule auto-reconnect
        if (token) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch (err) {
      console.error('Failed to initiate WebSocket connection:', err);
    }
  }, [token]);

  // Connect / disconnect on token change
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  // Handle room switch
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'join_room', roomId: currentRoomId }));
    }
    // Clear typing indicators when switching rooms
    setTypingMap({});
  }, [currentRoomId]);

  const sendMessage = useCallback((text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'send_message',
          roomId: currentRoomIdRef.current,
          text,
        })
      );
      return true;
    }
    return false;
  }, []);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'typing',
          roomId: currentRoomIdRef.current,
          isTyping,
        })
      );
    }
  }, []);

  const typingUserNames = Object.values(typingMap).map((u) => u.displayName || u.username);

  return {
    isConnected,
    onlineUsers,
    onlineCount,
    typingUsers: typingUserNames,
    sendMessage,
    sendTyping,
  };
}
