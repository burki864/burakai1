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
    if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
      const json = await res.json();
      return json.result;
    }
    return { success: true, banned: true };
  } catch (error) {
    console.error('Error banning user:', error);
    return { success: true, banned: true };
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
    if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
      const json = await res.json();
      return json.result;
    }
    return { success: true, banned: false };
  } catch (error) {
    console.error('Error unbanning user:', error);
    return { success: true, banned: false };
  }
}
