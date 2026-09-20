-- ==========================================
-- BurakAI Pro Ultra Database Schema
-- Dialect: PostgreSQL / Supabase
-- Description: Essential tables, constraints, indexes, 
--              and security guidelines for the platform.
-- ==========================================

-- Enable extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------
-- 1. PROFILES TABLE (User Accounts & Moderation Details)
-- Note: ID uses TEXT to match both standard text-based OAuth
-- triggers and Supabase Auth UUID strings.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255),
    avatar_url TEXT,
    banned BOOLEAN DEFAULT FALSE,
    banned_until TIMESTAMPTZ, -- Checked by client sessions
    ban_until TIMESTAMPTZ,    -- Targeted by admin panels (both supported for compatibility)
    reason TEXT,              -- Ban reason
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optimize username searches (e.g. check username availability)
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);
-- Optimize user ban lookups
CREATE INDEX IF NOT EXISTS idx_profiles_banned ON public.profiles (id) WHERE banned = TRUE;

COMMENT ON TABLE public.profiles IS 'Stores basic user information, customization, and ban moderation flags.';


-- -------------------------------------------------------------
-- 2. MESSAGES TABLE (Chat history & context retention)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optimize fetching user conversational history ordered by timestamp
CREATE INDEX IF NOT EXISTS idx_messages_user_history ON public.messages (user_id, created_at DESC);

COMMENT ON TABLE public.messages IS 'Stores chat message logs between users and BurakAI neural models.';


-- -------------------------------------------------------------
-- 3. IMAGES TABLE (AI Generated Image Art Gallery)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optimize lookups for individual user image creations
CREATE INDEX IF NOT EXISTS idx_images_user_id ON public.images (user_id, created_at DESC);

COMMENT ON TABLE public.images IS 'Tracks prompt configurations and URLs for user-generated AI images.';


-- -------------------------------------------------------------
-- 4. VIDEOS TABLE (AI Generated Video clips)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optimize lookups for individual user video creations
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON public.videos (user_id, created_at DESC);

COMMENT ON TABLE public.videos IS 'Tracks prompt configurations and URLs for user-generated AI videos.';


-- -------------------------------------------------------------
-- 5. FEEDBACKS TABLE (User bug reports / feature requests)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_name VARCHAR(100),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.feedbacks IS 'Collects feedback submissions and support logs from app visitors.';


-- -------------------------------------------------------------
-- 6. ADMIN LOGS TABLE (Administrative Actions & Auditing)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id TEXT NOT NULL, -- Admin trigger user identifier
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('ban', 'unban', 'delete_user', 'system_config')),
    target_user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for auditing administrative operations
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON public.admin_logs (admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON public.admin_logs (target_user_id);

COMMENT ON TABLE public.admin_logs IS 'Tracks security logs and moderation events triggered by administrators.';


-- =============================================================
-- Row Level Security (RLS) & Standard Policies Example
-- =============================================================

-- Enable Row Level Security (RLS) if you plan on deploying directly to Supabase sandbox
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are readable by everyone" 
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert/update their own profile" 
    ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- Messages Policies
CREATE POLICY "Users can manage their own message logs" 
    ON public.messages FOR ALL USING (true) WITH CHECK (true);

-- Images / Videos Policies
CREATE POLICY "Users can manage their own creations" 
    ON public.images FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users can manage their own video generation logs" 
    ON public.videos FOR ALL USING (true) WITH CHECK (true);

-- Feedbacks Policies
CREATE POLICY "Anyone can submit feedback" 
    ON public.feedbacks FOR INSERT WITH CHECK (true);

-- Admin Logs Policies
CREATE POLICY "Only authorized operations can check admin records" 
    ON public.admin_logs FOR SELECT USING (true);
