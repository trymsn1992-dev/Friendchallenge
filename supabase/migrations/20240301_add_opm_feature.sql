-- Migration to support One Punch Man style multi-exercise challenges

-- 1. Add `is_opm` to challenges
ALTER TABLE public.challenges
ADD COLUMN is_opm BOOLEAN DEFAULT false;

-- 2. Create challenge_exercises table
CREATE TABLE public.challenge_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    daily_goal NUMERIC NOT NULL,
    unit TEXT NOT NULL
);

-- Add indexes for performance
CREATE INDEX idx_challenge_exercises_challenge_id ON public.challenge_exercises(challenge_id);

-- Enable RLS on the new table
ALTER TABLE public.challenge_exercises ENABLE ROW LEVEL SECURITY;

-- Policies for challenge_exercises
CREATE POLICY "Anyone can view challenge exercises" 
ON public.challenge_exercises FOR SELECT 
USING (true);

-- Only challenge creator can insert/update/delete exercises (we might relax this later, but safe start)
CREATE POLICY "Challenge creator can insert exercises" 
ON public.challenge_exercises FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.challenges 
        WHERE id = challenge_exercises.challenge_id AND creator_id = auth.uid()
    )
);

CREATE POLICY "Challenge creator can update exercises" 
ON public.challenge_exercises FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.challenges 
        WHERE id = challenge_exercises.challenge_id AND creator_id = auth.uid()
    )
);

CREATE POLICY "Challenge creator can delete exercises" 
ON public.challenge_exercises FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.challenges 
        WHERE id = challenge_exercises.challenge_id AND creator_id = auth.uid()
    )
);


-- 3. Modify progress_logs to support specific exercises
ALTER TABLE public.progress_logs
ADD COLUMN exercise_id UUID REFERENCES public.challenge_exercises(id) ON DELETE CASCADE;

-- Add index
CREATE INDEX idx_progress_logs_exercise_id ON public.progress_logs(exercise_id);
