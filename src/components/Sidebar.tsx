import React from 'react';
import { MessageSquare, Code2, HelpCircle, Coffee, Users, Radio, Hash } from 'lucide-react';
import type { Room, OnlineUser, User } from '../types';

interface SidebarProps {
  rooms: Room[];
  currentRoomId: string;
  onSelectRoom: (roomId: string) => void;
  onlineUsers: OnlineUser[];
  currentUser: User;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  rooms,
  currentRoomId,
  onSelectRoom,
  onlineUsers,
  currentUser,
  isOpenMobile,
  onCloseMobile,
}) => {
  const getRoomIcon = (iconName: string) => {
    switch (iconName) {
      case 'Code2':
        return <Code2 className="w-4 h-4" />;
      case 'HelpCircle':
        return <HelpCircle className="w-4 h-4" />;
      case 'Coffee':
        return <Coffee className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* App Title & Brand in Sidebar */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">JONLI CHAT</h2>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Mustahkam Backend
              </p>
            </div>
          </div>
        </div>

        {/* Channels / Rooms List */}
        <div className="p-3 border-b border-slate-800/60">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Xonalar ({rooms.length})
            </span>
          </div>
          <div className="space-y-1">
            {rooms.map((room) => {
              const isActive = room.id === currentRoomId;
              const onlineInRoom = onlineUsers.filter((u) => u.currentRoomId === room.id).length;

              return (
                <button
                  id={`room-btn-${room.id}`}
                  key={room.id}
                  onClick={() => {
                    onSelectRoom(room.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={isActive ? 'text-blue-400' : 'text-slate-400'}>
                      {getRoomIcon(room.icon)}
                    </span>
                    <span className="truncate">{room.name}</span>
                  </div>
                  {onlineInRoom > 0 && (
                    <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                      {onlineInRoom}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Online Users List */}
        <div className="flex-1 overflow-y-auto p-3 min-h-0">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Online Foydalanuvchilar ({onlineUsers.length})
            </span>
          </div>

          <div className="space-y-1">
            {onlineUsers.length === 0 ? (
              <p className="text-xs text-slate-500 px-2 py-3">Hech kim online emas</p>
            ) : (
              onlineUsers.map((u) => {
                const isMe = u.id === currentUser.id;
                return (
                  <div
                    key={u.id}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="relative shrink-0">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-[11px]"
                        style={{ backgroundColor: u.avatarColor || '#3b82f6' }}
                      >
                        {(u.displayName || u.username).charAt(0).toUpperCase()}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-medium text-slate-200">
                          {u.displayName || u.username}
                        </span>
                        {isMe && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            Siz
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 block truncate">
                        @{u.username}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Current user badge footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl bg-slate-800/50 border border-slate-700/40">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-inner"
              style={{ backgroundColor: currentUser.avatarColor || '#3b82f6' }}
            >
              {(currentUser.displayName || currentUser.username).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {currentUser.displayName || currentUser.username}
              </p>
              <p className="text-[10px] text-slate-400 truncate">@{currentUser.username}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
