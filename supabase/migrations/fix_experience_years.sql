-- Change experience_years from integer to numeric to support values like 4.5
ALTER TABLE public.resume_insights
  ALTER COLUMN experience_years TYPE numeric(4,1) USING experience_years::numeric;
