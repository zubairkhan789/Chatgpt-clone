import React from 'react';
import {
  Code,
  Briefcase,
  Sparkles,
  GraduationCap,
  ArrowRight,
  Globe,
  PenTool,
  Lightbulb,
} from 'lucide-react';
import { ZubairLogo } from './ZubairLogo';

interface WelcomeScreenProps {
  onSelectPrompt: (prompt: string, isImageGen?: boolean) => void;
  isDark: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onSelectPrompt,
  isDark,
}) => {
  const promptCategories = [
    {
      title: 'Web Dev & Code',
      icon: Code,
      iconColor: 'text-violet-400',
      bgColor: 'from-violet-900/30 to-purple-900/10',
      borderColor: 'border-violet-500/30',
      prompts: [
        'Build a modern responsive agency landing page with Tailwind CSS for Zubair WebsiteWala',
        'Write a complete authentication flow in TypeScript with error handling',
      ],
    },
    {
      title: 'Business & Growth',
      icon: Briefcase,
      iconColor: 'text-purple-400',
      bgColor: 'from-purple-900/30 to-indigo-900/10',
      borderColor: 'border-purple-500/30',
      prompts: [
        'Draft a high-ticket client proposal for custom website design & AI tools',
        'Generate 5 viral marketing hooks for a digital services launch in 2026',
      ],
    },
    {
      title: 'AI Image Studio',
      icon: Sparkles,
      iconColor: 'text-pink-400',
      bgColor: 'from-pink-900/30 to-purple-900/10',
      borderColor: 'border-pink-500/30',
      isImageGen: true,
      prompts: [
        'Create a professional 3D minimalist logo for Zubair WebsiteWala',
        'Generate a futuristic cyberpunk AI assistant in an ultra-modern purple neon office',
      ],
    },
    {
      title: 'Writing & Research',
      icon: GraduationCap,
      iconColor: 'text-indigo-400',
      bgColor: 'from-indigo-900/30 to-blue-900/10',
      borderColor: 'border-indigo-500/30',
      prompts: [
        'Write an executive summary and competitive analysis for AI automation',
        'Explain neural networks and transformer architecture step-by-step',
      ],
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col items-center justify-center my-auto">
      {/* Central Brand Emblem */}
      <div className="relative mb-6 text-center flex flex-col items-center">
        <div className="absolute -inset-6 bg-gradient-to-r from-purple-600/30 via-violet-600/20 to-indigo-600/30 rounded-full blur-3xl opacity-50"></div>
        <ZubairLogo size="xl" showSubtitle={false} className="justify-center mb-3" />
        <h1
          className={`text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}
        >
          What can I help you create today?
        </h1>
        <p className="text-sm sm:text-base text-purple-300/80 mt-1 max-w-md font-medium">
          "Ask Anything. Create Anything. Learn Without Limits."
        </p>
        <span className="text-xs text-purple-400/70 mt-0.5 font-semibold">
          Powered by Zubair WebsiteWala
        </span>
      </div>

      {/* Suggested Prompt Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full mt-2">
        {promptCategories.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition duration-200 ${
                isDark
                  ? `bg-gradient-to-br ${cat.bgColor} ${cat.borderColor} hover:border-purple-400/60`
                  : 'bg-white border-purple-200 hover:border-purple-400 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-1.5 rounded-lg bg-black/40 ${cat.iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h3
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isDark ? 'text-purple-200' : 'text-purple-900'
                  }`}
                >
                  {cat.title}
                </h3>
              </div>

              <div className="space-y-2">
                {cat.prompts.map((promptText, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => onSelectPrompt(promptText, cat.isImageGen)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs font-medium transition duration-150 flex items-center justify-between group ${
                      isDark
                        ? 'bg-[#150d2c]/60 border-purple-800/30 text-purple-100 hover:bg-purple-600/20 hover:border-purple-500/50 hover:text-white'
                        : 'bg-purple-50/70 border-purple-100 text-gray-800 hover:bg-purple-100 hover:border-purple-300'
                    }`}
                  >
                    <span className="line-clamp-2 pr-2">{promptText}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-purple-400 opacity-0 group-hover:opacity-100 transition shrink-0 transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
