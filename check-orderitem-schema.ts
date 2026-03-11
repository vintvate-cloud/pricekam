import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;

const client = new Client({ connectionString });

async function checkSchema() {
    try {
        await client.connect();
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'OrderItem';
        `);
        console.log('--- OrderItem Table Schema ---');
        console.table(res.rows);
    } catch (err: any) {
        console.error('Database error:', err.message);
    } finally {
        await client.end();
    }
}
checkSchema();
