import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ Error: DATABASE_URL is not defined in .env');
    process.exit(1);
}

const client = new Client({ connectionString });

const migrationQuery = `
-- Add selectedSize column to OrderItem table
ALTER TABLE public."OrderItem" ADD COLUMN IF NOT EXISTS "selectedSize" text;
`;

async function migrate() {
    try {
        console.log('Connecting to database...');
        await client.connect();

        console.log('Adding "selectedSize" column to "OrderItem" table...');
        await client.query(migrationQuery);

        console.log('✅ Success: Migration complete.');
    } catch (err: any) {
        console.error('❌ Error during migration:', err.message);
    } finally {
        await client.end();
    }
}

migrate();
