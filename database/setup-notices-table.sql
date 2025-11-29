-- Create notices table in Supabase
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS notices (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert a default notice
INSERT INTO notices (content) 
VALUES ('Welcome to Milky Way! Fresh milk delivery available daily.')
ON CONFLICT DO NOTHING;

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_notices_created_at ON notices(created_at DESC);
