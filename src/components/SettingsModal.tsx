import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Sliders,
  Volume2,
  Database,
  ShieldCheck,
  Moon,
  Sun,
  Trash2,
  Download,
  Play,
  RotateCcw,
  Check,
} from 'lucide-react';
import { UserSettings, Conversation } from '../types';
import { speechManager } from '../utils/speech';
import { exportConversationsAsJson } from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  conversations: Conversation[];
  onClearAllConversations: () => void;
  isDark: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  conversations,
  onClearAllConversations,
  isDark,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'voice' | 'profile' | 'data' | 'api'>('general');
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setAvailableVoices(window.speechSynthesis.getVoices());
      window.speechSynthesis.onvoiceschanged = () => {
        setAvailableVoices(window.speechSynthesis.getVoices());
      };
    }
  }, []);

  const handleSave = () => {
    onUpdateSettings(localSettings);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 1500);
  };

  const handleTestVoice = () => {
    speechManager.speak(
      "Hello! This is Zubair AI speaking. Ask anything, create anything, and learn without limits.",
      {
        voiceName: localSettings.voiceName,
        rate: localSettings.speechRate,
        pitch: localSettings.speechPitch,
      }
    );
  };

  if (!isOpen) return null;

  const avatarOptions = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${
          isDark
            ? 'bg-[#120a26] border-purple-500/40 text-purple-100'
            : 'bg-white border-purple-200 text-gray-800'
        }`}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold">Zubair AI Settings & Profile</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-purple-500/10 text-purple-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 sm:px-6 pt-3 border-b border-purple-500/20 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'general', label: 'General & Model', icon: Sliders },
            { id: 'voice', label: 'Voice & Speech', icon: Volume2 },
            { id: 'profile', label: 'User Profile', icon: User },
            { id: 'data', label: 'Chat History & Data', icon: Database },
            { id: 'api', label: 'System & API', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-2.5 border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-purple-400 text-purple-300'
                    : 'border-transparent text-purple-300/60 hover:text-purple-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs sm:text-sm">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-5">
              {/* Theme Preference */}
              <div>
                <label className="block font-bold mb-2">Theme Mode</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setLocalSettings({ ...localSettings, theme: 'dark' })
                    }
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-semibold transition ${
                      localSettings.theme === 'dark'
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                        : 'bg-purple-950/20 border-purple-800/40 text-purple-300'
                    }`}
                  >
                    <Moon className="w-4 h-4 text-purple-300" />
                    <span>Dark Mode (Signature Black & Purple)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setLocalSettings({ ...localSettings, theme: 'light' })
                    }
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-semibold transition ${
                      localSettings.theme === 'light'
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                        : 'bg-purple-50 border-purple-200 text-purple-900'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Light Mode</span>
                  </button>
                </div>
              </div>

              {/* Default Model */}
              <div>
                <label className="block font-bold mb-1">Default AI Model</label>
                <p className="text-xs text-purple-300/70 mb-2">
                  Choose the model Zubair AI uses for conversations.
                </p>
                <select
                  value={localSettings.model}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      model: e.target.value as any,
                    })
                  }
                  className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none ${
                    isDark
                      ? 'bg-[#180f33] border-purple-700/40 text-white'
                      : 'bg-white border-purple-200 text-gray-900'
                  }`}
                >
                  <option value="gemini-3.8-flash">
                    Zubair Fast (Gemini 3.8 Flash) — Ultra-responsive & multimodal
                  </option>
                  <option value="gemini-4-argon">
                    Zubair Deep Reasoning (Gemini 4 Argon) — Deep thinking for STEM & Architecture
                  </option>
                </select>
              </div>

              {/* Creativity / Temperature Slider */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold">Response Creativity (Temperature)</label>
                  <span className="font-mono text-xs text-purple-400 font-bold">
                    {localSettings.temperature}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.2"
                  step="0.05"
                  value={localSettings.temperature}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      temperature: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-purple-300/60 mt-1">
                  <span>Precise & Factual (0.1)</span>
                  <span>Balanced (0.7)</span>
                  <span>Highly Creative (1.2)</span>
                </div>
              </div>

              {/* Custom System Prompt */}
              <div>
                <label className="block font-bold mb-1">
                  Custom AI Persona / System Instructions
                </label>
                <textarea
                  value={localSettings.systemPrompt}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      systemPrompt: e.target.value,
                    })
                  }
                  rows={4}
                  className={`w-full p-3 rounded-xl border text-xs focus:outline-none ${
                    isDark
                      ? 'bg-[#180f33] border-purple-700/40 text-white placeholder-purple-300/40'
                      : 'bg-white border-purple-200 text-gray-900'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Voice Tab */}
          {activeTab === 'voice' && (
            <div className="space-y-5">
              {/* Voice selector */}
              <div>
                <label className="block font-bold mb-1">Voice Accent & Persona</label>
                <select
                  value={localSettings.voiceName}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      voiceName: e.target.value,
                    })
                  }
                  className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none ${
                    isDark
                      ? 'bg-[#180f33] border-purple-700/40 text-white'
                      : 'bg-white border-purple-200 text-gray-900'
                  }`}
                >
                  <option value="">Default AI Voice</option>
                  {availableVoices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleTestVoice}
                  className="mt-2 text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Test Voice Sample</span>
                </button>
              </div>

              {/* Speech Rate */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold">Speech Rate (Speed)</label>
                  <span className="font-mono text-xs text-purple-400 font-bold">
                    {localSettings.speechRate}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.5"
                  step="0.05"
                  value={localSettings.speechRate}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      speechRate: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              {/* Auto Speak Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-purple-500/20 bg-purple-950/20">
                <div>
                  <p className="font-bold text-xs">Auto-read AI Responses</p>
                  <p className="text-[11px] text-purple-300/60">
                    Automatically speak every new assistant reply aloud.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.autoSpeak}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      autoSpeak: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* User Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div>
                <label className="block font-bold mb-1">Display Name</label>
                <input
                  type="text"
                  value={localSettings.userProfile.name}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      userProfile: {
                        ...localSettings.userProfile,
                        name: e.target.value,
                      },
                    })
                  }
                  className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none ${
                    isDark
                      ? 'bg-[#180f33] border-purple-700/40 text-white'
                      : 'bg-white border-purple-200 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Email / Account</label>
                <input
                  type="email"
                  value={localSettings.userProfile.email}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      userProfile: {
                        ...localSettings.userProfile,
                        email: e.target.value,
                      },
                    })
                  }
                  className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none ${
                    isDark
                      ? 'bg-[#180f33] border-purple-700/40 text-white'
                      : 'bg-white border-purple-200 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Role / Headline</label>
                <input
                  type="text"
                  value={localSettings.userProfile.title}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      userProfile: {
                        ...localSettings.userProfile,
                        title: e.target.value,
                      },
                    })
                  }
                  className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none ${
                    isDark
                      ? 'bg-[#180f33] border-purple-700/40 text-white'
                      : 'bg-white border-purple-200 text-gray-900'
                  }`}
                />
              </div>

              {/* Choose Avatar */}
              <div>
                <label className="block font-bold mb-2">Select Avatar</label>
                <div className="flex items-center gap-3">
                  {avatarOptions.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt="Avatar option"
                      onClick={() =>
                        setLocalSettings({
                          ...localSettings,
                          userProfile: {
                            ...localSettings.userProfile,
                            avatar: url,
                          },
                        })
                      }
                      className={`w-12 h-12 rounded-xl object-cover cursor-pointer border-2 transition ${
                        localSettings.userProfile.avatar === url
                          ? 'border-purple-400 scale-105 shadow-md shadow-purple-500/50'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Data & History Tab */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-purple-500/20 bg-purple-950/20">
                <p className="font-bold text-xs mb-1">Chat Statistics</p>
                <p className="text-xs text-purple-300/70">
                  Total saved conversations:{' '}
                  <span className="font-bold text-white">
                    {conversations.length}
                  </span>
                </p>
                <p className="text-xs text-purple-300/70">
                  Total messages:{' '}
                  <span className="font-bold text-white">
                    {conversations.reduce(
                      (acc, cur) => acc + cur.messages.length,
                      0
                    )}
                  </span>
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => exportConversationsAsJson(conversations)}
                  className="py-2.5 px-4 rounded-xl border border-purple-500/40 bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 font-semibold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Export All Conversations (JSON)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConfirmClearOpen(true)}
                  className="py-2.5 px-4 rounded-xl border border-rose-500/40 bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 font-semibold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Clear All Chat History</span>
                </button>
              </div>

              {confirmClearOpen && (
                <div className="p-4 rounded-2xl border border-rose-500/40 bg-rose-950/60 text-xs text-rose-200 space-y-3">
                  <p className="font-bold">
                    Are you sure you want to delete all conversations?
                  </p>
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => setConfirmClearOpen(false)}
                      className="px-3 py-1.5 rounded-lg text-purple-200 hover:bg-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        onClearAllConversations();
                        setConfirmClearOpen(false);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold"
                    >
                      Yes, Clear All
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* API & System Tab */}
          {activeTab === 'api' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-purple-500/30 bg-[#160d2e] space-y-2">
                <div className="flex items-center gap-2 text-purple-300 font-bold">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Connected AI Engine Architecture</span>
                </div>
                <p className="text-xs text-purple-200/80 leading-relaxed">
                  Zubair AI operates on an Express full-stack proxy architecture. Secrets
                  and API keys are strictly retained on the backend runtime environment.
                </p>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-950/20 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-white">Chat & Vision Model</p>
                    <p className="text-[11px] text-purple-300/70">
                      gemini-3.8-flash (Streaming SSE + Multimodal Vision)
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                    Active
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-950/20 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-white">Deep Reasoning Model</p>
                    <p className="text-[11px] text-purple-300/70">
                      gemini-4-argon (Complex reasoning & code architecture)
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                    Ready
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-950/20 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-white">Image Synthesis Engine</p>
                    <p className="text-[11px] text-purple-300/70">
                      gemini-3.1-flash-lite-image (High fidelity image generation)
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300">
                    Enabled
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-950/20 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-white">Live Voice & Audio</p>
                    <p className="text-[11px] text-purple-300/70">
                      Web Speech API + gemini-3.8-flash-lite-tts & transcribe
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                    Enabled
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-purple-500/20 flex items-center justify-between bg-black/20">
          <span className="text-xs text-purple-300/60 font-medium">
            Zubair AI v2.6 Pro
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-purple-300 hover:text-white hover:bg-purple-500/10 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-purple-600/30 transition flex items-center gap-1.5"
            >
              {saveFeedback ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
