export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  base64: string;
  previewUrl: string;
  type: 'image' | 'document' | 'audio';
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface GeneratedImageData {
  imageUrl: string;
  prompt: string;
  aspectRatio: string;
  caption?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  sources?: GroundingSource[];
  generatedImage?: GeneratedImageData;
  audioUrl?: string;
  isStreaming?: boolean;
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  model?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  title: string;
  isCustomAuth?: boolean;
}

export interface UserSettings {
  theme: 'dark' | 'light';
  model: 'gemini-3.5-flash' | 'gemini-3.8-flash' | 'gemini-4-argon';
  enableWebSearch: boolean;
  temperature: number;
  systemPrompt: string;
  voiceName: string;
  speechRate: number;
  speechPitch: number;
  autoSpeak: boolean;
  userProfile: UserProfile;
}

export type ViewTab = 'chat' | 'image-studio' | 'explore' | 'settings';
