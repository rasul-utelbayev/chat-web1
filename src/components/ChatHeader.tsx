import React from 'react';
import { Menu, LogOut, Wifi, WifiOff, Users } from 'lucide-react';
import type { Room, User } from '../types';

interface ChatHeaderProps {
  currentRoom?: Room;
  isConnected: boolean;
  onlineInRoom: number;
  currentUser: User;
  onLogout: () => void;
  onOpenMobileSidebar: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  currentRoom,
  isConnected,
  onlineInRoom,
  currentUser,
  onLogout,
  onOpenMobileSidebar,
}) => {
  return (
    <header className="h-16 px-4 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between shrink-0 backdrop-blur-md">
      <div className="flex items-center gap-3 min-w-0">
        <button
          id="btn-open-sidebar"
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          aria-label="Xonalar menyusi"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white truncate">
              {currentRoom?.name || 'Suhbat'}
            </h1>
            {isConnected ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">Ulangan</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Qayta ulanmoqda...</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 truncate max-w-md hidden sm:block">
            {currentRoom?.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/50">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>Xonada: {onlineInRoom} ta</span>
        </div>

        <button
          id="btn-logout"
          type="button"
          onClick={onLogout}
          title="Tizimdan chiqish"
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium text-slate-300 hover:text-red-400 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/30 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Chiqish</span>
        </button>
      </div>
    </header>
  );
};
