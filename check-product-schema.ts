import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';
import fs from 'fs';

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ Error: DATABASE_URL is not defined in .env');
    process.exit(1);
}

const client = new Client({ connectionString });

async function checkSchema() {
    try {
        await client.connect();
        const res = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'Product';
        `);
        let output = '--- Product Table Schema ---\n';
        for (const row of res.rows) {
            output += `Column: ${row.column_name}, Type: ${row.data_type}, Nullable: ${row.is_nullable}, Default: ${row.column_default}\n`;
        }
        fs.writeFileSync('schema-output.txt', output);
        console.log('✅ Schema written to schema-output.txt');
    } catch (err: any) {
        console.error('Database error:', err.message);
    } finally {
        await client.end();
    }
}
checkSchema();
