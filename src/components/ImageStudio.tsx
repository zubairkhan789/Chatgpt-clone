import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  Image as ImageIcon,
  RotateCw,
  MessageSquare,
  Wand2,
  Check,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { GeneratedImageData } from '../types';

interface ImageStudioProps {
  onSendToChat: (prompt: string, image: GeneratedImageData) => void;
  isDark: boolean;
}

export const ImageStudio: React.FC<ImageStudioProps> = ({
  onSendToChat,
  isDark,
}) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('1:1');
  const [selectedStyle, setSelectedStyle] = useState('Photorealistic & Cinematic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<GeneratedImageData | null>(null);
  const [recentImages, setRecentImages] = useState<GeneratedImageData[]>([]);

  const examplePrompts = [
    'Create a professional logo for Zubair WebsiteWala.',
    'Generate a futuristic AI robot illustration.',
    'Design a YouTube thumbnail about artificial intelligence.',
    'Create a beautiful landscape image.',
    'A sleek 3D glassmorphic web development studio with glowing purple holographic UI screens.',
  ];

  const styles = [
    'Photorealistic & Cinematic',
    '3D Isometric & Glassmorphism',
    'Futuristic Cyberpunk',
    'Minimalist Modern Vector',
    'Anime & Concept Art',
    'Luxury Corporate Branding',
  ];

  const handleEnhancePrompt = () => {
    if (!prompt.trim()) return;
    setPrompt(
      `${prompt.trim()}, 8k resolution, cinematic lighting, ultra-detailed, artistic award-winning composition, Zubair WebsiteWala signature style`
    );
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
          style: selectedStyle,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate image. Please check API quota or try another prompt.');
      }

      const generated: GeneratedImageData = {
        imageUrl: data.imageUrl,
        prompt: prompt.trim(),
        aspectRatio,
        caption: data.caption,
      };

      setCurrentImage(generated);
      setRecentImages((prev) => [generated, ...prev]);
    } catch (err: any) {
      console.error('Image generation error:', err);
      setError(err?.message || 'Image generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (img: GeneratedImageData) => {
    const a = document.createElement('a');
    a.href = img.imageUrl;
    a.download = `zubair-ai-${img.prompt.slice(0, 15).replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-5xl mx-auto w-full">
      {/* Studio Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Zubair AI Image Studio
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-purple-300/70">
          Transform your imagination into high-fidelity visuals using state-of-the-art AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-4">
          {/* Prompt input */}
          <div
            className={`p-4 rounded-2xl border ${
              isDark
                ? 'bg-[#150d2e] border-purple-500/30'
                : 'bg-white border-purple-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <label
                className={`text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'text-purple-200' : 'text-purple-900'
                }`}
              >
                Image Description
              </label>
              <button
                type="button"
                onClick={handleEnhancePrompt}
                disabled={!prompt.trim()}
                className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold disabled:opacity-40"
              >
                <Wand2 className="w-3 h-3" />
                <span>Enhance</span>
              </button>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your vision in detail..."
              rows={4}
              className={`w-full text-xs sm:text-sm p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${
                isDark
                  ? 'bg-[#0f0822] border-purple-700/40 text-white placeholder-purple-300/40'
                  : 'bg-purple-50/50 border-purple-200 text-gray-900'
              }`}
            />

            {/* Example prompts */}
            <div className="mt-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400/80 mb-1.5">
                Quick Prompts:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {examplePrompts.map((ex, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(ex)}
                    className={`text-[11px] text-left px-2 py-1 rounded-lg border transition ${
                      isDark
                        ? 'bg-purple-950/40 border-purple-800/40 text-purple-200 hover:bg-purple-600/30 hover:border-purple-500'
                        : 'bg-purple-50 border-purple-200 text-purple-900 hover:bg-purple-100'
                    }`}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Aspect Ratio & Style */}
          <div
            className={`p-4 rounded-2xl border space-y-4 ${
              isDark
                ? 'bg-[#150d2e] border-purple-500/30'
                : 'bg-white border-purple-200 shadow-sm'
            }`}
          >
            {/* Aspect Ratio */}
            <div>
              <label
                className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
                  isDark ? 'text-purple-200' : 'text-purple-900'
                }`}
              >
                Aspect Ratio
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['1:1', '16:9', '9:16', '4:3'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold border text-center transition ${
                      aspectRatio === ratio
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                        : isDark
                        ? 'bg-purple-950/30 border-purple-800/40 text-purple-300 hover:bg-purple-900/40'
                        : 'bg-purple-50 border-purple-200 text-purple-900 hover:bg-purple-100'
                    }`}
                  >
                    <div className="text-[10px] font-mono opacity-80">{ratio}</div>
                    <div className="text-[11px]">
                      {ratio === '1:1'
                        ? 'Square'
                        : ratio === '16:9'
                        ? 'Banner'
                        : ratio === '9:16'
                        ? 'Story'
                        : 'Standard'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Style Selection */}
            <div>
              <label
                className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
                  isDark ? 'text-purple-200' : 'text-purple-900'
                }`}
              >
                Style Preset
              </label>
              <div className="grid grid-cols-2 gap-2">
                {styles.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setSelectedStyle(style)}
                    className={`p-2 rounded-xl text-xs font-medium text-left border transition ${
                      selectedStyle === style
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 font-semibold'
                        : isDark
                        ? 'bg-purple-950/30 border-purple-800/40 text-purple-300 hover:bg-purple-900/40'
                        : 'bg-purple-50 border-purple-200 text-purple-900 hover:bg-purple-100'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Action Button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition duration-200 shadow-xl ${
                !prompt.trim() || isGenerating
                  ? 'bg-purple-950/50 text-purple-400/40 cursor-not-allowed border border-purple-800/30'
                  : 'bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white shadow-purple-600/40 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isGenerating ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin text-white" />
                  <span>Generating Artwork...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-pink-200" />
                  <span>Generate Artwork</span>
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Preview / Results Column */}
        <div className="lg:col-span-7 space-y-4">
          <div
            className={`p-4 rounded-2xl border min-h-[440px] flex flex-col justify-between ${
              isDark
                ? 'bg-[#150d2e] border-purple-500/30'
                : 'bg-white border-purple-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'text-purple-200' : 'text-purple-900'
                }`}
              >
                Canvas Preview
              </span>
              {currentImage && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(currentImage)}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => onSendToChat(currentImage.prompt, currentImage)}
                    className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat about this</span>
                  </button>
                </div>
              )}
            </div>

            {/* Main Visual Display */}
            <div className="flex-1 flex items-center justify-center p-2 rounded-xl bg-black/40 border border-purple-500/20 overflow-hidden relative min-h-[350px]">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-3 text-center p-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-purple-500/20 border-t-purple-400 animate-spin" />
                    <Sparkles className="w-6 h-6 text-pink-400 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <p className="text-sm font-bold text-white">Synthesizing Pixels...</p>
                  <p className="text-xs text-purple-300/70 max-w-xs">
                    Applying "{selectedStyle}" aesthetic with Zubair AI creative models.
                  </p>
                </div>
              ) : currentImage ? (
                <div className="relative w-full h-full flex flex-col items-center">
                  <img
                    src={currentImage.imageUrl}
                    alt={currentImage.prompt}
                    className="max-h-[480px] w-auto max-w-full rounded-xl object-contain shadow-2xl"
                  />
                  <p className="text-xs text-purple-200/80 mt-3 text-center italic max-w-md">
                    "{currentImage.prompt}"
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center p-8 text-purple-300/40">
                  <ImageIcon className="w-14 h-14 mb-3 opacity-60" />
                  <p className="text-sm font-semibold text-purple-200/80">
                    Your canvas is blank
                  </p>
                  <p className="text-xs mt-1 max-w-sm">
                    Enter a prompt on the left or select an example to generate stunning AI artwork.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Generations Gallery */}
          {recentImages.length > 0 && (
            <div
              className={`p-4 rounded-2xl border ${
                isDark
                  ? 'bg-[#150d2e] border-purple-500/30'
                  : 'bg-white border-purple-200 shadow-sm'
              }`}
            >
              <h3
                className={`text-xs font-bold uppercase tracking-wider mb-3 ${
                  isDark ? 'text-purple-200' : 'text-purple-900'
                }`}
              >
                Recent Creations
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {recentImages.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setCurrentImage(img)}
                    className="relative group rounded-xl overflow-hidden border border-purple-500/30 cursor-pointer aspect-square"
                  >
                    <img
                      src={img.imageUrl}
                      alt={img.prompt}
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center p-2 text-center">
                      <p className="text-[10px] text-white line-clamp-2 font-medium">
                        {img.prompt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
