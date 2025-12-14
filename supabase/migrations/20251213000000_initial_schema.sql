-- Drop existing tables to ensure clean state
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.user_manga_settings CASCADE;
DROP TABLE IF EXISTS public.read_status CASCADE; -- Found in existing schema
DROP TABLE IF EXISTS public.push_subscriptions CASCADE; -- Found in existing schema
DROP TABLE IF EXISTS public.chapters CASCADE;
DROP TABLE IF EXISTS public.mangas CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table (sync with auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    notification_token TEXT
);

-- Enable RLS on users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create mangas table
CREATE TABLE public.mangas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    url TEXT UNIQUE NOT NULL,
    cover_image TEXT,
    source VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on mangas
ALTER TABLE public.mangas ENABLE ROW LEVEL SECURITY;

-- Create chapters table
CREATE TABLE public.chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manga_id UUID REFERENCES public.mangas(id) ON DELETE CASCADE,
    number NUMERIC NOT NULL,
    title VARCHAR(255),
    url TEXT NOT NULL,
    release_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(manga_id, number)
);

-- Enable RLS on chapters
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

-- Create user_manga_settings table
CREATE TABLE public.user_manga_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    manga_id UUID REFERENCES public.mangas(id) ON DELETE CASCADE,
    notifications_enabled BOOLEAN DEFAULT true,
    last_read_chapter NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, manga_id)
);

-- Enable RLS on user_manga_settings
ALTER TABLE public.user_manga_settings ENABLE ROW LEVEL SECURITY;

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    manga_id UUID REFERENCES public.mangas(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
    sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_chapters_manga_id ON public.chapters(manga_id);
CREATE INDEX idx_chapters_release_date ON public.chapters(release_date DESC);
CREATE INDEX idx_user_manga_user_id ON public.user_manga_settings(user_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_sent ON public.notifications(sent);

-- Trigger to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger (drop first to avoid error if exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- RLS Policies

-- Users
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Mangas
CREATE POLICY "Anyone can read mangas" ON public.mangas
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Authenticated users can insert mangas" ON public.mangas
  FOR INSERT TO authenticated WITH CHECK (true);

-- Chapters
CREATE POLICY "Anyone can read chapters" ON public.chapters
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Authenticated users can insert chapters" ON public.chapters
  FOR INSERT TO authenticated WITH CHECK (true);

-- User Manga Settings
CREATE POLICY "Users can view own settings" ON public.user_manga_settings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_manga_settings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_manga_settings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings" ON public.user_manga_settings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.mangas TO anon;
GRANT SELECT ON public.chapters TO anon;
GRANT SELECT ON public.users TO anon;
