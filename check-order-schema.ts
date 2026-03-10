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

const schemaQuery = `
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM 
    information_schema.columns 
WHERE 
    table_name IN ('Order', 'OrderItem')
ORDER BY 
    table_name, ordinal_position;
`;

async function checkSchema() {
    try {
        await client.connect();
        const res = await client.query(schemaQuery);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err: any) {
        console.error('❌ Error checking schema:', err.message);
    } finally {
        await client.end();
    }
}

checkSchema();
