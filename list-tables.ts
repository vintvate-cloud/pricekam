import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';

const { Client } = pg;
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ Error: DATABASE_URL is not defined in .env');
    process.exit(1);
}

const client = new Client({
    connectionString,
});

async function listTables() {
    try {
        await client.connect();
        
        console.log('--- Listing all tables in public schema ---');
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        
        for (const row of res.rows) {
            console.log(`- ${row.table_name}`);
        }
        
    } catch (err: any) {
        console.error('❌ Database error:', err.message);
    } finally {
        await client.end();
    }
}

listTables();
