import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Info } from 'lucide-react';
import type { ChatMessage, User } from '../types';

interface MessageListProps {
  messages: ChatMessage[];
  currentUser: User;
  typingUsers: string[];
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUser,
  typingUsers,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0 bg-slate-950/60"
    >
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 text-slate-400">
            <Info className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-300">Bu xonada hali xabarlar yo‘q</p>
          <p className="text-xs text-slate-500 mt-1">
            Birinchi bo‘lib xabar yozing va suhbatni boshlang!
          </p>
        </div>
      ) : (
        messages.map((msg) => {
          if (msg.isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <div className="text-[11px] px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-400 max-w-md text-center shadow-xs">
                  {msg.text}
                </div>
              </div>
            );
          }

          const isMe = msg.userId === currentUser.id;

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className={`flex gap-2.5 items-end ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              {/* Other user's avatar */}
              {!isMe && (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm"
                  style={{ backgroundColor: msg.avatarColor || '#3b82f6' }}
                  title={`${msg.displayName || msg.username} (@${msg.username})`}
                >
                  {(msg.displayName || msg.username).charAt(0).toUpperCase()}
                </div>
              )}

              {/* Message bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-md ${
                  isMe
                    ? 'bg-blue-600 text-white rounded-br-xs'
                    : 'bg-slate-800/95 text-slate-100 border border-slate-700/70 rounded-bl-xs'
                }`}
              >
                {!isMe && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-blue-400">
                      {msg.displayName || msg.username}
                    </span>
                    <span className="text-[10px] text-slate-400">@{msg.username}</span>
                  </div>
                )}

                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {msg.text}
                </p>

                <div
                  className={`flex items-center justify-end mt-1 text-[10px] ${
                    isMe ? 'text-blue-200' : 'text-slate-400'
                  }`}
                >
                  <span>{formatTime(msg.timestamp)}</span>
                </div>
              </div>

              {/* My avatar */}
              {isMe && (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm"
                  style={{ backgroundColor: currentUser.avatarColor || '#3b82f6' }}
                  title="Siz"
                >
                  {(currentUser.displayName || currentUser.username).charAt(0).toUpperCase()}
                </div>
              )}
            </motion.div>
          );
        })
      )}

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-slate-400 italic px-2 py-1">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0.4s]" />
          </div>
          <span>
            {typingUsers.join(', ')} yozmoqda...
          </span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
