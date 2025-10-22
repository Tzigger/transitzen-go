-- Add INSERT policy for profiles table to allow new user signups
-- The handle_new_user trigger needs this policy to insert profiles
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);