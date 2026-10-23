import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  VolumeX,
  Sparkles,
  RefreshCw,
  Radio,
} from 'lucide-react';
import { ZubairLogo } from './ZubairLogo';
import { createSpeechRecognition, speechManager, isSpeechRecognitionSupported } from '../utils/speech';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  voiceName?: string;
  onSelectVoice?: (voice: string) => void;
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({
  isOpen,
  onClose,
  voiceName = 'Kore',
  onSelectVoice,
}) => {
  const [status, setStatus] = useState<'listening' | 'thinking' | 'speaking' | 'idle'>('idle');
  const [transcript, setTranscript] = useState('');
  const [lastAiResponse, setLastAiResponse] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [voiceHistory, setVoiceHistory] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([]);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const recognitionRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        setAvailableVoices(window.speechSynthesis.getVoices());
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Start conversational session when opened
  useEffect(() => {
    if (isOpen) {
      setStatus('listening');
      startListening();
    } else {
      stopAll();
    }

    return () => {
      stopAll();
    };
  }, [isOpen]);

  const stopAll = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    speechManager.stop();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setStatus('idle');
  };

  const startListening = () => {
    if (!isSpeechRecognitionSupported()) {
      setTranscript('Speech recognition is not supported in this browser.');
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    try {
      const rec = createSpeechRecognition(
        (text, isFinal) => {
          setTranscript(text);
          if (isFinal && text.trim().length > 1) {
            handleUserUtterance(text.trim());
          }
        },
        (error) => {
          console.warn('Live voice recognition error:', error);
          setStatus('idle');
        },
        () => {
          // If ended naturally while listening, restart unless speaking
          if (status === 'listening' && !isMuted) {
            try {
              rec.start();
            } catch (e) {}
          }
        }
      );

      if (rec) {
        recognitionRef.current = rec;
        rec.start();
        setStatus('listening');
      }
    } catch (e) {
      console.error('Error starting live voice:', e);
    }
  };

  const handleUserUtterance = async (userText: string) => {
    // Stop recognition while AI thinks & speaks
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    setStatus('thinking');
    setVoiceHistory((prev) => [...prev, { role: 'user', text: userText }]);

    try {
      abortControllerRef.current = new AbortController();

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...voiceHistory.map((h) => ({
              role: h.role === 'user' ? 'user' : 'model',
              content: h.text,
            })),
            { role: 'user', content: userText },
          ],
          systemInstruction:
            'You are ChatGPT • Zubair AI created by Zubair WebsiteWala in Live Voice Call mode. Respond in conversational, concise spoken sentences without markdown, bullet points, or code blocks. Keep answers under 3 natural spoken sentences so the dialogue flows effortlessly.',
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) throw new Error('API request failed');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(line.slice(6));
                if (parsed.type === 'chunk') {
                  fullResponse += parsed.text;
                  setLastAiResponse(fullResponse);
                }
              } catch (e) {}
            }
          }
        }
      }

      const cleanSpoken = fullResponse.trim();
      if (cleanSpoken) {
        setVoiceHistory((prev) => [...prev, { role: 'ai', text: cleanSpoken }]);
        speakAiResponse(cleanSpoken);
      } else {
        setStatus('listening');
        startListening();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Voice chat error:', err);
        setLastAiResponse("I'm sorry, I couldn't reach the server. Let's try again.");
      }
      setStatus('listening');
      startListening();
    }
  };

  const speakAiResponse = (text: string) => {
    setStatus('speaking');

    speechManager.speak(text, {
      voiceName,
      rate: 1.05,
      pitch: 1.0,
      onEnd: () => {
        // Automatically resume listening for conversational flow
        setStatus('listening');
        setTranscript('');
        startListening();
      },
      onStateChange: (speaking) => {
        if (!speaking) {
          setStatus('listening');
          startListening();
        }
      },
    });
  };

  // User Interrupt action
  const handleInterrupt = () => {
    speechManager.stop();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setStatus('listening');
    setTranscript('');
    startListening();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#090514]/95 backdrop-blur-2xl flex flex-col justify-between items-center p-6 text-white animate-fade-in select-none">
      {/* Top Header */}
      <div className="w-full max-w-xl flex items-center justify-between">
        <ZubairLogo size="sm" />
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-purple-200 uppercase tracking-wider">
            Live Voice Call
          </span>
        </div>
      </div>

      {/* Center Interactive Animated Audio Orb */}
      <div className="flex flex-col items-center justify-center my-auto relative">
        {/* Ambient Orb Pulses */}
        <div className="relative flex items-center justify-center cursor-pointer" onClick={handleInterrupt}>
          {/* Ring 3 */}
          <div
            className={`absolute w-72 h-72 rounded-full border border-purple-500/20 transition-all duration-700 ${
              status === 'speaking'
                ? 'scale-125 opacity-60 animate-ping'
                : status === 'listening'
                ? 'scale-110 opacity-30 animate-pulse'
                : 'scale-90 opacity-10'
            }`}
          />
          {/* Ring 2 */}
          <div
            className={`absolute w-56 h-56 rounded-full bg-gradient-to-tr from-violet-600/20 to-purple-600/30 blur-xl transition-transform duration-500 ${
              status === 'speaking'
                ? 'scale-125 animate-pulse'
                : status === 'listening'
                ? 'scale-105'
                : 'scale-95'
            }`}
          />
          {/* Main Core Orb */}
          <div
            className={`relative w-40 h-40 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
              status === 'speaking'
                ? 'bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 shadow-purple-500/50 scale-110'
                : status === 'thinking'
                ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 animate-spin shadow-purple-500/30'
                : status === 'listening'
                ? 'bg-gradient-to-br from-purple-800 via-violet-900 to-black shadow-violet-500/40 border-2 border-purple-400'
                : 'bg-purple-950/60 border border-purple-500/30'
            }`}
          >
            {status === 'speaking' ? (
              <div className="flex items-center gap-1.5 h-10">
                <span className="w-1.5 h-6 bg-white rounded-full animate-bounce delay-75"></span>
                <span className="w-1.5 h-10 bg-white rounded-full animate-bounce delay-150"></span>
                <span className="w-1.5 h-8 bg-white rounded-full animate-bounce delay-100"></span>
                <span className="w-1.5 h-4 bg-white rounded-full animate-bounce"></span>
              </div>
            ) : status === 'thinking' ? (
              <RefreshCw className="w-8 h-8 text-white animate-spin" />
            ) : status === 'listening' ? (
              <div className="flex flex-col items-center">
                <Radio className="w-8 h-8 text-purple-300 animate-pulse" />
              </div>
            ) : (
              <Sparkles className="w-8 h-8 text-purple-400" />
            )}
          </div>
        </div>

        {/* Status Callout */}
        <div className="mt-8 text-center max-w-md">
          <p className="text-sm font-bold tracking-wide uppercase text-purple-300">
            {status === 'listening' && 'Listening... speak to Zubair AI'}
            {status === 'thinking' && 'Zubair AI is thinking...'}
            {status === 'speaking' && 'Speaking (Tap orb to interrupt)'}
            {status === 'idle' && 'Tap below to resume'}
          </p>

          {/* Transcript preview */}
          {transcript && status === 'listening' && (
            <p className="text-xs text-purple-200/80 mt-2 italic bg-purple-950/40 px-4 py-2 rounded-xl border border-purple-500/20">
              "{transcript}"
            </p>
          )}

          {lastAiResponse && status === 'speaking' && (
            <p className="text-xs text-purple-100 mt-2 line-clamp-3 bg-purple-950/40 px-4 py-2 rounded-xl border border-purple-500/30">
              {lastAiResponse}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="w-full max-w-md flex flex-col items-center gap-4">
        {/* Voice Selector if browser has multiple */}
        {availableVoices.length > 0 && onSelectVoice && (
          <div className="flex items-center gap-2 text-xs text-purple-300/70">
            <span>Voice:</span>
            <select
              value={voiceName}
              onChange={(e) => onSelectVoice(e.target.value)}
              className="bg-[#150d2c] border border-purple-500/30 rounded-lg px-2.5 py-1 text-xs text-purple-200 focus:outline-none"
            >
              {availableVoices.slice(0, 8).map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center justify-center gap-6">
          {/* Mute Mic Button */}
          <button
            onClick={() => {
              if (isMuted) {
                setIsMuted(false);
                startListening();
              } else {
                setIsMuted(true);
                if (recognitionRef.current) recognitionRef.current.stop();
                setStatus('idle');
              }
            }}
            className={`p-4 rounded-full border transition duration-200 ${
              isMuted
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-purple-900/40 border-purple-500/40 text-white hover:bg-purple-800/50'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* Interrupt / Stop Voice Response Button */}
          <button
            onClick={handleInterrupt}
            className="p-4 rounded-full bg-purple-900/40 border border-purple-500/40 text-white hover:bg-purple-800/50 transition duration-200"
            title="Interrupt & Speak"
          >
            <RefreshCw className="w-6 h-6 text-purple-300" />
          </button>

          {/* End Call Button */}
          <button
            onClick={onClose}
            className="p-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/40 transition duration-200 hover:scale-105 active:scale-95"
            title="End Voice Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
