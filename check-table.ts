import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTable() {
    console.log('Checking for Verification table...');
    const { data, error } = await supabase.from('Verification').select('email').limit(1);
    if (error) {
        console.error('Table Error:', error.message);
        if (error.code === '42P01') {
            console.log('❌ TABLE MISSING: Verification table does not exist.');
        }
    } else {
        console.log('✅ TABLE EXISTS: Verification table is ready.');
    }
}

checkTable();
