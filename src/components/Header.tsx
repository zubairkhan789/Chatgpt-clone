import React, { useState } from 'react';
import {
  Menu,
  Sparkles,
  Zap,
  Brain,
  Globe,
  Sun,
  Moon,
  PhoneCall,
  Share2,
  Download,
  Check,
  ChevronDown,
} from 'lucide-react';
import { Conversation } from '../types';
import { exportConversationAsMarkdown, exportConversationsAsJson } from '../utils/storage';

interface HeaderProps {
  onToggleSidebar: () => void;
  activeConversation?: Conversation;
  model: 'gemini-3.8-flash' | 'gemini-4-argon';
  onChangeModel: (model: 'gemini-3.8-flash' | 'gemini-4-argon') => void;
  enableWebSearch: boolean;
  onToggleWebSearch: () => void;
  onOpenLiveVoice: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  allConversations: Conversation[];
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  activeConversation,
  model,
  onChangeModel,
  enableWebSearch,
  onToggleWebSearch,
  onOpenLiveVoice,
  isDark,
  onToggleTheme,
  allConversations,
}) => {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  return (
    <header
      className={`h-14 px-4 border-b flex items-center justify-between sticky top-0 z-30 backdrop-blur-xl transition-colors duration-200 ${
        isDark
          ? 'bg-[#0b0716]/80 border-purple-900/30 text-white'
          : 'bg-white/80 border-purple-100 text-gray-900'
      }`}
    >
      {/* Left section: Sidebar toggle & Model Selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-purple-300 hover:text-white hover:bg-purple-500/10 transition"
          title="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Model Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-xs font-semibold transition ${
              isDark
                ? 'bg-[#150d2c] border-purple-500/30 hover:border-purple-400 text-purple-100'
                : 'bg-purple-50 border-purple-200 hover:border-purple-300 text-purple-950'
            }`}
          >
            {model === 'gemini-3.8-flash' ? (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Zubair Fast (Flash 3.8)</span>
              </>
            ) : (
              <>
                <Brain className="w-3.5 h-3.5 text-purple-400" />
                <span>Zubair Deep Reasoning (Argon 4)</span>
              </>
            )}
            <ChevronDown className="w-3 h-3 text-purple-400 opacity-70" />
          </button>

          {modelDropdownOpen && (
            <div
              className={`absolute top-full left-0 mt-2 w-72 rounded-2xl border shadow-2xl p-2 z-50 ${
                isDark
                  ? 'bg-[#140b2a] border-purple-500/40 text-purple-100'
                  : 'bg-white border-purple-200 text-gray-800'
              }`}
            >
              <div
                onClick={() => {
                  onChangeModel('gemini-3.8-flash');
                  setModelDropdownOpen(false);
                }}
                className={`p-2.5 rounded-xl cursor-pointer transition flex items-start gap-2.5 ${
                  model === 'gemini-3.8-flash'
                    ? 'bg-purple-600/20 border border-purple-500/40'
                    : 'hover:bg-purple-500/10'
                }`}
              >
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold">Zubair Fast (Flash 3.8)</p>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                      Fast
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-300/60 mt-0.5">
                    Ultra-fast multimodal reasoning, code generation, vision, and instant chat.
                  </p>
                </div>
              </div>

              <div
                onClick={() => {
                  onChangeModel('gemini-4-argon');
                  setModelDropdownOpen(false);
                }}
                className={`p-2.5 rounded-xl cursor-pointer transition flex items-start gap-2.5 mt-1 ${
                  model === 'gemini-4-argon'
                    ? 'bg-purple-600/20 border border-purple-500/40'
                    : 'hover:bg-purple-500/10'
                }`}
              >
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 shrink-0 mt-0.5">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold">Zubair Deep Reasoning (Argon 4)</p>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 font-semibold">
                      Thinking
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-300/60 mt-0.5">
                    Complex algorithms, intricate system architecture, math, and deep logic.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right section: Live Voice, Web Search, Theme, Share */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Live Voice Button */}
        <button
          onClick={onOpenLiveVoice}
          className="relative group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition hover:scale-105 active:scale-95"
          title="Open real-time voice call mode"
        >
          <PhoneCall className="w-3.5 h-3.5 text-purple-200 animate-pulse" />
          <span className="hidden sm:inline">Live Voice</span>
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-400"></span>
          </span>
        </button>

        {/* Web Search Grounding Toggle */}
        <button
          onClick={onToggleWebSearch}
          className={`p-2 rounded-xl transition ${
            enableWebSearch
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
              : 'text-purple-300/70 hover:text-white hover:bg-purple-500/10'
          }`}
          title={enableWebSearch ? 'Web search enabled' : 'Enable live Google search grounding'}
        >
          <Globe className="w-4 h-4" />
        </button>

        {/* Export / Share Dropdown */}
        <div className="relative">
          <button
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            className="p-2 rounded-xl text-purple-300/70 hover:text-white hover:bg-purple-500/10 transition"
            title="Export or share"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {exportMenuOpen && (
            <div
              className={`absolute right-0 top-full mt-2 w-48 rounded-2xl border shadow-xl p-1.5 z-50 text-xs ${
                isDark
                  ? 'bg-[#150d2e] border-purple-500/40 text-purple-200'
                  : 'bg-white border-purple-200 text-gray-800'
              }`}
            >
              <button
                onClick={() => {
                  handleShareLink();
                  setExportMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-purple-500/10 flex items-center gap-2"
              >
                {shareCopied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Share2 className="w-3.5 h-3.5" />
                )}
                <span>{shareCopied ? 'Link Copied!' : 'Copy App Link'}</span>
              </button>

              {activeConversation && (
                <button
                  onClick={() => {
                    exportConversationAsMarkdown(activeConversation);
                    setExportMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-purple-500/10 flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Chat (MD)</span>
                </button>
              )}

              <button
                onClick={() => {
                  exportConversationsAsJson(allConversations);
                  setExportMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-purple-500/10 flex items-center gap-2 border-t border-purple-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export All (JSON)</span>
              </button>
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl text-purple-300/70 hover:text-white hover:bg-purple-500/10 transition"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-purple-600" />
          )}
        </button>
      </div>
    </header>
  );
};
