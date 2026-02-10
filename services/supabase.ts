
import { createClient } from '@supabase/supabase-js';

// Explicitly typing as string. 
// Note: The provided key had a "India" corruption replacing the "ref" prefix. 
// Restoring correct JWT payload based on the project URL wbhamgbwlcbaxlfwbntb.
const SUPABASE_URL: string = 'https://wbhamgbwlcbaxlfwbntb.supabase.co';
const SUPABASE_ANON_KEY: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiaGFtZ2J3bGNiYXhsZndibnRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMDAzOTQsImV4cCI6MjA4Mjc3NjM5NH0.jptUIsINXrQV43Zt9OChAMcIUTW8JyzTnC9wflrLQ0U';

// Definitive check for placeholder or missing credentials
export const isSupabaseConfigured = 
  SUPABASE_URL !== '' && 
  SUPABASE_ANON_KEY !== '' && 
  !SUPABASE_URL.includes('placeholder') && 
  SUPABASE_ANON_KEY !== 'placeholder-key';

// Initialize with provided values.
export const supabase = createClient(
  isSupabaseConfigured ? SUPABASE_URL : 'https://example.supabase.co',
  isSupabaseConfigured ? SUPABASE_ANON_KEY : 'example-key'
);

export const dbService = {
  async saveMessage(userId: string, chatId: string, role: 'user' | 'assistant', content: string) {
    if (!isSupabaseConfigured) return;
    try {
      const { error } = await supabase
        .from('messages')
        .insert([
          { 
            user_id: userId, 
            chat_id: chatId, 
            role: role, 
            content: content, 
            created_at: new Date().toISOString() 
          }
        ]);
      if (error) throw error;
    } catch (err) {
      console.warn("Supabase Save Suppressed:", err);
    }
  },

  async saveImage(userId: string, prompt: string, imageUrl: string) {
    if (!isSupabaseConfigured) return;
    try {
      const { error } = await supabase
        .from('images')
        .insert([
          { 
            user_id: userId, 
            prompt: prompt, 
            image_url: imageUrl, 
            created_at: new Date().toISOString() 
          }
        ]);
      if (error) throw error;
    } catch (err) {
      console.warn("Supabase Image Save Suppressed:", err);
    }
  },

  async getMessages(chatId: string) {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Supabase Fetch Error:", err);
      return [];
    }
  },

  async getChats(userId: string) {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Supabase Chats Error:", err);
      return [];
    }
  }
};
