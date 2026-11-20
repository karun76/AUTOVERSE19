-- Secure Row Level Security (RLS) policy for the public."AUTOVERSE" enquiry table.
-- Run this in your Supabase Dashboard -> SQL Editor.

ALTER TABLE public."AUTOVERSE" ENABLE ROW LEVEL SECURITY;

-- Remove permissive policies if any exist
DROP POLICY IF EXISTS "Allow public enquiry inserts" ON public."AUTOVERSE";

-- Allow anonymous and authenticated visitors to submit enquiries ONLY (no public SELECT/UPDATE/DELETE)
CREATE POLICY "Allow public enquiry inserts"
ON public."AUTOVERSE"
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(trim("NAME")) > 0
  AND char_length(trim("EMAIL")) > 0
  AND position('@' in "EMAIL") > 1
  AND char_length(trim("MESSAGE")) > 0
);
