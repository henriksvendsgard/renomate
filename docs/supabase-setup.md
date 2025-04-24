# Supabase Setup for Renomate

This guide will help you set up Supabase authentication for the Renomate application.

## 1. Create a Supabase Account

1. Go to [Supabase](https://supabase.com/) and sign up for an account or log in.
2. Create a new project with your preferred name and select a region closest to your users.
3. Set a secure database password (you won't need to use this directly in the app).

## 2. Configure Authentication

1. In your Supabase dashboard, go to **Authentication** > **Providers**.
2. Email/Password authentication should be enabled by default.
3. Configure email templates (optional):
   - Go to **Authentication** > **Email Templates**
   - Customize the templates for Confirmation, Invitation, Magic Link, and Change Email.

## 3. Get API Credentials

1. Go to **Project Settings** > **API**.
2. Find your **Project URL** and copy it.
3. Find your **anon** (public) key and copy it.
4. Add these to your `.env` file:
   ```
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

## 4. Configure Site URL

1. Go to **Authentication** > **URL Configuration**.
2. Set the **Site URL** to your application's URL (e.g., `http://localhost:5173` for local development).
3. Add any additional redirect URLs if needed.

## 5. Create User Tables and RLS Policies

If you want to store additional user data beyond authentication:

1. Go to **Database** > **Tables**.
2. Create a `profiles` table with at least:
   - `id` (UUID, primary key, references `auth.users.id`)
   - Other fields like `name`, `avatar_url`, etc.
3. Set up Row Level Security (RLS) for the table:
   - Enable RLS for the table
   - Create policies to allow users to read/update only their own profiles

Example SQL:
```sql
-- Create a profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Create a trigger to create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (new.id, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## 6. Testing Authentication

1. Restart your application to load the new environment variables.
2. Try registering a new user through the application.
3. Check the Supabase **Authentication** > **Users** section to verify the user was created.
4. Test login and logout functionality.

## 7. Troubleshooting

- If emails aren't being received, check your spam folder or the Supabase logs.
- For local development, Supabase sometimes shows auth emails in the dashboard even if they're not delivered.
- Make sure your Site URL and redirect URLs are configured correctly.
- Check the browser console for any authentication errors.

## 8. Next Steps

After setting up authentication, you can:

- Create additional tables for your application data
- Set up RLS policies for those tables
- Implement database triggers for data integrity
- Create server-side functions for complex operations 