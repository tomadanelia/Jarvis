-- Create a table to store user-specific simulation setups
CREATE TABLE public.user_setups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    grid_id UUID NOT NULL REFERENCES public.grids(id) ON DELETE CASCADE,
    robots JSONB,
    tasks JSONB,
    strategy TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    -- Ensure a user cannot have two setups with the same name
    UNIQUE(user_id, name)
);

-- Add comments to columns for clarity
COMMENT ON TABLE public.user_setups IS 'Stores saved simulation configurations for authenticated users.';
COMMENT ON COLUMN public.user_setups.robots IS 'JSONB array of Robot objects at their initial locations.';
COMMENT ON COLUMN public.user_setups.tasks IS 'JSONB array of Task objects.';

-- Enable Row Level Security
ALTER TABLE public.user_setups
  ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own setups." ON public.user_setups
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own setups." ON public.user_setups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own setups." ON public.user_setups
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own setups." ON public.user_setups
  FOR DELETE USING (auth.uid() = user_id);