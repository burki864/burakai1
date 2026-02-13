
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
 * Inserts a new user profile into the profiles table.
 * Gracefully handles foreign key violations for mock/neural users.
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
      // 23503 is the PostgreSQL code for foreign key violation
      // This happens when user.id doesn't exist in auth.users
      if (error.code === '23503') {
        console.warn("Supabase Foreign Key Constraint: Profile not persisted, continuing in local mode.");
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Database Sync Bypassed:', error);
    // Return null instead of throwing to allow local-first sessions to proceed
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

export async function sendMessage(userId: string, text: string) {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          user_id: userId,
          content: text,
          created_at: new Date().toISOString()
        }
      ]);
    return data;
  } catch (error) {
    console.warn('Persistence error (expected for guest sessions):', error);
    return null;
  }
}

export const dbService = {
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
      return data;
    } catch (error) {
      console.warn('Image persistence error:', error);
      return null;
    }
  }
};

export const feedbackService = {
  send: async (userName: string, message: string) => {
    if (!isSupabaseConfigured) {
      console.warn("Supabase not configured. Simulating feedback success.");
      return { success: true };
    }
    try {
      const { data, error } = await supabase
        .from('feedbacks')
        .insert([
          { 
            user_name: userName, 
            message: message 
          }
        ]);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Feedback submission error:', error);
      throw error;
    }
  }
};
