/**
 * Bans a user by calling the backend Aiven database router.
 */
export async function banUser(adminId: string, targetUserId: string, reason: string, durationHours: number) {
  try {
    const res = await fetch('/api/db/admin/ban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, targetUserId, reason, durationHours })
    });
    if (!res.ok) throw new Error('Failed to execute ban');
    const json = await res.json();
    return json.result;
  } catch (error) {
    console.error('Error banning user:', error);
    throw error;
  }
}

/**
 * Unbans a user by calling the backend Aiven database router.
 */
export async function unbanUser(adminId: string, targetUserId: string) {
  try {
    const res = await fetch('/api/db/admin/unban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, targetUserId })
    });
    if (!res.ok) throw new Error('Failed to execute unban');
    const json = await res.json();
    return json.result;
  } catch (error) {
    console.error('Error unbanning user:', error);
    throw error;
  }
}
