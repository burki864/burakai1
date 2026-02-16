
import { createClient } from '@supabase/supabase-js';
import { User } from '../types';

// Defensive environment variable retrieval helper
const getEnvVar = (key: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
      return (import.meta as any).env[key];
    }
  } catch (e) {}
  try {
    if (typeof process !== 'undefined' && process && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {}
  return '';
};

const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.includes('.'));

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co', 
  SUPABASE_ANON_KEY || 'placeholder'
);

/**
 * Inserts or updates a user profile.
 */
export async function createProfile(user: User) {
  if (!isSupabaseConfigured) return null;
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert([
        {
          id: user.id,
          username: user.name,
          email: user.email,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
          banned: false,
          created_at: new Date().toISOString(),
        }
      ], { onConflict: 'id' });

    if (error) {
      if (error.code === '23503') {
        console.warn("Supabase Foreign Key Constraint: Profile not persisted.");
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Database Sync Error:', error);
    return null;
  }
}

export async function updateProfile(userId: string, updates: { username?: string; avatar_url?: string }) {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

/**
 * Sends and persists a message.
 */
export async function sendMessage(userId: string, text: string, role: 'user' | 'assistant' = 'user') {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          user_id: userId,
          content: text,
          role: role,
          created_at: new Date().toISOString()
        }
      ]);
    if (error) throw error;
    return data;
  } catch (error) {
    console.warn('Persistence error:', error);
    return null;
  }
}

/**
 * CORE DATABASE SERVICES
 * Includes Image, Video, and Ban Management
 */
export const dbService = {
  // --- KULLANICI ADI KULLANIMDA MI? ---
  checkUsernameAvailability: async (username: string): Promise<boolean> => {
    if (!isSupabaseConfigured) return true;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .ilike('username', username)
        .maybeSingle();
      
      if (error) {
          console.error('Username check error:', error);
          return true; // Hata durumunda izin ver veya güvenli davran
      }
      return !data; // Eğer data varsa (zaten alınmış), false döner
    } catch (error) {
      return true;
    }
  },

  // --- BAN DURUMU KONTROLÜ ---
  checkBanStatus: async (userId: string): Promise<{ isBanned: boolean; expiresAt?: number; reason?: string; exists: boolean }> => {
    if (!isSupabaseConfigured) return { isBanned: false, exists: true };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('banned, banned_until, reason')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      
      // Profile deleted on Supabase
      if (!data) return { isBanned: false, exists: false };

      const now = new Date();
      const bannedUntil = data.banned_until ? new Date(data.banned_until) : null;

      // Mantık: 'banned' true ise VE (süresizse veya süresi henüz dolmadıysa)
      const isCurrentlyBanned = data.banned && (!bannedUntil || bannedUntil > now);

      return {
        isBanned: isCurrentlyBanned,
        expiresAt: bannedUntil ? bannedUntil.getTime() : undefined,
        reason: data.reason || undefined,
        exists: true
      };
    } catch (error) {
      console.error('Ban status check failed:', error);
      return { isBanned: false, exists: true };
    }
  },

  saveImage: async (userId: string, prompt: string, imageUrl: string) => {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('images')
        .insert([
          {
            user_id: userId,
            prompt: prompt,
            url: imageUrl,
            created_at: new Date().toISOString()
          }
        ]);
      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Image persistence error:', error);
      return null;
    }
  },

  saveVideo: async (userId: string, prompt: string, videoUrl: string) => {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('videos')
        .insert([
          {
            user_id: userId,
            prompt: prompt,
            url: videoUrl,
            created_at: new Date().toISOString()
          }
        ]);
      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Video persistence error:', error);
      return null;
    }
  }
};

export const feedbackService = {
  send: async (userName: string, message: string) => {
    if (!isSupabaseConfigured) {
      console.warn("Supabase not configured. Simulating success.");
      return { success: true };
    }
    try {
      const { data, error } = await supabase
        .from('feedbacks')
        .insert([{ user_name: userName, message: message }]);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Feedback submission error:', error);
      throw error;
    }
  }
};
