import React from 'react';
import {
  Code,
  Globe,
  Briefcase,
  PenTool,
  GraduationCap,
  Sparkles,
  TrendingUp,
  FileCheck,
  Terminal,
  Languages,
  Zap,
} from 'lucide-react';

interface ExploreToolsProps {
  onStartToolChat: (title: string, initialPrompt: string, systemPrompt?: string) => void;
  isDark: boolean;
}

export const ExploreTools: React.FC<ExploreToolsProps> = ({
  onStartToolChat,
  isDark,
}) => {
  const tools = [
    {
      id: 'web-architect',
      title: 'Zubair WebsiteWala Web Architect',
      category: 'Development',
      badge: 'Featured',
      icon: Code,
      iconColor: 'text-violet-400',
      description:
        'Architect high-converting websites, modern full-stack web applications, clean Tailwind styling, and responsive UI components.',
      prompt:
        'Help me architect a modern high-performance website for my business with Next.js, Tailwind CSS, and interactive features.',
      systemPrompt:
        'You are the Zubair WebsiteWala Web Architect specialist. You provide elite full-stack web engineering advice, modern UI/UX design patterns, clean accessible code, and SEO best practices.',
    },
    {
      id: 'business-strategist',
      title: 'Startup & Digital Agency Strategist',
      category: 'Business',
      icon: Briefcase,
      iconColor: 'text-purple-400',
      description:
        'Formulate business models, digital marketing funnels, client proposals, and monetization strategies.',
      prompt:
        'Generate a comprehensive business expansion and client acquisition plan for a digital web services agency.',
      systemPrompt:
        'You are an expert digital business strategist and entrepreneur advisor. You provide actionable, ROI-focused frameworks and strategic growth tactics.',
    },
    {
      id: 'code-debugger',
      title: 'Bug Buster & Code Optimizer',
      category: 'Programming',
      icon: Terminal,
      iconColor: 'text-amber-400',
      description:
        'Paste any code snippet or stack trace for lightning-fast debugging, algorithmic optimization, and refactoring.',
      prompt:
        'I have a code snippet that is having performance issues and potential bugs. Can you analyze it step-by-step?',
    },
    {
      id: 'copywriter-pro',
      title: 'Executive Copywriter & CV Builder',
      category: 'Writing',
      icon: PenTool,
      iconColor: 'text-pink-400',
      description:
        'Draft polished professional resumes, cold pitch emails, contracts, landing page copy, and press releases.',
      prompt:
        'Write a high-converting cold email pitch for web design services that achieves a high response rate.',
    },
    {
      id: 'polyglot-translator',
      title: 'Multilingual Polyglot & Tutor',
      category: 'Language',
      icon: Languages,
      iconColor: 'text-emerald-400',
      description:
        'Translate text seamlessly across 50+ languages with idiomatic precision, tone adjustment, and grammar explanations.',
      prompt:
        'Translate this professional message into Spanish, German, and French while preserving executive tone.',
    },
    {
      id: 'stem-mentor',
      title: 'Mathematics & Science Mentor',
      category: 'Education',
      icon: GraduationCap,
      iconColor: 'text-blue-400',
      description:
        'Step-by-step solutions for complex math equations, physics phenomena, chemistry mechanisms, and data analysis.',
      prompt:
        'Explain the mathematical formulation of backpropagation in deep neural networks with step-by-step equations.',
    },
    {
      id: 'creative-script',
      title: 'Viral Script & Story Director',
      category: 'Creative',
      icon: Sparkles,
      iconColor: 'text-fuchsia-400',
      description:
        'Craft viral YouTube scripts, TikTok concepts, podcast structures, and captivating storytelling.',
      prompt:
        'Write an engaging 3-minute YouTube script about how AI assistants are changing web development in 2026.',
    },
    {
      id: 'data-analyst',
      title: 'Data & Financial Analyst',
      category: 'Analytics',
      icon: TrendingUp,
      iconColor: 'text-cyan-400',
      description:
        'Analyze raw spreadsheet tables, calculate metrics, build forecasting projections, and synthesize insights.',
      prompt:
        'Help me analyze and visualize a customer retention dataset and suggest key KPI improvements.',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Zap className="w-5 h-5" />
          </div>
          <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Explore Specialized AI Tools
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-purple-300/70">
          Supercharge your workflow with purpose-built AI agents calibrated for coding, business, languages, and creative mastery.
        </p>
      </div>

      {/* Grid of Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.id}
              className={`p-5 rounded-2xl border transition duration-200 flex flex-col justify-between hover:scale-[1.01] ${
                isDark
                  ? 'bg-[#150d2e] border-purple-500/30 hover:border-purple-400/60 shadow-xl'
                  : 'bg-white border-purple-200 hover:border-purple-400 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl bg-black/40 ${tool.iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3
                        className={`text-sm font-bold ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {tool.title}
                      </h3>
                      <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">
                        {tool.category}
                      </span>
                    </div>
                  </div>

                  {tool.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase">
                      {tool.badge}
                    </span>
                  )}
                </div>

                <p className="text-xs text-purple-200/80 leading-relaxed mb-4">
                  {tool.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  onStartToolChat(tool.title, tool.prompt, tool.systemPrompt)
                }
                className="w-full py-2.5 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-200 hover:text-white font-semibold text-xs border border-purple-500/30 transition flex items-center justify-center gap-2"
              >
                <span>Launch Assistant</span>
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
