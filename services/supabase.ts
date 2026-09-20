import { User } from '../types';

export const isSupabaseConfigured = true; // Handled dynamically on the Aiven backend!

/**
 * Inserts or updates a user profile.
 */
export async function createProfile(user: User) {
  try {
    const res = await fetch('/api/db/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user })
    });
    if (!res.ok) throw new Error('Failed to create profile');
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error('Database Sync Error:', error);
    return null;
  }
}

export async function updateProfile(userId: string, updates: { username?: string; avatar_url?: string }) {
  try {
    const res = await fetch('/api/db/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, updates })
    });
    if (!res.ok) throw new Error('Failed to update profile');
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

/**
 * Sends and persists a message.
 */
export async function sendMessage(userId: string, text: string, role: 'user' | 'assistant' = 'user') {
  try {
    const res = await fetch('/api/db/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, text, role })
    });
    if (!res.ok) throw new Error('Failed to send message');
    const json = await res.json();
    return json.data;
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
    try {
      const res = await fetch(`/api/db/username?username=${encodeURIComponent(username)}`);
      if (!res.ok) throw new Error('Failed check');
      const json = await res.json();
      return !!json.isAvailable;
    } catch (error) {
      console.error('Username check error:', error);
      return true;
    }
  },

  // --- BAN DURUMU KONTROLÜ ---
  checkBanStatus: async (userId: string): Promise<{ isBanned: boolean; expiresAt?: number; reason?: string; exists: boolean }> => {
    try {
      const res = await fetch(`/api/db/ban-status?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error('Failed check');
      const json = await res.json();
      return json.status;
    } catch (error) {
      console.error('Ban status check failed:', error);
      return { isBanned: false, exists: true };
    }
  },

  saveImage: async (userId: string, prompt: string, imageUrl: string) => {
    try {
      const res = await fetch('/api/db/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, prompt, imageUrl })
      });
      if (!res.ok) throw new Error('Failed to save image');
      const json = await res.json();
      return json.data;
    } catch (error) {
      console.warn('Image persistence error:', error);
      return null;
    }
  },

  saveVideo: async (userId: string, prompt: string, videoUrl: string) => {
    try {
      const res = await fetch('/api/db/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, prompt, videoUrl })
      });
      if (!res.ok) throw new Error('Failed to save video');
      const json = await res.json();
      return json.data;
    } catch (error) {
      console.warn('Video persistence error:', error);
      return null;
    }
  }
};

export const feedbackService = {
  send: async (userName: string, message: string) => {
    try {
      const res = await fetch('/api/db/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName, message })
      });
      if (!res.ok) throw new Error('Failed to send feedback');
      await res.json();
      return { success: true };
    } catch (error) {
      console.error('Feedback submission error:', error);
      throw error;
    }
  }
};
