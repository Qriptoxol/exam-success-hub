-- Create enum for exam types
CREATE TYPE public.exam_type AS ENUM ('ЕГЭ', 'ОГЭ');

-- Create enum for order status
CREATE TYPE public.order_status AS ENUM ('pending', 'paid', 'delivered', 'cancelled');

-- Create profiles table for Telegram users
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subjects/products table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  exam_type exam_type NOT NULL,
  price INTEGER NOT NULL,
  original_price INTEGER,
  icon TEXT NOT NULL DEFAULT 'book',
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  demo_content TEXT,
  full_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  total_amount INTEGER NOT NULL,
  telegram_payment_charge_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order items table (many-to-many between orders and subjects)
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  price INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create favorites table
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, subject_id)
);

-- Create cart table
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, subject_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Subjects are public (anyone can view active subjects)
CREATE POLICY "Anyone can view active subjects" 
ON public.subjects 
FOR SELECT 
USING (is_active = true);

-- Profiles policies (public read, owner can update)
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (true);

-- Orders policies
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own orders" 
ON public.orders 
FOR UPDATE 
USING (true);

-- Order items policies
CREATE POLICY "Users can view order items" 
ON public.order_items 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create order items" 
ON public.order_items 
FOR INSERT 
WITH CHECK (true);

-- Favorites policies
CREATE POLICY "Users can view favorites" 
ON public.favorites 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage favorites" 
ON public.favorites 
FOR ALL 
USING (true);

-- Cart policies
CREATE POLICY "Users can view cart" 
ON public.cart_items 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage cart" 
ON public.cart_items 
FOR ALL 
USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample subjects
INSERT INTO public.subjects (title, description, exam_type, price, original_price, icon, is_popular) VALUES
  ('Математика (профиль)', 'Полный комплект с решениями всех заданий', 'ЕГЭ', 990, 1490, 'calculator', true),
  ('Русский язык', 'Все типы заданий + сочинения', 'ЕГЭ', 890, 1290, 'book-text', true),
  ('Обществознание', 'Теория и практика', 'ЕГЭ', 790, NULL, 'globe', false),
  ('Физика', 'Формулы и задачи', 'ЕГЭ', 890, NULL, 'atom', false),
  ('Математика', 'Алгебра и геометрия', 'ОГЭ', 590, 890, 'calculator', true),
  ('Русский язык', 'Изложение и сочинение', 'ОГЭ', 490, NULL, 'book-text', false),
  ('Химия', 'Реакции и расчёты', 'ЕГЭ', 690, NULL, 'flask-conical', false),
  ('История', 'Даты и события', 'ЕГЭ', 790, NULL, 'history', false),
  ('Биология', 'Теория и практика', 'ЕГЭ', 790, NULL, 'leaf', false),
  ('Информатика', 'Программирование и теория', 'ЕГЭ', 990, 1290, 'code', true);