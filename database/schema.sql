-- Phase 3: Supabase Database Schema
-- Run this script in your Supabase SQL Editor

-- 1. Create a table to store prediction history
-- We link it to Supabase's built-in auth.users table so we don't need to create a custom users table from scratch.
CREATE TABLE public.predictions_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    audio_file_url TEXT NOT NULL,
    predicted_emotion TEXT NOT NULL,
    confidence_score FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.predictions_history ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Users can only see their own predictions
CREATE POLICY "Users can view their own predictions"
    ON public.predictions_history FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only insert their own predictions
CREATE POLICY "Users can insert their own predictions"
    ON public.predictions_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own predictions (optional)
CREATE POLICY "Users can delete their own predictions"
    ON public.predictions_history FOR DELETE
    USING (auth.uid() = user_id);

-- ====================================================================
-- 4. Set up the Storage Bucket for Audio Uploads
-- NOTE: You can also create this manually via the Supabase Dashboard -> Storage -> "New Bucket" (make it public).
-- ====================================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('audio-uploads', 'audio-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
-- Allow public access to read the audio files (needed for the <audio> player in React)
CREATE POLICY "Public Access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'audio-uploads');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload audio"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'audio-uploads' AND 
        auth.role() = 'authenticated'
    );
    
-- Allow users to delete their own uploaded files
CREATE POLICY "Users can delete their own audio"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'audio-uploads' AND 
        auth.uid() = owner
    );
