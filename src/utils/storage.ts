import { Conversation, UserSettings } from '../types';

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  model: 'gemini-3.5-flash' as any,
  enableWebSearch: false,
  temperature: 0.7,
  systemPrompt: `You are "ChatGPT • Zubair AI", an intelligent, multimodal AI assistant created by Zubair WebsiteWala.
Tagline: "Ask Anything. Create Anything. Learn Without Limits."
You provide high-level assistance in web development, coding, UI/UX design, marketing strategy, entrepreneurship, scientific inquiries, content writing, and image analysis. Always provide clean markdown and helpful, accurate responses.`,
  voiceName: '',
  speechRate: 1.0,
  speechPitch: 1.0,
  autoSpeak: false,
  userProfile: {
    name: 'Zubair Guest',
    email: 'zubair.user@example.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    title: 'Explorer & Creator',
    isCustomAuth: false,
  },
};

const STORAGE_KEYS = {
  CONVERSATIONS: 'zubair_ai_conversations_v1',
  CURRENT_ID: 'zubair_ai_current_chat_id_v1',
  SETTINGS: 'zubair_ai_settings_v1',
};

export const getSavedSettings = (): UserSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Error loading settings:', e);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: UserSettings): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
};

export const getSavedConversations = (): Conversation[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading conversations:', e);
    return [];
  }
};

export const saveConversations = (conversations: Conversation[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  } catch (e) {
    console.error('Error saving conversations:', e);
  }
};

export const getSavedCurrentChatId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.CURRENT_ID);
};

export const saveCurrentChatId = (id: string | null): void => {
  if (typeof window === 'undefined') return;
  if (id) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_ID, id);
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_ID);
  }
};

// Export all conversations as JSON
export const exportConversationsAsJson = (conversations: Conversation[]) => {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(conversations, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `zubair_ai_chats_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

// Export active conversation as Markdown
export const exportConversationAsMarkdown = (conversation: Conversation) => {
  let md = `# ${conversation.title}\n*Zubair AI by Zubair WebsiteWala*\nDate: ${new Date(
    conversation.createdAt
  ).toLocaleString()}\n\n---\n\n`;

  conversation.messages.forEach((msg) => {
    const sender = msg.role === 'user' ? '### 👤 User' : '### ✨ Zubair AI';
    md += `${sender} (${new Date(msg.timestamp).toLocaleTimeString()}):\n\n${msg.content}\n\n`;
    if (msg.generatedImage) {
      md += `![Generated Image](${msg.generatedImage.imageUrl})\n*Prompt:* ${msg.generatedImage.prompt}\n\n`;
    }
    if (msg.sources && msg.sources.length > 0) {
      md += `**Sources:**\n`;
      msg.sources.forEach((s) => {
        md += `- [${s.title}](${s.url})\n`;
      });
      md += '\n';
    }
    md += '---\n\n';
  });

  const dataStr = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(md);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `${conversation.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.md`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};
