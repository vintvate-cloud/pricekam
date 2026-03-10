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

async function verify() {
    try {
        await client.connect();
        
        console.log('--- Checking for PasswordReset table ---');
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'PasswordReset';
        `);
        
        if (res.rows.length > 0) {
            console.log('✅ Success: "PasswordReset" table exists.');
            const colRes = await client.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = 'PasswordReset';
            `);
            for (const row of colRes.rows) {
                console.log(`Column: ${row.column_name}, Type: ${row.data_type}`);
            }
        } else {
            console.error('❌ Error: "PasswordReset" table NOT found.');
        }

        // Try to trigger a schema reload by running a dummy SQL if possible, 
        // though Supabase PostgREST usually reloads if it detects a DDL change 
        // (but sometimes it needs help).
        
    } catch (err: any) {
        console.error('❌ Database error:', err.message);
    } finally {
        await client.end();
    }
}

verify();
