import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;

const client = new Client({ connectionString });

async function migrate() {
    try {
        await client.connect();
        console.log('Connected to database for migration...');

        // Add gst column to Product table
        await client.query(`
            ALTER TABLE "Product" 
            ADD COLUMN IF NOT EXISTS "gst" DOUBLE PRECISION DEFAULT 0;
        `);
        console.log('✅ Added gst column to Product table');

        // Add gst column to OrderItem table for historical record
        await client.query(`
            ALTER TABLE "OrderItem" 
            ADD COLUMN IF NOT EXISTS "gst" DOUBLE PRECISION DEFAULT 0;
        `);
        console.log('✅ Added gst column to OrderItem table');

    } catch (err: any) {
        console.error('Migration error:', err.message);
    } finally {
        await client.end();
    }
}
migrate();
