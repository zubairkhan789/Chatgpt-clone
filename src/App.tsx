import React, { useState, useEffect, useRef } from 'react';
import {
  Conversation,
  Message,
  Attachment,
  ViewTab,
  UserSettings,
  UserProfile,
  GeneratedImageData,
} from './types';
import {
  getSavedSettings,
  saveSettings,
  getSavedConversations,
  saveConversations,
  getSavedCurrentChatId,
  saveCurrentChatId,
} from './utils/storage';
import { speechManager } from './utils/speech';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ChatMessage } from './components/ChatMessage';
import { ChatComposer } from './components/ChatComposer';
import { WelcomeScreen } from './components/WelcomeScreen';
import { LiveVoiceModal } from './components/LiveVoiceModal';
import { ImageStudio } from './components/ImageStudio';
import { ExploreTools } from './components/ExploreTools';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const [settings, setSettings] = useState<UserSettings>(() => getSavedSettings());
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    getSavedConversations()
  );
  const [activeChatId, setActiveChatId] = useState<string | null>(() =>
    getSavedCurrentChatId()
  );
  const [currentTab, setCurrentTab] = useState<ViewTab>('chat');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [liveVoiceOpen, setLiveVoiceOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const activeChat = conversations.find((c) => c.id === activeChatId);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync settings and conversations to localStorage
  useEffect(() => {
    saveSettings(settings);
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    saveCurrentChatId(activeChatId);
  }, [activeChatId]);

  // Auto-scroll to bottom of chat when new content arrives
  useEffect(() => {
    if (currentTab === 'chat' && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeChat?.messages, isStreaming, currentTab]);

  // Create a new chat
  const handleNewChat = () => {
    setActiveChatId(null);
    setCurrentTab('chat');
  };

  // Toggle theme
  const handleToggleTheme = () => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  // Update Settings
  const handleUpdateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
  };

  // Update User Profile
  const handleUpdateUser = (newUser: UserProfile) => {
    setSettings((prev) => ({
      ...prev,
      userProfile: newUser,
    }));
  };

  // Toggle web search grounding
  const handleToggleWebSearch = () => {
    setSettings((prev) => ({
      ...prev,
      enableWebSearch: !prev.enableWebSearch,
    }));
  };

  // Toggle model
  const handleChangeModel = (model: 'gemini-3.8-flash' | 'gemini-4-argon') => {
    setSettings((prev) => ({ ...prev, model }));
  };

  // Delete Conversation
  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeChatId === id) {
      setActiveChatId(null);
    }
  };

  // Rename Conversation
  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
  };

  // Toggle Pin Conversation
  const handleTogglePin = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
    );
  };

  // Clear all conversations
  const handleClearAllConversations = () => {
    setConversations([]);
    setActiveChatId(null);
  };

  // Stop Streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
  };

  // Primary Message Handler
  const handleSendMessage = async (
    content: string,
    attachments: Attachment[] = [],
    isImageGen: boolean = false,
    imageConfig?: { aspectRatio: string }
  ) => {
    if (isStreaming) return;

    let chatId = activeChatId;
    let currentConversation = activeChat;

    // Create new chat if not active
    if (!chatId || !currentConversation) {
      const newId = 'chat_' + Date.now();
      const newTitle =
        content.trim().slice(0, 36) ||
        (attachments.length > 0 ? 'Image Inspection' : 'New Conversation');

      const newConv: Conversation = {
        id: newId,
        title: newTitle,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        model: settings.model,
      };

      currentConversation = newConv;
      chatId = newId;
      setConversations((prev) => [newConv, ...prev]);
      setActiveChatId(newId);
    }

    const userMessage: Message = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    const assistantMessageId = 'msg_' + (Date.now() + 1);

    // If Image Generation mode
    if (isImageGen) {
      const placeholderAssistantMsg: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: `Generating image with Zubair AI Studio: "${content}"...`,
        timestamp: Date.now(),
        isStreaming: true,
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                messages: [...c.messages, userMessage, placeholderAssistantMsg],
                updatedAt: Date.now(),
              }
            : c
        )
      );

      setIsStreaming(true);

      try {
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: content,
            aspectRatio: imageConfig?.aspectRatio || '1:1',
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Image generation failed');
        }

        const generatedData: GeneratedImageData = {
          imageUrl: data.imageUrl,
          prompt: content,
          aspectRatio: imageConfig?.aspectRatio || '1:1',
          caption: data.caption,
        };

        setConversations((prev) =>
          prev.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMessageId
                      ? {
                          ...m,
                          content: `Here is your generated image for: "${content}"`,
                          generatedImage: generatedData,
                          isStreaming: false,
                        }
                      : m
                  ),
                }
              : c
          )
        );
      } catch (err: any) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMessageId
                      ? {
                          ...m,
                          content: `Image generation failed.`,
                          error: err?.message || 'Could not generate image.',
                          isStreaming: false,
                        }
                      : m
                  ),
                }
              : c
          )
        );
      } finally {
        setIsStreaming(false);
      }

      return;
    }

    // Standard Chat with Streaming & Vision & Search
    const initialAssistantMsg: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              messages: [...c.messages, userMessage, initialAssistantMsg],
              updatedAt: Date.now(),
            }
          : c
      )
    );

    setIsStreaming(true);

    try {
      abortControllerRef.current = new AbortController();

      // Collect historical messages for conversational context
      const chatHistory = [...(currentConversation?.messages || []), userMessage];
      const payloadMessages = chatHistory.map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        content: m.content,
        attachments: m.attachments,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          model: settings.model,
          enableSearch: settings.enableWebSearch,
          systemInstruction: settings.systemPrompt,
          temperature: settings.temperature,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to contact AI service');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let collectedSources: any[] = [];

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6));
                if (event.type === 'chunk' && event.text) {
                  accumulatedText += event.text;

                  // Update active conversation in state
                  setConversations((prev) =>
                    prev.map((c) =>
                      c.id === chatId
                        ? {
                            ...c,
                            messages: c.messages.map((m) =>
                              m.id === assistantMessageId
                                ? { ...m, content: accumulatedText }
                                : m
                            ),
                          }
                        : c
                    )
                  );
                } else if (event.type === 'grounding' && event.sources) {
                  collectedSources = event.sources;
                  setConversations((prev) =>
                    prev.map((c) =>
                      c.id === chatId
                        ? {
                            ...c,
                            messages: c.messages.map((m) =>
                              m.id === assistantMessageId
                                ? { ...m, sources: collectedSources }
                                : m
                            ),
                          }
                        : c
                    )
                  );
                } else if (event.type === 'error') {
                  throw new Error(event.message || 'Stream error');
                }
              } catch (e) {
                // Ignore parse errors on partial chunks
              }
            }
          }
        }
      }

      // Mark message streaming complete
      setConversations((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, isStreaming: false }
                    : m
                ),
              }
            : c
        )
      );

      // Auto-speak if enabled in settings
      if (settings.autoSpeak && accumulatedText.trim()) {
        speechManager.speak(accumulatedText, {
          voiceName: settings.voiceName,
          rate: settings.speechRate,
          pitch: settings.speechPitch,
        });
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Chat error:', err);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMessageId
                      ? {
                          ...m,
                          content: m.content || 'An error occurred while generating.',
                          error: err?.message || 'Failed to complete request.',
                          isStreaming: false,
                        }
                      : m
                  ),
                }
              : c
          )
        );
      } else {
        // User aborted
        setConversations((prev) =>
          prev.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, isStreaming: false }
                      : m
                  ),
                }
              : c
          )
        );
      }
    } finally {
      setIsStreaming(false);
    }
  };

  // Regenerate last response
  const handleRegenerate = () => {
    if (!activeChat || activeChat.messages.length < 2 || isStreaming) return;

    // Find last user message
    let lastUserIndex = -1;
    for (let i = activeChat.messages.length - 1; i >= 0; i--) {
      if (activeChat.messages[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }

    if (lastUserIndex === -1) return;

    const userMsg = activeChat.messages[lastUserIndex];
    // Remove messages after that user message
    const trimmedMessages = activeChat.messages.slice(0, lastUserIndex);

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeChat.id ? { ...c, messages: trimmedMessages } : c
      )
    );

    handleSendMessage(userMsg.content, userMsg.attachments || []);
  };

  // Edit previous user prompt
  const handleEditPrompt = (newPrompt: string) => {
    handleSendMessage(newPrompt, []);
  };

  // Start chat from Explore Tools
  const handleStartToolChat = (
    title: string,
    initialPrompt: string,
    systemPrompt?: string
  ) => {
    const newId = 'chat_' + Date.now();
    const newConv: Conversation = {
      id: newId,
      title,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: settings.model,
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveChatId(newId);
    setCurrentTab('chat');

    if (systemPrompt) {
      setSettings((prev) => ({ ...prev, systemPrompt }));
    }

    handleSendMessage(initialPrompt, []);
  };

  // Send image from ImageStudio to Chat
  const handleSendImageToChat = (prompt: string, image: GeneratedImageData) => {
    const newId = 'chat_' + Date.now();
    const userMsg: Message = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: `I created this image: "${prompt}". What do you think, and how can we enhance it?`,
      timestamp: Date.now(),
    };
    const aiMsg: Message = {
      id: 'msg_' + (Date.now() + 1),
      role: 'assistant',
      content: `Here is the artwork you generated in Zubair AI Image Studio! Feel free to ask for design critiques, prompt refinements, or variations.`,
      generatedImage: image,
      timestamp: Date.now(),
    };

    const newConv: Conversation = {
      id: newId,
      title: `Art: ${prompt.slice(0, 25)}`,
      messages: [userMsg, aiMsg],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveChatId(newId);
    setCurrentTab('chat');
  };

  const isDark = settings.theme === 'dark';

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden ${
        isDark ? 'bg-[#090514] text-white' : 'bg-[#faf8ff] text-gray-900'
      }`}
    >
      {/* Collapsible Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeChatId}
        onSelectConversation={(id) => {
          setActiveChatId(id);
          setCurrentTab('chat');
        }}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onTogglePin={handleTogglePin}
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isDark={isDark}
        userProfile={settings.userProfile}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenAuth={() => setAuthOpen(true)}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Top Header */}
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          activeConversation={activeChat}
          model={settings.model}
          onChangeModel={handleChangeModel}
          enableWebSearch={settings.enableWebSearch}
          onToggleWebSearch={handleToggleWebSearch}
          onOpenLiveVoice={() => setLiveVoiceOpen(true)}
          isDark={isDark}
          onToggleTheme={handleToggleTheme}
          allConversations={conversations}
        />

        {/* Dynamic Main View Area */}
        {currentTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {!activeChat || activeChat.messages.length === 0 ? (
                <WelcomeScreen
                  onSelectPrompt={(p, isImg) =>
                    handleSendMessage(p, [], Boolean(isImg))
                  }
                  isDark={isDark}
                />
              ) : (
                <div className="py-4 space-y-1">
                  {activeChat.messages.map((msg) => (
                    <ChatMessage
                      key={msg.id}
                      message={msg}
                      isDark={isDark}
                      onRegenerate={
                        msg.role === 'assistant' ? handleRegenerate : undefined
                      }
                      onEditPrompt={
                        msg.role === 'user' ? handleEditPrompt : undefined
                      }
                      onRequestImageVariation={(prompt) =>
                        handleSendMessage(prompt, [], true)
                      }
                      voiceName={settings.voiceName}
                    />
                  ))}
                  <div ref={messagesEndRef} className="h-4" />
                </div>
              )}
            </div>

            {/* Bottom Composer */}
            <ChatComposer
              onSendMessage={handleSendMessage}
              isStreaming={isStreaming}
              onStopStreaming={handleStopStreaming}
              enableWebSearch={settings.enableWebSearch}
              onToggleWebSearch={handleToggleWebSearch}
              isDark={isDark}
            />
          </div>
        )}

        {/* Dedicated Image Studio View */}
        {currentTab === 'image-studio' && (
          <ImageStudio onSendToChat={handleSendImageToChat} isDark={isDark} />
        )}

        {/* Dedicated Explore Tools View */}
        {currentTab === 'explore' && (
          <ExploreTools onStartToolChat={handleStartToolChat} isDark={isDark} />
        )}

        {/* Settings Modal */}
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          conversations={conversations}
          onClearAllConversations={handleClearAllConversations}
          isDark={isDark}
        />

        {/* Auth & Profile Modal */}
        <AuthModal
          isOpen={authOpen}
          onClose={() => setAuthOpen(false)}
          currentUser={settings.userProfile}
          onUpdateUser={handleUpdateUser}
          isDark={isDark}
        />

        {/* Live Voice Real-Time Call Modal */}
        <LiveVoiceModal
          isOpen={liveVoiceOpen}
          onClose={() => setLiveVoiceOpen(false)}
          voiceName={settings.voiceName}
          onSelectVoice={(v) =>
            setSettings((prev) => ({ ...prev, voiceName: v }))
          }
        />
      </div>
    </div>
  );
}
