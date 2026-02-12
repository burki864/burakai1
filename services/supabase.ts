
import { createClient } from '@supabase/supabase-js';
import { User } from '../types';

// Defensive environment variable retrieval helper
const getEnvVar = (key: string): string => {
  try {
    // First try standard Vite/esm.sh style access
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
      return (import.meta as any).env[key];
    }
  } catch (e) {}

  try {
    // Fallback to process.env for Node or environments that shim it
    if (typeof process !== 'undefined' && process && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {}

  return '';
};

const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY');

/**
 * Checks if Supabase environment variables are properly configured.
 */
export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.includes('.'));

// Initialize with a dummy URL if missing to prevent immediate crash during module load.
// isSupabaseConfigured should be checked before making actual network calls.
export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co', 
  SUPABASE_ANON_KEY || 'placeholder'
);

/**
 * Inserts a new user profile into the profiles table.
 */
export async function createProfile(user: User) {
  if (!isSupabaseConfigured) {
    console.warn("Supabase not configured. Skipping profile creation.");
    return null;
  }
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

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating profile:', error);
    throw error;
  }
}

/**
 * Updates an existing user profile in Supabase.
 */
export async function updateProfile(userId: string, updates: { username?: string; avatar_url?: string }) {
  if (!isSupabaseConfigured) {
    console.warn("Supabase not configured. Updates will not be persisted.");
    return null;
  }
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
 * Inserts a new message into the messages table.
 */
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

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Data service for image persistence.
 */
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

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving image:', error);
      throw error;
    }
  }
};
