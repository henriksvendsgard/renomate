-- Create the houses table
CREATE TABLE IF NOT EXISTS public.houses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  photo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create an index on user_id for houses
CREATE INDEX IF NOT EXISTS houses_user_id_idx ON public.houses(user_id);

-- Enable RLS for houses
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for houses
CREATE POLICY "Users can insert their own houses"
ON public.houses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own houses"
ON public.houses
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own houses"
ON public.houses
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own houses"
ON public.houses
FOR DELETE
USING (auth.uid() = user_id);

-- Create the rooms table with JSONB for tasks
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY,
  house_id UUID REFERENCES public.houses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  budget NUMERIC NOT NULL DEFAULT 0,
  deadline TEXT, -- ISO date string
  thumbnail TEXT,
  photos JSONB DEFAULT '[]'::jsonb, -- Array of photo URLs/base64
  tasks JSONB DEFAULT '[]'::jsonb, -- Array of task objects
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create an index on house_id for rooms
CREATE INDEX IF NOT EXISTS rooms_house_id_idx ON public.rooms(house_id);

-- Enable RLS for rooms
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Create a function to check if a user owns a house
CREATE OR REPLACE FUNCTION public.user_owns_house(house_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.houses
    WHERE id = house_id
    AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Create RLS policies for rooms that check house ownership
CREATE POLICY "Users can insert rooms in their houses"
ON public.rooms
FOR INSERT
WITH CHECK (public.user_owns_house(house_id));

CREATE POLICY "Users can view rooms in their houses"
ON public.rooms
FOR SELECT
USING (public.user_owns_house(house_id));

CREATE POLICY "Users can update rooms in their houses"
ON public.rooms
FOR UPDATE
USING (public.user_owns_house(house_id));

CREATE POLICY "Users can delete rooms in their houses"
ON public.rooms
FOR DELETE
USING (public.user_owns_house(house_id));

-- Add comments for documentation
COMMENT ON TABLE public.houses IS 'Stores houses owned by users';
COMMENT ON TABLE public.rooms IS 'Stores rooms within houses';
COMMENT ON COLUMN public.rooms.tasks IS 'JSON array of task objects with id, title, done, note, cost fields';
COMMENT ON COLUMN public.rooms.photos IS 'JSON array of photo URLs or base64 strings'; 