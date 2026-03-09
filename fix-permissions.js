import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

// The connection string from .env
const DATABASE_URL = 'postgresql://postgres:vintvate123@db.wrrautgwimxgptmdqaew.supabase.co:5432/postgres';

const client = new Client({
    connectionString: DATABASE_URL,
});

async function runGrants() {
    try {
        await client.connect();
        console.log('Connected directly to PostgreSQL.');

        const queries = [
            'GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;',
            'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;',
            'GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;',
            'GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;',
            'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;',
            'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;',
            'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;'
        ];

        for (const query of queries) {
            console.log(`Running: ${query}`);
            await client.query(query);
        }

        console.log('✅ Permissions granted successfully.');
    } catch (err) {
        console.error('❌ Failed to run grants:', err);
    } finally {
        await client.end();
    }
}

runGrants();
