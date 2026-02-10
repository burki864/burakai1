
export enum Personality {
  Normal = 'normal',
  Funny = 'funny',
  Formal = 'formal'
}

export enum Language {
  TR = 'tr',
  EN = 'en'
}

export interface User {
  id: string;
  email: string;
  name: string;
  provider: 'email' | 'google';
  createdAt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  imageUrl?: string;
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
}

export interface ImageGeneration {
  id: string;
  prompt: string;
  url: string;
  timestamp: number;
}
