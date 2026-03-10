import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ Error: DATABASE_URL is not defined in .env');
    process.exit(1);
}

const client = new Client({
    connectionString,
});

const renameTableQuery = `
-- Drop existing lowercase if it exists
DROP TABLE IF EXISTS public.password_reset;

-- Rename the existing camelCase one to lowercase
-- This is often more compatible with PostgREST/Supabase defaults
ALTER TABLE IF EXISTS public."PasswordReset" RENAME TO password_reset;

-- If it didn't exist, create it anew in lowercase
CREATE TABLE IF NOT EXISTS public.password_reset (
  email text NOT NULL,
  token text NOT NULL,
  "expiresAt" timestamp with time zone NOT NULL,
  CONSTRAINT "password_reset_pkey" PRIMARY KEY (email)
);
`;

async function setup() {
    try {
        console.log('Connecting to database...');
        await client.connect();

        console.log('Migrating to "password_reset" (lowercase)...');
        await client.query(renameTableQuery);

        console.log('✅ Success: Table is now "password_reset".');
    } catch (err: any) {
        console.error('❌ Error during migration:', err.message);
    } finally {
        await client.end();
    }
}

setup();
