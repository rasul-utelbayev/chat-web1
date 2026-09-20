import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
}

const QUICK_EMOJIS = ['👍', '👋', '❤️', '🔥', '😂', '💻', '🚀', '✨'];

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTyping,
  disabled,
}) => {
  const [text, setText] = useState('');
  const typingTimeoutRef = useRef<any>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    onSendMessage(trimmed);
    setText('');
    onTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Re-focus input
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);

    // Notify typing
    onTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 2000);
  };

  const handleAddEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  return (
    <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900/95 shrink-0">
      {/* Quick emoji chips */}
      <div className="flex items-center gap-1.5 mb-2.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-slate-500 flex items-center gap-1 text-[11px] shrink-0 mr-1 select-none">
          <Smile className="w-3.5 h-3.5" />
          Tezkor:
        </span>
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleAddEmoji(emoji)}
            className="px-2 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs transition-colors shrink-0 cursor-pointer"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input box */}
      <div className="flex items-end gap-2 bg-slate-950 border border-slate-800 rounded-2xl p-2 focus-within:border-blue-500/70 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
        <textarea
          ref={inputRef}
          id="chat-message-input"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Xabaringizni yozing... (Yuborish uchun Enter)"
          rows={1}
          disabled={disabled}
          className="flex-1 max-h-32 bg-transparent text-sm text-slate-100 placeholder-slate-500 px-2 py-1.5 focus:outline-none resize-none"
        />

        <button
          id="btn-send-message"
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-600/30 cursor-pointer shrink-0"
          title="Yuborish (Enter)"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      <p className="text-[10px] text-slate-500 mt-1.5 px-2 hidden sm:block">
        💡 <b>Enter</b> — xabar yuborish, <b>Shift + Enter</b> — yangi qatorga o‘tish
      </p>
    </div>
  );
};
