-- Create the shopping items table
CREATE TABLE IF NOT EXISTS public.shopping_items (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  quantity INTEGER NOT NULL DEFAULT 1,
  note TEXT,
  unit TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create an index on user_id for faster queries
CREATE INDEX IF NOT EXISTS shopping_items_user_id_idx ON public.shopping_items(user_id);

-- Enable Row Level Security
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to insert their own shopping items
CREATE POLICY "Users can insert their own shopping items"
ON public.shopping_items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to select their own shopping items
CREATE POLICY "Users can view their own shopping items"
ON public.shopping_items
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to update their own shopping items
CREATE POLICY "Users can update their own shopping items"
ON public.shopping_items
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow users to delete their own shopping items
CREATE POLICY "Users can delete their own shopping items"
ON public.shopping_items
FOR DELETE
USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE public.shopping_items IS 'Stores shopping items for users';
COMMENT ON COLUMN public.shopping_items.id IS 'Unique identifier for the shopping item';
COMMENT ON COLUMN public.shopping_items.user_id IS 'Reference to the user who owns this shopping item';
COMMENT ON COLUMN public.shopping_items.title IS 'Title/name of the shopping item';
COMMENT ON COLUMN public.shopping_items.completed IS 'Whether the item has been purchased/completed';
COMMENT ON COLUMN public.shopping_items.quantity IS 'Quantity of the item needed';
COMMENT ON COLUMN public.shopping_items.note IS 'Optional note or comment about the item';
COMMENT ON COLUMN public.shopping_items.unit IS 'Optional unit of measurement (e.g., kg, liters)';
COMMENT ON COLUMN public.shopping_items.category IS 'Optional category for the item'; 