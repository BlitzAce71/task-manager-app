-- Create enum types for better data consistency
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'completed', 'cancelled');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#667eea',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, name)
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status task_status DEFAULT 'todo' NOT NULL,
  priority task_priority DEFAULT 'medium' NOT NULL,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX tasks_user_id_idx ON public.tasks(user_id);
CREATE INDEX tasks_status_idx ON public.tasks(status);
CREATE INDEX tasks_priority_idx ON public.tasks(priority);
CREATE INDEX tasks_due_date_idx ON public.tasks(due_date);
CREATE INDEX tasks_category_id_idx ON public.tasks(category_id);
CREATE INDEX categories_user_id_idx ON public.categories(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at 
  BEFORE UPDATE ON public.categories 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at 
  BEFORE UPDATE ON public.tasks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically set completed_at when status changes to completed
CREATE OR REPLACE FUNCTION set_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  ELSIF NEW.status != 'completed' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_task_completed_at 
  BEFORE UPDATE ON public.tasks 
  FOR EACH ROW EXECUTE FUNCTION set_completed_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view own profile" 
  ON public.users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.users FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Create RLS policies for categories table
CREATE POLICY "Users can view own categories" 
  ON public.categories FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own categories" 
  ON public.categories FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" 
  ON public.categories FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" 
  ON public.categories FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for tasks table
CREATE POLICY "Users can view own tasks" 
  ON public.tasks FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks" 
  ON public.tasks FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" 
  ON public.tasks FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" 
  ON public.tasks FOR DELETE 
  USING (auth.uid() = user_id);

-- Create default categories for new users
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, color, description) VALUES
    (NEW.id, 'Personal', '#667eea', 'Personal tasks and goals'),
    (NEW.id, 'Work', '#f093fb', 'Work-related tasks and projects'),
    (NEW.id, 'Shopping', '#4facfe', 'Shopping lists and errands'),
    (NEW.id, 'Health', '#43e97b', 'Health and fitness goals');
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_user_default_categories 
  AFTER INSERT ON public.users 
  FOR EACH ROW EXECUTE FUNCTION create_default_categories();