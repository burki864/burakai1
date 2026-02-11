
import { supabase } from './supabase';

/**
 * Bans a user by updating their profile and logging the action.
 */
export async function banUser(adminId: string, targetUserId: string, reason: string, durationHours: number) {
  try {
    const banUntil = new Date();
    banUntil.setHours(banUntil.getHours() + durationHours);

    // 1. Update Profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        banned: true,
        ban_until: banUntil.toISOString()
      })
      .eq('id', targetUserId);

    if (profileError) throw profileError;

    // 2. Log Action
    const { error: logError } = await supabase
      .from('admin_logs')
      .insert([
        {
          admin_id: adminId,
          action_type: "ban",
          target_user_id: targetUserId,
          details: `Reason: ${reason}, Duration: ${durationHours}h`,
          created_at: new Date().toISOString()
        }
      ]);

    if (logError) throw logError;

    return { success: true };
  } catch (error) {
    console.error('Error banning user:', error);
    throw error;
  }
}

/**
 * Unbans a user by resetting their profile and logging the action.
 */
export async function unbanUser(adminId: string, targetUserId: string) {
  try {
    // 1. Update Profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        banned: false,
        ban_until: null
      })
      .eq('id', targetUserId);

    if (profileError) throw profileError;

    // 2. Log Action
    const { error: logError } = await supabase
      .from('admin_logs')
      .insert([
        {
          admin_id: adminId,
          action_type: "unban",
          target_user_id: targetUserId,
          details: "User unbanned by admin",
          created_at: new Date().toISOString()
        }
      ]);

    if (logError) throw logError;

    return { success: true };
  } catch (error) {
    console.error('Error unbanning user:', error);
    throw error;
  }
}
