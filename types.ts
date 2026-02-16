
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  banned: boolean;
  ban_until?: string | null;
  reason?: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  provider: 'google' | 'email';
  createdAt: string;
  plan: 'free' | 'pro';
  profile?: UserProfile;
}

export type ThemeType = 'default' | 'rain' | 'desert' | 'nebula' | 'cyberpunk' | 'snow';
export type AppView = 'chat' | 'images' | 'video-studio' | 'settings' | 'downloads';

export enum Personality {
  Normal = 'normal',
  Funny = 'funny',
  Formal = 'formal'
}

export enum Language {
  TR = 'tr',
  EN = 'en'
}

export interface Attachment {
  type: 'image' | 'video' | 'file';
  data: string;
  mimeType: string;
  name?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  groundingUrls?: { title: string; uri: string }[];
  videoUrl?: string;
  imageUrl?: string;
  isGenerating?: boolean;
  generationType?: 'image' | 'video';
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface SettingsState {
  darkMode: boolean;
  language: Language;
  showTimestamps: boolean;
  personality: Personality;
  creativity: number;
  systemPrompt: string;
  searchEnabled: boolean;
  activeTheme: ThemeType;
}

export interface ImageGeneration {
  id: string;
  prompt: string;
  url: string;
  timestamp: number;
}
