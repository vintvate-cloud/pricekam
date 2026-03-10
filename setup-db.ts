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
CREATE TABLE IF NOT EXISTS public."Verification" (
  email text NOT NULL,
  code text NOT NULL,
  "expiresAt" timestamp with time zone NOT NULL,
  CONSTRAINT "Verification_pkey" PRIMARY KEY (email)
);
`;

async function setup() {
    try {
        console.log('Connecting to database...');
        await client.connect();

        console.log('Creating "Verification" table...');
        await client.query(createTableQuery);

        console.log('✅ Success: "Verification" table is ready.');
    } catch (err) {
        console.error('❌ Error creating table:', err.message);
    } finally {
        await client.end();
    }
}

setup();
