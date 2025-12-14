
-- Create domain_configs table for scraping strategy caching
CREATE TABLE IF NOT EXISTS domain_configs (
    domain VARCHAR(255) PRIMARY KEY,
    strategy VARCHAR(50) NOT NULL, -- 'DIRECT_FETCH' or 'FIRECRAWL'
    last_success_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (although backend uses service key, it's good practice)
ALTER TABLE domain_configs ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users (if needed in future)
CREATE POLICY "Allow read access to authenticated users" ON domain_configs
    FOR SELECT TO authenticated USING (true);

-- Allow service role full access (default, but explicit is good)
-- Note: Service role bypasses RLS, so this is just for clarity or if we grant write later.
