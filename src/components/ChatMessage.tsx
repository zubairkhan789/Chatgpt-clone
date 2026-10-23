import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Copy,
  Check,
  RotateCw,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Download,
  ExternalLink,
  Edit2,
  Sparkles,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Maximize2,
} from 'lucide-react';
import { Message, GroundingSource } from '../types';
import { speechManager } from '../utils/speech';

interface ChatMessageProps {
  message: Message;
  isDark: boolean;
  onRegenerate?: () => void;
  onEditPrompt?: (newContent: string) => void;
  onRequestImageVariation?: (prompt: string) => void;
  voiceName?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isDark,
  onRegenerate,
  onEditPrompt,
  onRequestImageVariation,
  voiceName,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  const isUser = message.role === 'user';

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = (codeText: string, index: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  const handleSpeak = () => {
    if (isSpeaking && !isPaused) {
      speechManager.pause();
      setIsPaused(true);
    } else if (isSpeaking && isPaused) {
      speechManager.resume();
      setIsPaused(false);
    } else {
      speechManager.speak(message.content, {
        voiceName,
        onStateChange: (speaking, paused) => {
          setIsSpeaking(speaking);
          setIsPaused(paused);
        },
        onEnd: () => {
          setIsSpeaking(false);
          setIsPaused(false);
        },
      });
    }
  };

  const handleStopSpeech = () => {
    speechManager.stop();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && onEditPrompt) {
      onEditPrompt(editContent);
      setIsEditing(false);
    }
  };

