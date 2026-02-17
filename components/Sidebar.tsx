import React from 'react';
import { Plus, MessageSquare, LogOut, Trash2, X, Shield } from 'lucide-react';
import { ChatSession } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onLogout: () => void;
  username: string;
  isAdmin?: boolean;
  onToggleAdmin?: () => void;
  showAdminPanel?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onLogout,
  username,
  isAdmin,
  onToggleAdmin,
  showAdminPanel
}) => {
  // Group sessions by date could be done here, but simple list for now
  const sortedSessions = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);

  const avatarUrl = `https://api.dicebear.com/9.x/adventurer/svg?seed=${username}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="font-semibold text-zinc-800 dark:text-zinc-100">
             {isAdmin && showAdminPanel ? "Admin Panel" : "Chat History"}
          </div>
          <button onClick={onClose} className="md:hidden text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4 space-y-2">
          <button
            onClick={() => {
              if (showAdminPanel && onToggleAdmin) onToggleAdmin(); // Switch back to chat
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700/50 rounded-xl p-3 flex items-center justify-center gap-2 transition-all group"
          >
            <Plus size={18} className="text-hara-600 dark:text-hara-500 group-hover:scale-110 transition-transform" />
            <span className="font-medium text-sm">New Chat</span>
          </button>
          
          {/* Admin Toggle Button */}
          {isAdmin && onToggleAdmin && (
             <button
               onClick={() => {
                   onToggleAdmin();
                   if (window.innerWidth < 768) onClose();
               }}
               className={`w-full border rounded-xl p-3 flex items-center justify-center gap-2 transition-all group
                 ${showAdminPanel 
                    ? 'bg-hara-600 text-white border-hara-500 shadow-lg shadow-hara-500/20' 
                    : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'}
               `}
             >
               <Shield size={18} className={showAdminPanel ? "text-white" : "text-hara-600 dark:text-hara-500"} />
               <span className="font-medium text-sm">{showAdminPanel ? "Close Admin" : "Admin Dashboard"}</span>
             </button>
          )}
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {sortedSessions.length === 0 ? (
            <div className="text-center text-zinc-500 dark:text-zinc-600 text-sm mt-10 p-4">
              No chat history yet.<br/>Start a new conversation!
            </div>
          ) : (
            sortedSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => {
                  if (showAdminPanel && onToggleAdmin) onToggleAdmin(); // Switch back to chat
                  onSelectSession(session.id);
                  if (window.innerWidth < 768) onClose();
                }}
                className={`
                  w-full text-left p-3 rounded-lg text-sm flex items-center gap-3 transition-colors group relative
                  ${currentSessionId === session.id && !showAdminPanel
                    ? 'bg-zinc-200 dark:bg-zinc-800/80 text-zinc-900 dark:text-white shadow-sm ring-1 ring-zinc-300 dark:ring-zinc-700' 
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200'}
                `}
              >
                <MessageSquare size={16} className={currentSessionId === session.id && !showAdminPanel ? 'text-hara-600 dark:text-hara-500' : 'opacity-50'} />
                <span className="truncate pr-8 flex-1">{session.title}</span>
                
                {/* Delete Button */}
                <div 
                  onClick={(e) => onDeleteSession(session.id, e)}
                  className="absolute right-2 p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-zinc-200 dark:hover:bg-zinc-700/50 rounded opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={14} />
                </div>
              </button>
            ))
          )}
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shrink-0">
                <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
              </div>
              <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">
                {username}
                {isAdmin && <span className="ml-2 text-[10px] text-hara-600 dark:text-hara-400 font-bold border border-hara-500/30 px-1 rounded">OP</span>}
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};