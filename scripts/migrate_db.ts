
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sql = `
-- Create domain_configs table for scraping strategy caching
CREATE TABLE IF NOT EXISTS domain_configs (
    domain VARCHAR(255) PRIMARY KEY,
    strategy VARCHAR(50) NOT NULL, -- 'DIRECT_FETCH' or 'FIRECRAWL'
    last_success_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE domain_configs ENABLE ROW LEVEL SECURITY;

-- Policy for reading (open to authenticated users for now, or service role bypasses it)
-- We'll use a DO block to avoid error if policy exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'domain_configs' AND policyname = 'Allow read access to authenticated users'
    ) THEN
        CREATE POLICY "Allow read access to authenticated users" ON domain_configs
            FOR SELECT TO authenticated USING (true);
    END IF;
END
$$;

-- Grant permissions to authenticated and anon (just in case)
GRANT SELECT ON domain_configs TO authenticated;
GRANT SELECT ON domain_configs TO anon;
GRANT ALL ON domain_configs TO service_role;
`;

async function runMigration() {
    console.log('🔌 Connecting to Supabase...');
    
    // Unfortunately, supabase-js client doesn't support raw SQL execution directly 
    // unless via RPC or if we use the postgres connection string.
    // However, since we are in a "Service Role" context, we can cheat by creating an RPC function 
    // OR we can just use the fact that we might have the pg driver installed?
    // Let's check package.json... No pg driver.
    
    // Plan B: We can't run RAW SQL via supabase-js client without a custom RPC function.
    // BUT! We can use the REST API to create the table via a "RPC hack" if one exists, 
    // or we can simply ask the user to run it because the client library is limited.
    
    // Wait, let's look at the problem. I need to execute SQL.
    // The user wants ME to do it.
    // I can use the 'postgres' library if I install it, but I don't have the connection string (password is hidden inside the project usually).
    
    console.log('⚠️ LIMITATION: The Supabase JS client cannot execute raw SQL (CREATE TABLE) directly.');
    console.log('✅ However, I have already prepared the migration file for you at:');
    console.log('   supabase/migrations/20251213000001_domain_cache.sql');
    console.log('\n👉 Please copy the content of that file and paste it into the Supabase SQL Editor.');
}

runMigration();
