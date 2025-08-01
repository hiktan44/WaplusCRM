-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  subscription TEXT DEFAULT 'free' CHECK (subscription IN ('free', 'premium', 'enterprise')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Search history table
CREATE TABLE public.search_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  query TEXT NOT NULL,
  institutions TEXT[] NOT NULL,
  filters JSONB DEFAULT '{}',
  results_count INTEGER DEFAULT 0,
  search_time_ms INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved documents table
CREATE TABLE public.saved_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  document_id TEXT NOT NULL,
  institution_id TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  url TEXT,
  decision_date DATE,
  department TEXT,
  decision_number TEXT,
  keywords TEXT[],
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LLM conversations table
CREATE TABLE public.llm_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  document_id UUID REFERENCES public.saved_documents(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Yeni Sohbet',
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google')),
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  subscription_type TEXT NOT NULL CHECK (subscription_type IN ('free', 'premium', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'expired', 'trial')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX idx_search_history_created_at ON public.search_history(created_at DESC);
CREATE INDEX idx_saved_documents_user_id ON public.saved_documents(user_id);
CREATE INDEX idx_saved_documents_institution ON public.saved_documents(institution_id);
CREATE INDEX idx_saved_documents_created_at ON public.saved_documents(created_at DESC);
CREATE INDEX idx_llm_conversations_user_id ON public.llm_conversations(user_id);
CREATE INDEX idx_llm_conversations_document_id ON public.llm_conversations(document_id);
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);

-- Full-text search indexes
CREATE INDEX idx_saved_documents_title_search ON public.saved_documents USING gin(to_tsvector('turkish', title));
CREATE INDEX idx_saved_documents_content_search ON public.saved_documents USING gin(to_tsvector('turkish', content));

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Search history policies
CREATE POLICY "Users can view own search history" ON public.search_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search history" ON public.search_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own search history" ON public.search_history
  FOR DELETE USING (auth.uid() = user_id);

-- Saved documents policies
CREATE POLICY "Users can view own saved documents" ON public.saved_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved documents" ON public.saved_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved documents" ON public.saved_documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved documents" ON public.saved_documents
  FOR DELETE USING (auth.uid() = user_id);

-- LLM conversations policies
CREATE POLICY "Users can view own conversations" ON public.llm_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON public.llm_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON public.llm_conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON public.llm_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- User subscriptions policies
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON public.user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Create initial free subscription
  INSERT INTO public.user_subscriptions (user_id, subscription_type, status, trial_end)
  VALUES (
    NEW.id,
    'free',
    'trial',
    NOW() + INTERVAL '14 days'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_saved_documents_updated_at BEFORE UPDATE ON public.saved_documents
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_llm_conversations_updated_at BEFORE UPDATE ON public.llm_conversations
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();