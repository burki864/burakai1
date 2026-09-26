import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User } from '../types';

// Client-side environment resolution
const supabaseUrl = (typeof process !== 'undefined' && process.env?.SUPABASE_URL) || 
                    (import.meta as any).env?.VITE_SUPABASE_URL || 
                    '';
const supabaseKey = (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) || 
                    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 
                    '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey && supabaseUrl.startsWith('https://'));

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

/**
 * Inserts or updates a user profile directly client-side.
 */
export async function createProfile(user: User) {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: user.name,
          email: user.email || '',
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
          banned: false
        })
        .select()
        .single();

      if (!error && data) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Supabase profile sync fallback to local storage:', err);
  }

  // Client-side local storage fallback
  const profile = {
    id: user.id,
    username: user.name,
    email: user.email || '',
    avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
    banned: false,
    created_at: new Date().toISOString()
  };
  try {
    localStorage.setItem(`burakai_profile_${user.id}`, JSON.stringify(profile));
  } catch (_) {}
  return profile;
}

export async function updateProfile(userId: string, updates: { username?: string; avatar_url?: string }) {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (!error && data) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Supabase update profile fallback to local storage:', err);
  }

  try {
    const raw = localStorage.getItem(`burakai_profile_${userId}`);
    const current = raw ? JSON.parse(raw) : { id: userId };
    const updated = { ...current, ...updates };
    localStorage.setItem(`burakai_profile_${userId}`, JSON.stringify(updated));
    return updated;
  } catch (_) {
    return { id: userId, ...updates };
  }
}

/**
 * Sends and persists a message directly client-side.
 */
export async function sendMessage(userId: string, text: string, role: 'user' | 'assistant' = 'user') {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          user_id: userId,
          content: text,
          role
        })
        .select()
        .single();

      if (!error && data) {
        return data;
      }
    }
  } catch (err) {
    console.debug('Supabase insert message fallback:', err);
  }

  // Client-side local storage
  try {
    const key = `burakai_chat_history_${userId}`;
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    const msg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      content: text,
      role,
      created_at: new Date().toISOString()
    };
    list.push(msg);
    localStorage.setItem(key, JSON.stringify(list.slice(-100)));
    return msg;
  } catch (_) {
    return null;
  }
}

/**
 * CORE DATABASE SERVICES (Direct Client-Side & Resilient)
 */
export const dbService = {
  checkUsernameAvailability: async (username: string): Promise<boolean> => {
    try {
      if (supabase) {
        const { count, error } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .ilike('username', username.trim());
        if (!error && count !== null) {
          return count === 0;
        }
      }
    } catch (_) {}
    return true;
  },

  checkBanStatus: async (userId: string): Promise<{ isBanned: boolean; expiresAt?: number; reason?: string; exists: boolean }> => {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('profiles')
          .select('banned, banned_until, ban_until, reason')
          .eq('id', userId)
          .maybeSingle();

        if (!error && data) {
          const now = new Date();
          const until = data.banned_until || data.ban_until ? new Date(data.banned_until || data.ban_until) : null;
          const isCurrentlyBanned = !!data.banned && (!until || until > now);
          return {
            isBanned: isCurrentlyBanned,
            expiresAt: until ? until.getTime() : undefined,
            reason: data.reason,
            exists: true
          };
        }
      }
    } catch (_) {}

    // Güvenli varsayılan: Kullanıcı oturumunu açık tut
    return { isBanned: false, exists: true };
  },

  saveImage: async (userId: string, prompt: string, imageUrl: string) => {
    try {
      if (supabase) {
        const { data } = await supabase
          .from('images')
          .insert({ user_id: userId, prompt, url: imageUrl })
          .select()
          .single();
        if (data) return data;
      }
    } catch (_) {}

    try {
      const key = `burakai_saved_images_${userId}`;
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      const item = { id: `img-${Date.now()}`, prompt, url: imageUrl, timestamp: Date.now() };
      list.push(item);
      localStorage.setItem(key, JSON.stringify(list.slice(-50)));
      return item;
    } catch (_) {
      return null;
    }
  },

  saveVideo: async (userId: string, prompt: string, videoUrl: string) => {
    try {
      if (supabase) {
        const { data } = await supabase
          .from('videos')
          .insert({ user_id: userId, prompt, url: videoUrl })
          .select()
          .single();
        if (data) return data;
      }
    } catch (_) {}

    try {
      const key = `burakai_saved_videos_${userId}`;
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      const item = { id: `vid-${Date.now()}`, prompt, url: videoUrl, timestamp: Date.now() };
      list.push(item);
      localStorage.setItem(key, JSON.stringify(list.slice(-50)));
      return item;
    } catch (_) {
      return null;
    }
  }
};

export const feedbackService = {
  send: async (userName: string, message: string) => {
    try {
      if (supabase) {
        await supabase
          .from('feedbacks')
          .insert({ user_name: userName || 'Anonim', message });
      }
    } catch (_) {}
    return { success: true };
  }
};
