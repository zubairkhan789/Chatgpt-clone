import React from 'react';

interface ZubairLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

export const ZubairLogo: React.FC<ZubairLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Futuristic Gem Z Monogram */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-600 rounded-xl blur-sm opacity-70 group-hover:opacity-100 transition duration-500"></div>
        <div
          className={`relative ${iconSizes[size]} rounded-xl bg-gradient-to-br from-purple-950 via-[#180f33] to-black border border-purple-500/40 flex items-center justify-center shadow-lg shadow-purple-950/50`}
        >
          {/* Geometric Custom SVG Logo */}
          <svg
            viewBox="0 0 40 40"
            className="w-3/4 h-3/4"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background geometric accents */}
            <path
              d="M6 10L34 10L14 30L34 30"
              stroke="url(#zubairGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="10" cy="10" r="2.5" fill="#c084fc" />
            <circle cx="34" cy="10" r="2.5" fill="#818cf8" />
            <circle cx="14" cy="30" r="2.5" fill="#a855f7" />
            <circle cx="34" cy="30" r="2.5" fill="#6366f1" />
            <path
              d="M17 20L27 20"
              stroke="#e9d5ff"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient
                id="zubairGrad"
                x1="6"
                y1="10"
                x2="34"
                y2="30"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#c084fc" />
                <stop offset="0.5" stopColor="#a855f7" />
                <stop offset="1" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`font-black tracking-tight text-white ${textSizes[size]}`}
          >
            ChatGPT
          </span>
          <span className="text-purple-400/70 font-bold text-xs">•</span>
          <span
            className={`font-black tracking-tight bg-gradient-to-r from-purple-200 via-purple-100 to-violet-300 bg-clip-text text-transparent ${textSizes[size]}`}
          >
            Zubair AI
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-widest">
            PRO
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[11px] font-medium text-purple-300/70 tracking-wide">
            by Zubair WebsiteWala
          </span>
        )}
      </div>
    </div>
  );
};
