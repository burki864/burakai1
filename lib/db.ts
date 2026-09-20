import pg from 'pg';
const { Pool } = pg;

// Fetch DB URI from env. Supports both standard names.
const rawDbUrl = (process.env.AIVEN_DATABASE_URL || process.env.DATABASE_URL || '').trim();

// Ensure it is a valid PostgreSQL connection string
export const isDbConfigured = !!rawDbUrl && (rawDbUrl.startsWith('postgres://') || rawDbUrl.startsWith('postgresql://'));

let pool: pg.Pool | null = null;
let isDbHealthy = false;

// Simple on-the-fly in-memory database to store fallback state safely
const memoryDB = {
  profiles: new Map<string, any>(),
  messages: [] as any[],
  images: [] as any[],
  videos: [] as any[],
  feedbacks: [] as any[],
  adminLogs: [] as any[]
};

if (isDbConfigured) {
  try {
    pool = new Pool({
      connectionString: rawDbUrl,
      ssl: {
        rejectUnauthorized: false, // Required for managed cloud DBs like Aiven
      },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000,
    });

    pool.on('error', (err: any) => {
      console.warn('⚠️ Aiven database pool client warning (fallback active):', err.message);
      isDbHealthy = false;
    });

    // Auto-bootstrap schemas on startup if connected to Aiven database
    initializeDatabase().catch(err => {
      console.warn('⚠️ Database bootstrapping unreachable. Safe in-memory fallback will handle storage:', err.message);
      isDbHealthy = false;
    });
  } catch (err: any) {
    console.warn('⚠️ PG Connection Pool initialization skipped (fallback active):', err.message);
    pool = null;
  }
} else {
  console.log("ℹ️ AIVEN_DATABASE_URL is not set or not a full postgres:// connection string. Using high-performance in-memory store.");
}

/**
 * Executes a query on the pool or logs mock action
 */
export async function query(text: string, params?: any[]) {
  if (!pool || !isDbHealthy) {
    throw new Error("Client database connection pool is not established.");
  }
  return pool.query(text, params);
}

/**
 * Automatically creates tables on connected Aiven PG database if they don't exist
 */
async function initializeDatabase() {
  if (!pool) return;
  console.log("🔄 Archiving/syncing database schemas with Aiven PostgreSQL server...");

  const createTablesQuery = `
    CREATE TABLE IF NOT EXISTS public.profiles (
        id TEXT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255),
        avatar_url TEXT,
        banned BOOLEAN DEFAULT FALSE,
        banned_until TIMESTAMPTZ,
        ban_until TIMESTAMPTZ,
        reason TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);
    CREATE INDEX IF NOT EXISTS idx_profiles_banned ON public.profiles (id) WHERE banned = TRUE;

    CREATE TABLE IF NOT EXISTS public.messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_messages_user_history ON public.messages (user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS public.images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        prompt TEXT NOT NULL,
        url TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_images_user_id ON public.images (user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS public.videos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        prompt TEXT NOT NULL,
        url TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_videos_user_id ON public.videos (user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS public.feedbacks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_name VARCHAR(100),
        message TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.admin_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_id TEXT NOT NULL,
        action_type VARCHAR(50) NOT NULL,
        target_user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        details TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON public.admin_logs (admin_id);
    CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON public.admin_logs (target_user_id);
  `;

  await pool.query(createTablesQuery);
  isDbHealthy = true;
  console.log("✅ Database schema initialized successfully on Aiven.");
}

// ---------------------------------------------------------------------------
// BACKEND BUSINESS ACTION SERVICES (100% FAULT-TOLERANT WITH IN-MEMORY FALLBACK)
// ---------------------------------------------------------------------------