  const handleDownloadImage = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename || 'zubair-ai-image'}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div
      className={`group relative w-full py-5 px-4 sm:px-6 transition-colors duration-200 ${
        isUser
          ? isDark
            ? 'bg-transparent'
            : 'bg-transparent'
          : isDark
          ? 'bg-[#140e28]/70 border-y border-purple-900/20'
          : 'bg-purple-50/70 border-y border-purple-100'
      }`}
    >
      <div className="max-w-4xl mx-auto flex gap-4 items-start">
        {/* Avatar */}
        <div className="shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-purple-600/30">
              You
            </div>
          ) : (
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 via-purple-700 to-black border border-purple-400/40 flex items-center justify-center text-white shadow-md shadow-purple-900/40">
                <Sparkles className="w-4 h-4 text-purple-200" />
              </div>
              {message.isStreaming && (
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Message Body */}
        <div className="flex-1 min-w-0">
          {/* Sender Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-semibold ${
                  isUser
                    ? isDark
                      ? 'text-white'
                      : 'text-gray-900'
                    : 'bg-gradient-to-r from-purple-400 to-violet-300 bg-clip-text text-transparent font-bold'
                }`}
              >
                {isUser ? 'You' : 'Zubair AI'}
              </span>
              <span className="text-xs text-purple-300/40">
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {/* User message edit button */}
            {isUser && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover:opacity-100 transition text-xs flex items-center gap-1 text-purple-300/60 hover:text-purple-300 px-2 py-1 rounded hover:bg-purple-500/10"
                title="Edit message"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
          </div>

          {/* Attachments preview if present */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2.5 my-3">
              {message.attachments.map((att) => (
                <div
                  key={att.id}
                  className={`flex items-center gap-2 rounded-xl p-2 border ${
                    isDark
                      ? 'bg-purple-950/40 border-purple-800/40'
                      : 'bg-white border-purple-200'
                  } max-w-xs`}
                >
                  {att.type === 'image' ? (
                    <img
                      src={att.previewUrl || att.base64}
                      alt={att.name}
                      className="w-14 h-14 object-cover rounded-lg border border-purple-500/30"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0 pr-1">
                    <p className={`text-xs font-medium truncate ${isDark ? 'text-purple-100' : 'text-gray-900'}`}>
                      {att.name}
                    </p>
                    <p className="text-[10px] text-purple-300/60">
                      {(att.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* User message edit form */}
          {isUser && isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className={`w-full text-sm p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y ${
                  isDark
                    ? 'bg-[#1c1536] border-purple-700/50 text-white placeholder-purple-300/40'
                    : 'bg-white border-purple-200 text-gray-900'
                }`}
              />
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs rounded-lg text-purple-300/70 hover:text-purple-200 hover:bg-purple-500/10 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow hover:opacity-90 transition"
                >
                  Send update
                </button>
              </div>
            </div>
          ) : (
            /* Render message text */
            <div
              className={`prose prose-sm max-w-none break-words leading-relaxed ${
                isDark ? 'prose-invert text-purple-50' : 'text-gray-800'
              }`}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Custom Code Block Renderer
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');
                    const language = match ? match[1] : '';

                    if (!inline && (match || codeString.includes('\n'))) {
                      const codeIndex = Math.random();
                      return (
                        <div className="relative my-4 rounded-xl overflow-hidden border border-purple-500/30 bg-[#0d0918] shadow-xl text-left">
                          {/* Code Block Header */}
                          <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-purple-950/80 to-[#120a22] border-b border-purple-500/20 text-xs text-purple-300">
                            <span className="font-mono uppercase font-bold tracking-wider text-[11px] text-purple-400">
                              {language || 'code'}
                            </span>
                            <button
                              onClick={() => handleCopyCode(codeString, codeIndex)}
                              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 transition"
                              title="Copy code"
                            >
                              {copiedCodeIndex === codeIndex ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400 font-medium">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                          {/* Code Content */}
                          <pre className="p-4 overflow-x-auto text-[13px] font-mono leading-relaxed text-purple-100 bg-transparent selection:bg-purple-700/50">
                            <code className={className} {...props}>
                              {codeString}
                            </code>
                          </pre>
                        </div>
                      );
                    }

                    return (
                      <code
                        className="px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-200 font-mono text-[13px] border border-purple-500/30"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  table({ children }: any) {
                    return (
                      <div className="my-4 overflow-x-auto rounded-xl border border-purple-500/30">
                        <table className="min-w-full divide-y divide-purple-500/30 text-sm">
                          {children}
                        </table>
                      </div>
                    );
                  },
                  th({ children }: any) {
                    return (
                      <th className="px-3.5 py-2.5 text-left font-semibold text-purple-200 bg-purple-950/60 text-xs uppercase tracking-wider">
                        {children}
                      </th>
                    );
                  },
                  td({ children }: any) {
                    return (
                      <td className="px-3.5 py-2 text-sm border-t border-purple-900/30">
                        {children}
                      </td>
                    );
                  },
                  a({ href, children }: any) {
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple-400 hover:text-purple-300 underline font-medium inline-flex items-center gap-1"
                      >
                        {children}
                        <ExternalLink className="w-3 h-3 inline" />
                      </a>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>

              {message.isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-purple-400 animate-pulse align-middle" />
              )}
            </div>
          )}

          {/* Generated Image Preview Card */}
          {message.generatedImage && (
            <div className="mt-4 rounded-2xl border border-purple-500/40 bg-gradient-to-b from-purple-950/40 to-black p-3.5 overflow-hidden shadow-xl max-w-md">
              <div className="relative group overflow-hidden rounded-xl border border-purple-500/30">
                <img
                  src={message.generatedImage.imageUrl}
                  alt={message.generatedImage.prompt}
                  className="w-full h-auto object-cover max-h-96 transition duration-300 group-hover:scale-[1.02] cursor-pointer"
                  onClick={() => setImageModalOpen(true)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end justify-between p-3">
                  <button
                    onClick={() => setImageModalOpen(true)}
                    className="p-2 rounded-lg bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm transition"
                    title="Expand image"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      handleDownloadImage(
                        message.generatedImage!.imageUrl,
                        message.generatedImage!.prompt.slice(0, 20)
                      )
                    }
                    className="p-2 rounded-lg bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm transition flex items-center gap-1.5 text-xs"
                    title="Download image"
                  >
                    <Download className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-between text-xs">
                <p className="text-purple-300/80 truncate max-w-[70%]">
                  "{message.generatedImage.prompt}"
                </p>
                {onRequestImageVariation && (
                  <button
                    onClick={() =>
                      onRequestImageVariation(
                        `Variations of ${message.generatedImage?.prompt}`
                      )
                    }
                    className="text-purple-400 hover:text-purple-200 font-medium underline flex items-center gap-1"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Remake</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Web Search Grounding Citations */}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-purple-900/30">
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-400 mb-2 flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Web Sources & Citations</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {message.sources.map((source: GroundingSource, idx: number) => (
                  <a
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs transition duration-200 hover:scale-[1.01] ${
                      isDark
                        ? 'bg-[#18112e]/70 border-purple-800/40 hover:border-purple-600 text-purple-200'
                        : 'bg-white border-purple-200 hover:border-purple-400 text-purple-900 shadow-sm'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 text-[10px] font-bold">
                      {idx + 1}
                    </div>
                    <span className="truncate font-medium flex-1">{source.title}</span>
                    <ExternalLink className="w-3 h-3 text-purple-400/60 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {message.error && (
            <div className="mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center justify-between">
              <span>{message.error}</span>
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="px-2.5 py-1 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold transition"
                >
                  Retry
                </button>
              )}
            </div>
          )}

          {/* Assistant Action Bar */}
          {!isUser && !message.isStreaming && (
            <div className="mt-3 flex items-center gap-2 pt-1 text-xs text-purple-300/60">
              {/* Copy message */}
              <button
                onClick={handleCopyMessage}
                className="p-1.5 rounded-lg hover:bg-purple-500/10 hover:text-purple-200 transition flex items-center gap-1"
                title="Copy response"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              {/* Text to Speech controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleSpeak}
                  className={`p-1.5 rounded-lg transition flex items-center gap-1 ${
                    isSpeaking
                      ? 'bg-purple-500/20 text-purple-300 font-medium animate-pulse'
                      : 'hover:bg-purple-500/10 hover:text-purple-200'
                  }`}
                  title={isSpeaking ? (isPaused ? 'Resume speaking' : 'Pause speech') : 'Read aloud'}
                >
                  {isSpeaking ? (
                    isPaused ? (
                      <Play className="w-3.5 h-3.5" />
                    ) : (
                      <Pause className="w-3.5 h-3.5" />
                    )
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                  <span>{isSpeaking ? (isPaused ? 'Resume' : 'Pause') : 'Listen'}</span>
                </button>

                {isSpeaking && (
                  <button
                    onClick={handleStopSpeech}
                    className="p-1.5 rounded-lg hover:bg-purple-500/10 text-rose-400 hover:text-rose-300 transition"
                    title="Stop speaking"
                  >
                    <VolumeX className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Regenerate */}
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="p-1.5 rounded-lg hover:bg-purple-500/10 hover:text-purple-200 transition flex items-center gap-1"
                  title="Regenerate response"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Regenerate</span>
                </button>
              )}

              {/* Thumbs up / down feedback */}
              <div className="ml-auto flex items-center gap-1">
                <button
                  onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
                  className={`p-1.5 rounded-lg transition ${
                    feedback === 'up'
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : 'hover:bg-purple-500/10 hover:text-purple-200'
                  }`}
                  title="Good response"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
                  className={`p-1.5 rounded-lg transition ${
                    feedback === 'down'
                      ? 'text-rose-400 bg-rose-500/10'
                      : 'hover:bg-purple-500/10 hover:text-purple-200'
                  }`}
                  title="Poor response"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {imageModalOpen && message.generatedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setImageModalOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={message.generatedImage.imageUrl}
              alt={message.generatedImage.prompt}
              className="max-w-full max-h-[80vh] rounded-2xl object-contain border border-purple-500/40 shadow-2xl"
            />
            <div className="mt-4 flex items-center justify-between w-full text-white px-2">
              <p className="text-sm font-medium truncate max-w-lg">
                {message.generatedImage.prompt}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    handleDownloadImage(
                      message.generatedImage!.imageUrl,
                      message.generatedImage!.prompt
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Image</span>
                </button>
                <button
                  onClick={() => setImageModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
