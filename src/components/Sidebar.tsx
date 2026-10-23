import React, { useState } from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  Sparkles,
  Compass,
  Settings as SettingsIcon,
  Pin,
  Trash2,
  Edit2,
  Check,
  X,
  Download,
  Share2,
  ChevronLeft,
} from 'lucide-react';
import { Conversation, ViewTab, UserProfile } from '../types';
import { ZubairLogo } from './ZubairLogo';
import { exportConversationAsMarkdown } from '../utils/storage';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onTogglePin: (id: string) => void;
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  userProfile: UserProfile;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onTogglePin,
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  isDark,
  userProfile,
  onOpenSettings,
  onOpenAuth,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter conversations
  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConversations = filteredConversations.filter((c) => c.pinned);
  const recentConversations = filteredConversations.filter((c) => !c.pinned);

  const startEditing = (c: Conversation) => {
    setEditingId(c.id);
    setEditTitle(c.title);
  };

  const saveEditing = (id: string) => {
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-72 flex flex-col transition-transform duration-300 ease-in-out border-r ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          isDark
            ? 'bg-[#0e081f] border-purple-900/30 text-purple-100'
            : 'bg-white border-purple-100 text-gray-800'
        }`}
      >
        {/* Top Header */}
        <div className="p-4 border-b border-purple-500/20 flex items-center justify-between">
          <ZubairLogo size="sm" />
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-purple-300 hover:bg-purple-500/10 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action: New Chat */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              onSelectTab('chat');
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold flex items-center justify-between text-sm shadow-lg shadow-purple-600/30 transition duration-200 active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/20 text-purple-200">
              ⌘K
            </span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-3 py-1 space-y-1">
          <button
            onClick={() => {
              onSelectTab('chat');
              if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              currentTab === 'chat'
                ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30'
                : 'text-purple-300/70 hover:bg-purple-500/10 hover:text-purple-200'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <span>AI Assistant Chat</span>
          </button>

          <button
            onClick={() => {
              onSelectTab('image-studio');
              if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              currentTab === 'image-studio'
                ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30'
                : 'text-purple-300/70 hover:bg-purple-500/10 hover:text-purple-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span>Image Studio</span>
          </button>

          <button
            onClick={() => {
              onSelectTab('explore');
              if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              currentTab === 'explore'
                ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30'
                : 'text-purple-300/70 hover:bg-purple-500/10 hover:text-purple-200'
            }`}
          >
            <Compass className="w-4 h-4 text-indigo-400" />
            <span>Explore AI Tools</span>
          </button>
        </div>

        {/* Search Conversations Input */}
        <div className="px-3 pt-3 pb-2">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
              isDark
                ? 'bg-[#140b2a] border-purple-800/40 text-purple-200'
                : 'bg-purple-50/60 border-purple-200 text-gray-700'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chat history..."
              className="w-full bg-transparent focus:outline-none placeholder-purple-300/40"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Conversations History List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {/* Pinned Chats */}
          {pinnedConversations.length > 0 && (
            <div>
              <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-purple-400/80 mb-1 flex items-center gap-1">
                <Pin className="w-3 h-3" />
                <span>Pinned</span>
              </p>
              <div className="space-y-0.5">
                {pinnedConversations.map((c) => renderConversationItem(c))}
              </div>
            </div>
          )}

          {/* Recent Chats */}
          <div>
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-purple-400/80 mb-1">
              Conversations
            </p>
            {recentConversations.length === 0 && pinnedConversations.length === 0 ? (
              <p className="px-2 py-4 text-xs text-center text-purple-300/40">
                {searchQuery ? 'No matching conversations' : 'No chats yet. Start asking!'}
              </p>
            ) : (
              <div className="space-y-0.5">
                {recentConversations.map((c) => renderConversationItem(c))}
              </div>
            )}
          </div>
        </div>

        {/* User Account / Profile Footer */}
        <div className="p-3 border-t border-purple-500/20">
          <div
            className={`flex items-center justify-between p-2 rounded-2xl border transition ${
              isDark
                ? 'bg-[#150d2c]/80 border-purple-800/40'
                : 'bg-purple-50/60 border-purple-200'
            }`}
          >
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-90 transition flex-1"
            >
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                className="w-8 h-8 rounded-xl object-cover border border-purple-400/40"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-purple-100 truncate">
                  {userProfile.name}
                </p>
                <p className="text-[10px] text-purple-300/60 truncate">
                  {userProfile.title}
                </p>
              </div>
            </button>

            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg text-purple-300/70 hover:text-white hover:bg-purple-500/20 transition"
              title="Settings"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#150d2e] border border-purple-500/40 rounded-2xl p-5 max-w-sm w-full text-white shadow-2xl">
            <h3 className="text-base font-bold mb-2">Delete Chat?</h3>
            <p className="text-xs text-purple-200/80 mb-5 leading-relaxed">
              This will permanently delete this conversation and its messages. This action
              cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-xs font-medium rounded-xl hover:bg-purple-500/10 text-purple-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteConversation(deletingId);
                  setDeletingId(null);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition shadow-lg shadow-rose-600/30"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  function renderConversationItem(c: Conversation) {
    const isActive = activeId === c.id && currentTab === 'chat';
    const isEditingThis = editingId === c.id;

    return (
      <div
        key={c.id}
        className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors duration-150 ${
          isActive
            ? isDark
              ? 'bg-purple-600/25 text-white font-medium border border-purple-500/40'
              : 'bg-purple-100/90 text-purple-950 font-medium border border-purple-300'
            : isDark
            ? 'text-purple-200/75 hover:bg-purple-500/10 hover:text-white'
            : 'text-gray-700 hover:bg-purple-50 hover:text-gray-900'
        }`}
      >
        {isEditingThis ? (
          <div className="flex items-center gap-1 w-full">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEditing(c.id);
                if (e.key === 'Escape') setEditingId(null);
              }}
              autoFocus
              className="flex-1 bg-black/40 border border-purple-500/50 rounded px-2 py-1 text-xs text-white focus:outline-none"
            />
            <button
              onClick={() => saveEditing(c.id)}
              className="p-1 hover:text-emerald-400"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setEditingId(null)}
              className="p-1 hover:text-rose-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => {
                onSelectConversation(c.id);
                onSelectTab('chat');
                if (window.innerWidth < 1024) onClose();
              }}
              className="flex items-center gap-2 min-w-0 flex-1 text-left"
            >
              <MessageSquare className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="truncate">{c.title}</span>
            </button>

            {/* Hover Actions */}
            <div className="hidden group-hover:flex items-center gap-1 text-purple-300/70 ml-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(c.id);
                }}
                className={`p-1 rounded hover:text-white transition ${
                  c.pinned ? 'text-purple-400' : ''
                }`}
                title={c.pinned ? 'Unpin chat' : 'Pin chat'}
              >
                <Pin className="w-3 h-3" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing(c);
                }}
                className="p-1 rounded hover:text-white transition"
                title="Rename"
              >
                <Edit2 className="w-3 h-3" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  exportConversationAsMarkdown(c);
                }}
                className="p-1 rounded hover:text-white transition"
                title="Export as Markdown"
              >
                <Download className="w-3 h-3" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeletingId(c.id);
                }}
                className="p-1 rounded hover:text-rose-400 transition"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </>
        )}
      </div>
    );
  }
};