export async function createProfileInDb(id: string, name: string, email: string) {
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`;
  if (pool && isDbHealthy) {
    try {
      const q = `
        INSERT INTO public.profiles (id, username, email, avatar_url, banned, created_at)
        VALUES ($1, $2, $3, $4, FALSE, NOW())
        ON CONFLICT (id) DO UPDATE 
        SET username = EXCLUDED.username, 
            email = EXCLUDED.email, 
            avatar_url = EXCLUDED.avatar_url
        RETURNING *;
      `;
      const res = await pool.query(q, [id, name, email, avatarUrl]);
      return res.rows[0];
    } catch (err: any) {
      console.warn("DB createProfile fallback to memory:", err.message);
    }
  }

  const profile = { id, username: name, email, avatar_url: avatarUrl, banned: false, created_at: new Date().toISOString() };
  memoryDB.profiles.set(id, profile);
  return profile;
}

export async function updateProfileInDb(id: string, username?: string, avatarUrl?: string) {
  if (pool && isDbHealthy) {
    try {
      const q = `
        UPDATE public.profiles
        SET username = COALESCE($2, username),
            avatar_url = COALESCE($3, avatar_url)
        WHERE id = $1
        RETURNING *;
      `;
      const res = await pool.query(q, [id, username || null, avatarUrl || null]);
      if (res.rows.length > 0) return res.rows[0];
    } catch (err: any) {
      console.warn("DB updateProfile fallback to memory:", err.message);
    }
  }

  const p = memoryDB.profiles.get(id) || { id, username: '', email: '', avatar_url: '', banned: false };
  if (username) p.username = username;
  if (avatarUrl) p.avatar_url = avatarUrl;
  memoryDB.profiles.set(id, p);
  return p;
}

export async function checkUsernameInDb(username: string): Promise<boolean> {
  if (pool && isDbHealthy) {
    try {
      const q = `SELECT username FROM public.profiles WHERE username ILIKE $1 LIMIT 1;`;
      const res = await pool.query(q, [username]);
      return res.rows.length === 0;
    } catch (err: any) {
      console.warn("DB checkUsername fallback to memory:", err.message);
    }
  }

  for (const p of memoryDB.profiles.values()) {
    if (p.username && p.username.toLowerCase() === username.toLowerCase()) {
      return false;
    }
  }
  return true;
}

export async function checkBanStatusInDb(userId: string) {
  if (pool && isDbHealthy) {
    try {
      const q = `SELECT banned, banned_until, ban_until, reason FROM public.profiles WHERE id = $1 LIMIT 1;`;
      const res = await pool.query(q, [userId]);
      if (res.rows.length === 0) {
        return { isBanned: false, exists: false };
      }
      const row = res.rows[0];
      const now = new Date();
      const bannedUntil = row.banned_until || row.ban_until ? new Date(row.banned_until || row.ban_until) : null;
      const isCurrentlyBanned = !!row.banned && (!bannedUntil || bannedUntil > now);
      
      return {
        isBanned: isCurrentlyBanned,
        expiresAt: bannedUntil ? bannedUntil.getTime() : undefined,
        reason: row.reason || undefined,
        exists: true
      };
    } catch (err: any) {
      console.warn("DB checkBanStatus fallback to memory:", err.message);
    }
  }

  const p = memoryDB.profiles.get(userId);
  if (!p) return { isBanned: false, exists: false };
  const bannedUntil = p.banned_until ? new Date(p.banned_until) : null;
  const isCurrentlyBanned = !!p.banned && (!bannedUntil || bannedUntil > new Date());
  return {
    isBanned: isCurrentlyBanned,
    expiresAt: bannedUntil ? bannedUntil.getTime() : undefined,
    reason: p.reason || undefined,
    exists: true
  };
}

export async function sendMessageInDb(userId: string, content: string, role: string) {
  if (pool && isDbHealthy) {
    try {
      const q = `
        INSERT INTO public.messages (user_id, content, role, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING *;
      `;
      const res = await pool.query(q, [userId, content, role]);
      return res.rows[0];
    } catch (err: any) {
      console.warn("DB sendMessage fallback to memory:", err.message);
    }
  }

  if (!memoryDB.profiles.has(userId)) {
    memoryDB.profiles.set(userId, { id: userId, username: `User-${userId.substring(0,4)}`, email: '', avatar_url: '', banned: false });
  }
  const msg = { id: Math.random().toString(), user_id: userId, content, role, created_at: new Date().toISOString() };
  memoryDB.messages.push(msg);
  return msg;
}

export async function saveImageInDb(userId: string, prompt: string, url: string) {
  if (pool && isDbHealthy) {
    try {
      const q = `
        INSERT INTO public.images (user_id, prompt, url, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING *;
      `;
      const res = await pool.query(q, [userId, prompt, url]);
      return res.rows[0];
    } catch (err: any) {
      console.warn("DB saveImage fallback to memory:", err.message);
    }
  }

  const img = { id: Math.random().toString(), user_id: userId, prompt, url, created_at: new Date().toISOString() };
  memoryDB.images.push(img);
  return img;
}

export async function saveVideoInDb(userId: string, prompt: string, url: string) {
  if (pool && isDbHealthy) {
    try {
      const q = `
        INSERT INTO public.videos (user_id, prompt, url, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING *;
      `;
      const res = await pool.query(q, [userId, prompt, url]);
      return res.rows[0];
    } catch (err: any) {
      console.warn("DB saveVideo fallback to memory:", err.message);
    }
  }

  const vid = { id: Math.random().toString(), user_id: userId, prompt, url, created_at: new Date().toISOString() };
  memoryDB.videos.push(vid);
  return vid;
}

export async function sendFeedbackInDb(userName: string, message: string) {
  if (pool && isDbHealthy) {
    try {
      const q = `
        INSERT INTO public.feedbacks (user_name, message, created_at)
        VALUES ($1, $2, NOW())
        RETURNING *;
      `;
      const res = await pool.query(q, [userName, message]);
      return { success: true, id: res.rows[0].id };
    } catch (err: any) {
      console.warn("DB sendFeedback fallback to memory:", err.message);
    }
  }

  const feedback = { id: Math.random().toString(), user_name: userName, message, created_at: new Date().toISOString() };
  memoryDB.feedbacks.push(feedback);
  return { success: true, id: feedback.id };
}

export async function banUserInDb(adminId: string, targetUserId: string, reason: string, durationHours: number) {
  const banUntil = new Date();
  banUntil.setHours(banUntil.getHours() + durationHours);
  
  if (pool && isDbHealthy) {
    try {
      const qUpdate = `
        UPDATE public.profiles
        SET banned = TRUE,
            banned_until = $2,
            ban_until = $2,
            reason = $3
        WHERE id = $1;
      `;
      await pool.query(qUpdate, [targetUserId, banUntil, reason]);

      const qLog = `
        INSERT INTO public.admin_logs (admin_id, action_type, target_user_id, details, created_at)
        VALUES ($1, 'ban', $2, $3, NOW());
      `;
      await pool.query(qLog, [adminId, targetUserId, `Reason: ${reason}, Duration: ${durationHours}h`]);
      return { success: true };
    } catch (err: any) {
      console.warn("DB banUser fallback to memory:", err.message);
    }
  }

  const p = memoryDB.profiles.get(targetUserId) || { id: targetUserId, username: '', email: '', avatar_url: '', banned: false };
  p.banned = true;
  p.banned_until = banUntil.toISOString();
  p.reason = reason;
  memoryDB.profiles.set(targetUserId, p);

  memoryDB.adminLogs.push({
    id: Math.random().toString(),
    admin_id: adminId,
    action_type: 'ban',
    target_user_id: targetUserId,
    details: `Reason: ${reason}, Duration: ${durationHours}h`,
    created_at: new Date().toISOString()
  });
  return { success: true };
}

export async function unbanUserInDb(adminId: string, targetUserId: string) {
  if (pool && isDbHealthy) {
    try {
      const qUpdate = `
        UPDATE public.profiles
        SET banned = FALSE,
            banned_until = NULL,
            ban_until = NULL,
            reason = NULL
        WHERE id = $1;
      `;
      await pool.query(qUpdate, [targetUserId]);

      const qLog = `
        INSERT INTO public.admin_logs (admin_id, action_type, target_user_id, details, created_at)
        VALUES ($1, 'unban', $2, $3, NOW());
      `;
      await pool.query(qLog, [adminId, targetUserId, 'User unbanned by admin']);
      return { success: true };
    } catch (err: any) {
      console.warn("DB unbanUser fallback to memory:", err.message);
    }
  }

  const p = memoryDB.profiles.get(targetUserId);
  if (p) {
    p.banned = false;
    p.banned_until = undefined;
    p.reason = undefined;
    memoryDB.profiles.set(targetUserId, p);
  }
  
  memoryDB.adminLogs.push({
    id: Math.random().toString(),
    admin_id: adminId,
    action_type: 'unban',
    target_user_id: targetUserId,
    details: 'User unbanned by admin',
    created_at: new Date().toISOString()
  });
  return { success: true };
}

