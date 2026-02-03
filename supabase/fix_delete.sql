-- 1. Fiks sletting av logger (Cascade Delete)
-- Dette gjør at når du sletter en utfordring, slettes alle loggene automatisk.
ALTER TABLE public.progress_logs 
DROP CONSTRAINT IF EXISTS progress_logs_challenge_id_fkey;

ALTER TABLE public.progress_logs 
ADD CONSTRAINT progress_logs_challenge_id_fkey 
FOREIGN KEY (challenge_id) 
REFERENCES public.challenges(id) 
ON DELETE CASCADE;

-- 2. Aktiver sikkerhet (RLS) for å være sikker på at regler gjelder
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_logs ENABLE ROW LEVEL SECURITY;

-- 3. Slette-regler (Policies)

-- Tillat at skaperen kan slette sin egen utfordring
DROP POLICY IF EXISTS "Creators can delete own challenges" ON public.challenges;
CREATE POLICY "Creators can delete own challenges" 
ON public.challenges 
FOR DELETE 
USING (auth.uid() = creator_id);

-- Tillat at alle kan lese utfordringer (viktig når RLS er på)
DROP POLICY IF EXISTS "Public read challenges" ON public.challenges;
CREATE POLICY "Public read challenges" 
ON public.challenges FOR SELECT USING (true);

-- Tillat at innloggede brukere kan opprette
DROP POLICY IF EXISTS "Auth users create challenges" ON public.challenges;
CREATE POLICY "Auth users create challenges" 
ON public.challenges FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Tillat at skaperen kan oppdatere (f.eks. deltakere)
DROP POLICY IF EXISTS "Creators update challenges" ON public.challenges;
CREATE POLICY "Creators update challenges" 
ON public.challenges FOR UPDATE USING (auth.uid() = creator_id);

-- Regler for logger
DROP POLICY IF EXISTS "Public read logs" ON public.progress_logs;
CREATE POLICY "Public read logs" ON public.progress_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert logs" ON public.progress_logs;
CREATE POLICY "Users can insert logs" ON public.progress_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own logs" ON public.progress_logs;
CREATE POLICY "Users can delete own logs" ON public.progress_logs FOR DELETE USING (auth.uid() = user_id);
