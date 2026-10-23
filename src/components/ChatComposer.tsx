import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Sparkles,
  Image as ImageIcon,
  Paperclip,
  Mic,
  MicOff,
  Globe,
  X,
  Radio,
  FileText,
} from 'lucide-react';
import { Attachment } from '../types';
import { createSpeechRecognition, isSpeechRecognitionSupported } from '../utils/speech';

interface ChatComposerProps {
  onSendMessage: (
    content: string,
    attachments: Attachment[],
    isImageGen: boolean,
    imageConfig?: { aspectRatio: string }
  ) => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
  enableWebSearch: boolean;
  onToggleWebSearch: () => void;
  isDark: boolean;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  onSendMessage,
  isStreaming,
  onStopStreaming,
  enableWebSearch,
  onToggleWebSearch,
  isDark,
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isImageGenMode, setIsImageGenMode] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('1:1');
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [input]);

  const handleSend = () => {
    if ((!input.trim() && attachments.length === 0) || isStreaming) return;

    onSendMessage(
      input.trim(),
      attachments,
      isImageGenMode,
      isImageGenMode ? { aspectRatio } : undefined
    );

    setInput('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle file uploads
  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      // Validate file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 20MB.`);
        return;
      }

      const reader = new FileReader();
      const isImg = file.type.startsWith('image/');
      const isDoc =
        file.type === 'application/pdf' ||
        file.type.includes('text') ||
        file.name.endsWith('.csv') ||
        file.name.endsWith('.json');

      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const newAttachment: Attachment = {
          id: Math.random().toString(36).substring(7),
          name: file.name,
          mimeType: file.type || (file.name.endsWith('.csv') ? 'text/csv' : 'text/plain'),
          size: file.size,
          base64,
          previewUrl: isImg ? base64 : '',
          type: isImg ? 'image' : 'document',
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };

      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Toggle voice recognition
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      setSpeechError(null);
      if (!isSpeechRecognitionSupported()) {
        setSpeechError('Speech recognition is not supported in this browser.');
        return;
      }

      try {
        const recognition = createSpeechRecognition(
          (transcript, isFinal) => {
            setInput((prev) => {
              const cleaned = prev ? `${prev} ` : '';
              return `${cleaned}${transcript}`;
            });
          },
          (error) => {
            setSpeechError(error);
            setIsListening(false);
          },
          () => {
            setIsListening(false);
          }
        );

        if (recognition) {
          recognitionRef.current = recognition;
          recognition.start();
          setIsListening(true);
        }
      } catch (err: any) {
        console.error('Failed to start speech recognition:', err);
        setSpeechError('Could not start microphone.');
        setIsListening(false);
      }
    }
  };

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  return (
    <div
      className="w-full max-w-4xl mx-auto px-4 pb-4 sm:pb-6 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileUpload(e.target.files)}
        multiple
        accept="image/*,.pdf,.txt,.csv,.json,.md,.js,.ts,.html,.css"
        className="hidden"
      />

      {/* Drag overlay notice */}
      {dragOver && (
        <div className="absolute inset-0 mx-4 mb-4 rounded-3xl border-2 border-dashed border-purple-400 bg-purple-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-purple-200">
          <ImageIcon className="w-10 h-10 mb-2 animate-bounce text-purple-300" />
          <p className="font-semibold text-sm">Drop images or documents here</p>
          <p className="text-xs text-purple-300/70">Zubair AI will inspect them</p>
        </div>
      )}

      {/* Main Composer Box */}
      <div
        className={`relative rounded-3xl border transition-all duration-300 shadow-2xl backdrop-blur-xl ${
          dragOver
            ? 'border-purple-400 ring-4 ring-purple-500/20'
            : isDark
            ? 'bg-[#150f29]/90 border-purple-500/30 focus-within:border-purple-400/80 focus-within:shadow-purple-950/50'
            : 'bg-white/95 border-purple-200 focus-within:border-purple-400 focus-within:shadow-purple-100'
        }`}
      >
        {/* Active Mode Banner: Image Generation or Web Search */}
        {(isImageGenMode || enableWebSearch || isListening || speechError) && (
          <div className="flex flex-wrap items-center gap-2 px-4 pt-3 pb-1 border-b border-purple-500/20 text-xs">
            {isImageGenMode && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-purple-600/30 to-pink-600/20 text-purple-200 px-2.5 py-1 rounded-full border border-purple-500/40 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
                <span>Image Generation Mode</span>
                <div className="flex items-center gap-1 ml-1 pl-1 border-l border-purple-500/30">
                  {(['1:1', '16:9', '9:16', '4:3'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition ${
                        aspectRatio === ratio
                          ? 'bg-purple-500 text-white font-bold'
                          : 'hover:bg-purple-500/20 text-purple-300'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setIsImageGenMode(false)}
                  className="hover:text-white ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {enableWebSearch && (
              <div className="flex items-center gap-1.5 bg-blue-500/20 text-blue-200 px-2.5 py-1 rounded-full border border-blue-500/40 font-medium">
                <Globe className="w-3.5 h-3.5 text-blue-300" />
                <span>Web Grounding Active</span>
                <button
                  type="button"
                  onClick={onToggleWebSearch}
                  className="hover:text-white ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {isListening && (
              <div className="flex items-center gap-1.5 bg-rose-500/20 text-rose-200 px-2.5 py-1 rounded-full border border-rose-500/40 animate-pulse font-medium">
                <Radio className="w-3.5 h-3.5 text-rose-400" />
                <span>Listening... speak now</span>
                <button
                  type="button"
                  onClick={toggleListening}
                  className="hover:text-white ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {speechError && (
              <div className="flex items-center gap-1.5 bg-amber-500/20 text-amber-200 px-2.5 py-1 rounded-full border border-amber-500/40 text-[11px]">
                <span>{speechError}</span>
                <button
                  type="button"
                  onClick={() => setSpeechError(null)}
                  className="hover:text-white ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Attachment preview chips */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pt-3">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="relative group flex items-center gap-2 rounded-xl p-1.5 pr-2 border border-purple-500/40 bg-purple-950/60 backdrop-blur-md max-w-xs shadow"
              >
                {att.type === 'image' ? (
                  <img
                    src={att.previewUrl}
                    alt={att.name}
                    className="w-10 h-10 object-cover rounded-lg border border-purple-500/30"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0 pr-1">
                  <p className="text-xs font-medium text-purple-100 truncate max-w-[120px]">
                    {att.name}
                  </p>
                  <p className="text-[10px] text-purple-300/60">
                    {(att.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="p-1 rounded-full bg-black/60 text-purple-300 hover:text-white transition"
                  title="Remove attachment"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Text Area */}
        <div className="px-4 pt-3 pb-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isImageGenMode
                ? "Describe the image you want to create (e.g. 'A futuristic AI workspace with purple holographic charts for Zubair WebsiteWala')..."
                : 'Ask Zubair AI anything, write code, analyze data, brainstorm...'
            }
            rows={1}
            className={`w-full max-h-48 resize-none text-sm md:text-base focus:outline-none bg-transparent placeholder-purple-300/40 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          />
        </div>

        {/* Bottom Toolbar */}
        <div className="flex items-center justify-between px-3 pb-3 pt-1">
          {/* Left Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5 text-purple-300/70">
            {/* File / Image Upload */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl hover:bg-purple-500/10 hover:text-purple-200 transition"
              title="Upload image or document"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Toggle Image Generation Mode */}
            <button
              type="button"
              onClick={() => setIsImageGenMode(!isImageGenMode)}
              className={`p-2 rounded-xl transition flex items-center gap-1.5 text-xs font-medium ${
                isImageGenMode
                  ? 'bg-purple-500/30 text-purple-200 border border-purple-500/40 shadow-sm'
                  : 'hover:bg-purple-500/10 hover:text-purple-200'
              }`}
              title="Image Generation Mode"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">Image Gen</span>
            </button>

            {/* Toggle Web Search Grounding */}
            <button
              type="button"
              onClick={onToggleWebSearch}
              className={`p-2 rounded-xl transition flex items-center gap-1.5 text-xs font-medium ${
                enableWebSearch
                  ? 'bg-blue-500/30 text-blue-200 border border-blue-500/40 shadow-sm'
                  : 'hover:bg-purple-500/10 hover:text-purple-200'
              }`}
              title="Web Search Grounding"
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Search</span>
            </button>

            {/* Microphone Voice Input */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2 rounded-xl transition flex items-center gap-1.5 text-xs font-medium ${
                isListening
                  ? 'bg-rose-500/30 text-rose-200 border border-rose-500/40 animate-pulse'
                  : 'hover:bg-purple-500/10 hover:text-purple-200'
              }`}
              title={isListening ? 'Stop recording voice' : 'Speak to Zubair AI'}
            >
              {isListening ? (
                <MicOff className="w-4 h-4 text-rose-400" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{isListening ? 'Stop' : 'Voice'}</span>
            </button>
          </div>

          {/* Right Action: Send or Stop */}
          <div>
            {isStreaming ? (
              <button
                type="button"
                onClick={onStopStreaming}
                className="p-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition flex items-center gap-1.5 text-xs shadow-lg shadow-purple-600/40"
                title="Stop response generation"
              >
                <Square className="w-4 h-4 fill-white" />
                <span className="hidden sm:inline">Stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() && attachments.length === 0}
                className={`p-2.5 rounded-2xl font-semibold transition flex items-center justify-center ${
                  input.trim() || attachments.length > 0
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/40 hover:scale-105 active:scale-95'
                    : 'bg-purple-900/30 text-purple-400/40 cursor-not-allowed'
                }`}
                title="Send message (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-purple-300/40 mt-2 px-3">
        <span>Zubair AI can make mistakes. Verify important information.</span>
        <span className="hidden sm:inline">Shift + Enter for new line</span>
      </div>
    </div>
  );
};
