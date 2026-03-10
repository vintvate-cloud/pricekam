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

const createTableQuery = `
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

        console.log('Creating "password_reset" table...');
        await client.query(createTableQuery);

        console.log('✅ Success: "password_reset" table is ready.');
    } catch (err: any) {
        console.error('❌ Error creating table:', err.message);
    } finally {
        await client.end();
    }
}

setup();
