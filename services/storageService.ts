
import { ChatSession, ImageGeneration, SettingsState, User } from "../types";
import { DEFAULT_SETTINGS } from "../constants";

const KEYS = {
  USER: 'burakai_user',
  CHATS: 'burakai_chats',
  IMAGES: 'burakai_images',
  SETTINGS: 'burakai_settings'
};

export const storageService = {
  getUser: (): User | null => {
    const data = localStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : null;
  },
  setUser: (user: User | null) => {
    if (user) localStorage.setItem(KEYS.USER, JSON.stringify(user));
    else localStorage.removeItem(KEYS.USER);
  },
  getChats: (): ChatSession[] => {
    const data = localStorage.getItem(KEYS.CHATS);
    return data ? JSON.parse(data) : [];
  },
  saveChats: (chats: ChatSession[]) => {
    localStorage.setItem(KEYS.CHATS, JSON.stringify(chats));
  },
  getImages: (): ImageGeneration[] => {
    const data = localStorage.getItem(KEYS.IMAGES);
    return data ? JSON.parse(data) : [];
  },
  saveImages: (images: ImageGeneration[]) => {
    localStorage.setItem(KEYS.IMAGES, JSON.stringify(images));
  },
  getSettings: (): SettingsState => {
    const data = localStorage.getItem(KEYS.SETTINGS);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  },
  saveSettings: (settings: SettingsState) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  }
};
