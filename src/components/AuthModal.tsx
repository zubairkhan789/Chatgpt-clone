import React, { useState } from 'react';
import { X, Lock, Mail, User, LogOut, Check, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';
import { ZubairLogo } from './ZubairLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  isDark: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  isDark,
}) => {
  const [isSignUp, setIsSignUp] = useState(!currentUser.isCustomAuth);
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState(currentUser.avatar);

  const avatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onUpdateUser({
      name: name.trim(),
      email: email.trim() || 'user@zubair-ai.com',
      avatar,
      title: 'Zubair AI Member',
      isCustomAuth: true,
    });
    onClose();
  };

  const handleLogout = () => {
    onUpdateUser({
      name: 'Zubair Guest',
      email: 'guest@zubair-ai.com',
      avatar: avatars[0],
      title: 'Explorer',
      isCustomAuth: false,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 ${
          isDark
            ? 'bg-[#120a26] border-purple-500/40 text-purple-100'
            : 'bg-white border-purple-200 text-gray-800'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <ZubairLogo size="sm" />
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-500/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {currentUser.isCustomAuth ? (
          /* User Profile & Log Out view */
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-400"
              />
              <div>
                <h3 className="font-bold text-base text-white">{currentUser.name}</h3>
                <p className="text-xs text-purple-300/80">{currentUser.email}</p>
                <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  Zubair AI Pro Member
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-2.5 px-4 rounded-xl border border-rose-500/40 bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 font-semibold text-xs flex items-center justify-center gap-2 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out & Switch to Guest</span>
            </button>
          </div>
        ) : (
          /* Sign In / Sign Up Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center mb-2">
              <h3 className="text-lg font-bold text-white">
                {isSignUp ? 'Create your Zubair AI Account' : 'Welcome back to Zubair AI'}
              </h3>
              <p className="text-xs text-purple-300/70 mt-0.5">
                Save preferences, customize AI models, and sync conversations.
              </p>
            </div>

            {/* Avatar selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-purple-200">
                Choose Profile Avatar
              </label>
              <div className="flex items-center gap-2">
                {avatars.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt="avatar option"
                    onClick={() => setAvatar(url)}
                    className={`w-10 h-10 rounded-xl object-cover cursor-pointer border-2 transition ${
                      avatar === url
                        ? 'border-purple-400 scale-105 shadow-md shadow-purple-500/50'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-purple-200">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-purple-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Zubair WebsiteWala"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs focus:outline-none ${
                    isDark
                      ? 'bg-[#180f33] border-purple-700/40 text-white placeholder-purple-300/40'
                      : 'bg-white border-purple-200 text-gray-900'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-purple-200">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-purple-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs focus:outline-none ${
                    isDark
                      ? 'bg-[#180f33] border-purple-700/40 text-white placeholder-purple-300/40'
                      : 'bg-white border-purple-200 text-gray-900'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-purple-200">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-purple-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs focus:outline-none ${
                    isDark
                      ? 'bg-[#180f33] border-purple-700/40 text-white placeholder-purple-300/40'
                      : 'bg-white border-purple-200 text-gray-900'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 transition duration-200"
            >
              {isSignUp ? 'Create Account & Continue' : 'Sign In'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs text-purple-300/80 hover:text-white transition"
              >
                {isSignUp
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Sign Up"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
