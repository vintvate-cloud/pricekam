import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuthUser(email: string) {
    console.log(`Checking if ${email} exists in Supabase Auth...`);
    try {
        const { data, error } = await supabase.auth.admin.listUsers();
        if (error) {
            console.error('Error listing users:', error.message);
            return;
        }

        const user = data.users.find(u => u.email === email);
        if (user) {
            console.log('✅ User exists in Supabase Auth:', user.id);
        } else {
            console.log('❌ User NOT found in Supabase Auth. Falling back to local DB is EXPECTED.');
        }
    } catch (err: any) {
        console.error('Crash checking auth:', err.message);
    }
}

checkAuthUser('admin@joyfulcart.com');
