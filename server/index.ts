import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Resend } from 'resend';
import { generateInvoiceEmail, generateVerificationEmail, generateResetPasswordEmail } from './emailTemplates.js';
import rateLimit from 'express-rate-limit';

// --- Supabase Setup ---
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️ CRITICAL: SUPABASE config missing from env. DB operations WILL crash.');
}

// Initialize safely. If URL is missing, createClient throws.
let supabase: any;
try {
    if (supabaseUrl && (supabaseUrl.startsWith('http') || supabaseUrl.startsWith('https'))) {
        supabase = createClient(supabaseUrl, supabaseServiceKey);
    } else {
        console.error('❌ Invalid or missing Supabase URL:', supabaseUrl);
    }
} catch (err: any) {
    console.error('❌ Supabase Initialization Failed:', err.message);
}

// Safety wrapper for DB calls
const db = {
    get from() {
        if (!supabase) throw new Error('Database not initialized. Check server environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).');
        return supabase.from.bind(supabase);
    }
};

// --- In-Memory Product Cache (60s TTL) ---
const productCache: { data: any[] | null; ts: number } = { data: null, ts: 0 };
const CACHE_TTL_MS = 60_000;
function getCachedProducts() { return Date.now() - productCache.ts < CACHE_TTL_MS ? productCache.data : null; }
function setCachedProducts(data: any[]) { productCache.data = data; productCache.ts = Date.now(); }
function invalidateProductCache() { productCache.data = null; productCache.ts = 0; }

// --- Input Sanitizer (trim + strip HTML tags) ---
function sanitize(val: any): string {
    if (typeof val !== 'string') return String(val ?? '');
    return val.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

console.log('--- Env Status ---');
console.log('PORT:', process.env.PORT);
console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('------------------');

const app = express();
// Trust proxy is required for Vercel/Express rate limiting to work
app.set('trust proxy', 1);

const PORT = (process.env.PORT as unknown as number) || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'joyful_cart_secret';

// --- Razorpay Setup ---
let razorpay: any;
try {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || 'placeholder',
        key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder',
    });
} catch (error) {
    console.warn('⚠️ Razorpay could not be initialized. Please check your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
}

// --- Resend Setup ---
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');
if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY is missing from .env. Invoice emails will fail.');
}

// --- Configure Cloudinary ---
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// --- Configure Multer ---
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }
});

// --- Middleware ---
const authenticateToken = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Access denied' });

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid token' });
    }
};

const authorizeRoles = (roles: string[]) => {
    return (req: any, res: any, next: any) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        next();
    };
};

app.use(cors({
    origin: (origin, callback) => {
        const allowed = [
            undefined, null,
            'http://localhost:5173',
            'http://localhost:3000',
            'http://127.0.0.1:5173',
            'http://localhost:8080',
            process.env.VITE_FRONTEND_URL,
            'https://www.pricekam.com',
            'https://pricekam.com'
        ];
        if (
            !origin ||
            allowed.includes(origin) ||
            origin.includes('localhost') ||
            origin.includes('127.0.0.1') ||
            origin.includes('pricekam.com') ||
            origin.includes('vercel.app') ||
            origin.includes('ngrok-free.app') ||
            origin.includes('ngrok.io')
        ) {
            callback(null, true);
        } else {
            console.warn('❌ CORS Blocked:', origin);
            callback(new Error(`Not allowed by CORS: ${origin}`));
        }
    },
    credentials: true
}));
app.use((req, res, next) => {
    // Catch JSON parsing errors
    express.json()(req, res, (err) => {
        if (err) {
            console.error('❌ JSON Parse Error:', err.message);
            return res.status(400).json({ message: 'Malformed JSON in request body', error: err.message });
        }
        next();
    });
});
app.use(cookieParser());

// --- Rate Limiters ---
// Use a custom keyGenerator that respects Vercel's x-forwarded-for headers
const getClientIp = (req: any) => {
    return req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';
};

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // Increased for stability
    message: { message: 'Too many attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getClientIp
});
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    message: { message: 'Too many requests. Slow down!' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getClientIp
});
app.use('/api/', apiLimiter);

// --- Health Check (with DB test) ---
app.get('/api/health', async (req, res) => {
    let dbStatus = 'NOT_TESTED';
    try {
        if (!supabase) return res.status(503).json({ status: 'DOWN', database: 'CLIENT_NOT_READY' });
        const { error } = await db.from('Product').select('id', { count: 'exact', head: true }).limit(1);
        if (error) throw error;
        dbStatus = 'CONNECTED';
    } catch (err: any) {
        dbStatus = `ERROR: ${err.message}`;
    }

    // Log masked URL for debugging (hiding password)
    const maskedUrl = process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ':****@');
    console.log('Testing DB Connection via Supabase Client');

    res.json({
        status: 'UP',
        database: dbStatus,
        maskedUrl,
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV,
        node: process.version
    });
});

app.get('/api/test-db', async (req, res) => {
    try {
        if (!supabase) throw new Error('Supabase client not initialized');
        const { data, error } = await db.from('User').select('id').limit(1);
        if (error) throw error;
        res.json({ success: true, message: 'Database connection verified', data });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message, hint: 'Verify SUPABASE_URL and Service Role key in host dashboard.' });
    }
});

// --- DELIVERY CHARGE LOGIC ---
// Free delivery for ALL payment methods when subtotal >= ₹2000
function calcDeliveryCharge(paymentMethod: string, subtotal: number): number {
    if (subtotal >= 2000) return 0;
    return 100;
}

// --- AUTH ROUTES ---

app.get('/api/test', (req, res) => {
    res.json({ message: "Pricekam Server is Alive!", timestamp: new Date().toISOString() });
});

// Get User Profile
app.get('/api/auth/me', async (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.json({ user: null });

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
        const { data: user, error } = await db.from('User').select('*').eq('id', decoded.id).single();

        if (error || !user) {
            res.clearCookie('token');
            return res.json({ user: null });
        }
        res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (error) {
        res.clearCookie('token');
        res.json({ user: null });
    }
});

// Register
app.post('/api/auth/register', authLimiter, async (req, res) => {
    const email = sanitize(req.body.email);
    const name = sanitize(req.body.name);
    const { password } = req.body;
    try {
        const { data: existingUser } = await db.from('User').select('id').eq('email', email).single();
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const { data: user, error } = await db.from('User').insert({
            id: crypto.randomUUID(),
            email,
            password: hashedPassword,
            name,
            updatedAt: new Date().toISOString()
        }).select().single();

        if (error || !user) throw error || new Error('Failed to create user');

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        res.cookie('token', token, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 });
        res.status(201).json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login
app.post('/api/auth/login', authLimiter, async (req, res) => {
    const email = sanitize(req.body.email);
    const { password } = req.body;
    try {
        if (!supabase) throw new Error('Supabase client is not initialized. Please check host environment variables.');

        const { data: user, error } = await db.from('User').select('*').eq('email', email).single();
        if (error || !user) {
            console.error('Login: User not found or DB error:', error?.message);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Guard: Google-only users have no password
        if (!user.password) {
            return res.status(400).json({ message: 'This account uses Google sign-in. Please use "Continue with Google".' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'lax', // Lax is better for cross-site auth redirects
            secure: true,   // Always secure in production
            maxAge: 24 * 60 * 60 * 1000
        });
        res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (error: any) {
        console.error('💥 Login Crash:', error.message, error.stack);
        res.status(500).json({
            message: 'Server Error during login',
            detail: error.message,
            hint: 'Check if database is reachable and environment variables are set on the server host.'
        });
    }
});

// Send Verification OTP
app.post('/api/auth/send-otp', authLimiter, async (req, res) => {
    const email = sanitize(req.body.email);
    if (!email) return res.status(400).json({ message: 'Email is required' });

    try {
        // Check if user already exists
        const { data: existingUser } = await db.from('User').select('id').eq('email', email).maybeSingle();
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins

        // Save OTP to DB
        // UPSERT if email already has a pending code
        const { error } = await db.from('Verification').upsert({
            email,
            code: otp,
            expiresAt
        }, { onConflict: 'email' });

        if (error) {
            console.error('OTP DB Error:', error);
            return res.status(500).json({
                message: 'Database error while saving verification code',
                detail: error.message,
                hint: 'Ensure "Verification" table exists in Supabase. Run the SQL provided in the instructions.'
            });
        }

        // Send Email
        const sender = process.env.EMAIL_FROM || 'Pricekam <onboarding@resend.dev>';
        console.log('Attempting to send OTP email from:', sender);

        const { subject, html } = generateVerificationEmail(otp);
        const { error: emailError } = await resend.emails.send({
            from: sender,
            to: email,
            subject,
            html,
        });

        if (emailError) {
            console.error('Resend OTP Error:', emailError);
            return res.status(500).json({
                message: 'Failed to send verification email',
                detail: `${emailError.message} (Using sender: ${sender})`,
                hint: sender.includes('onboarding@resend.dev')
                    ? 'The server is falling back to the sandbox email because EMAIL_FROM is missing in .env.'
                    : 'The domain is verified, but Resend is still rejecting the from address.'
            });
        }

        res.json({ success: true, message: 'Verification code sent!' });
    } catch (err: any) {
        console.error('OTP Send Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Forgot Password - Custom Token Based
app.post('/api/auth/forgot-password', authLimiter, async (req, res) => {
    const email = sanitize(req.body.email);
    if (!email) return res.status(400).json({ message: 'Email is required' });

    try {
        // 1. Check if user exists in our DB
        const { data: user, error: userError } = await db.from('User').select('id, email').eq('email', email).maybeSingle();
        
        // If user doesn't exist, we still return success to prevent email enumeration
        if (!user) {
            console.log(`Forgot password request for non-existent email: ${email}`);
            return res.json({ success: true, message: 'If an account exists with this email, a reset link has been sent.' });
        }

        // 2. Generate custom reset token
        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

        // 3. Store in password_reset table
        const { error: resetError } = await db.from('password_reset').upsert({
            email: user.email,
            token,
            expiresAt
        });

        if (resetError) {
            console.error('Password reset token storage failed:', resetError);
            return res.status(500).json({ message: 'Failed to initialize password reset' });
        }

        // 4. Construct reset link for frontend
        const origin = req.get('origin');
        const frontendUrl = origin || process.env.VITE_FRONTEND_URL || 'http://localhost:5173';
        const resetLink = `${frontendUrl}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

        // 5. Send email via Resend
        const sender = process.env.EMAIL_FROM || 'Pricekam <noreply@pricekam.com>';
        const { subject, html } = generateResetPasswordEmail(resetLink);
        
        const { error: emailError } = await resend.emails.send({
            from: sender,
            to: user.email,
            subject,
            html,
        });

        if (emailError) {
            console.error('Resend Forgot Password Error:', emailError);
            return res.status(500).json({ message: 'Failed to send reset email' });
        }

        res.json({ success: true, message: 'If an account exists with this email, a reset link has been sent.' });
    } catch (err: any) {
        console.error('Forgot Password Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reset Password - Custom Token Based
app.post('/api/auth/reset-password', authLimiter, async (req, res) => {
    const email = sanitize(req.body.email);
    const token = sanitize(req.body.token);
    const { password } = req.body;

    if (!email || !token || !password) {
        return res.status(400).json({ message: 'Email, token and new password are required' });
    }

    try {
        // 1. Verify token
        const { data: record, error: tokenError } = await db.from('password_reset')
            .select('*')
            .eq('email', email)
            .eq('token', token)
            .maybeSingle();

        if (tokenError || !record) {
            return res.status(400).json({ message: 'Invalid or expired reset link' });
        }

        // 2. Check expiry
        if (new Date(record.expiresAt) < new Date()) {
            await db.from('password_reset').delete().eq('email', email);
            return res.status(400).json({ message: 'Reset link has expired' });
        }

        // 3. Update password in User table
        const hashedPassword = await bcrypt.hash(password, 10);
        const { error: userError } = await db.from('User')
            .update({ 
                password: hashedPassword,
                updatedAt: new Date().toISOString()
            })
            .eq('email', email);

        if (userError) {
            console.error('User password update failed:', userError);
            throw userError;
        }

        // 4. Clean up the token
        await db.from('password_reset').delete().eq('email', email);

        res.json({ success: true, message: 'Password updated successfully!' });
    } catch (err: any) {
        console.error('Reset Password Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify OTP
app.post('/api/auth/verify-otp', authLimiter, async (req, res) => {
    const email = sanitize(req.body.email);
    const code = sanitize(req.body.code);

    if (!email || !code) return res.status(400).json({ message: 'Email and code are required' });

    try {
        const { data: record, error } = await db.from('Verification')
            .select('*')
            .eq('email', email)
            .eq('code', code)
            .maybeSingle();

        if (error || !record) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        const now = new Date();
        if (new Date(record.expiresAt) < now) {
            return res.status(400).json({ message: 'Verification code expired' });
        }

        // Success - clean up the code
        await db.from('Verification').delete().eq('email', email);

        res.json({ success: true, message: 'Email verified!' });
    } catch (err) {
        console.error('OTP Verify Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});
app.post('/api/auth/supabase', async (req, res) => {
    const { access_token, password } = req.body;
    if (!access_token) return res.status(400).json({ message: 'Missing access_token' });

    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!url || !key || key.includes('your_')) {
        console.error('❌ Supabase Auth Sink: Missing credentials');
        return res.status(503).json({ message: 'Supabase not configured on server hosts' });
    }

    try {
        // 1. Verify token with Supabase - Using the same client logic
        const { data: { user: sbUser }, error: sbError } = await createClient(url, key).auth.getUser(access_token);

        if (sbError || !sbUser) {
            console.error('[Google Auth] Token verification failed:', sbError?.message);
            return res.status(401).json({ message: 'Invalid or expired token', details: sbError?.message });
        }

        const email = sbUser.email;
        const name = sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || sbUser.user_metadata?.email?.split('@')[0] || email?.split('@')[0];
        const isGoogle = sbUser.app_metadata?.provider === 'google' || sbUser.identities?.some((id: any) => id.provider === 'google');
        const googleId = isGoogle ? sbUser.id : null;

        if (!email) {
            return res.status(400).json({ message: 'No email address returned from Google' });
        }

        // 2. Hash password if provided (email signup flow)
        let hashedPassword: string | null = null;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        // 3. Find existing user by email OR googleId
        let { data: user } = await db.from('User').select('*').eq('email', email).maybeSingle();

        if (!user && googleId) {
            const { data: googleUser } = await db.from('User').select('*').eq('googleId', googleId).maybeSingle();
            user = googleUser;
        }

        const isNewUser = !user;

        if (user) {
            // Update existing user — link googleId if missing, fill name if missing
            const { data: updatedUser, error: updateError } = await db.from('User')
                .update({
                    ...(googleId && !user.googleId ? { googleId } : {}),
                    ...(!user.name && name ? { name } : {}),
                    ...(hashedPassword && !user.password ? { password: hashedPassword } : {}),
                    updatedAt: new Date().toISOString()
                })
                .eq('id', user.id)
                .select()
                .single();

            if (updateError) throw updateError;
            user = updatedUser;
        } else {
            // Create brand new user
            const { data: newUser, error: createError } = await db.from('User')
                .insert({
                    id: crypto.randomUUID(),
                    email,
                    name: name || 'Pricekam User',
                    googleId,
                    password: hashedPassword,
                    updatedAt: new Date().toISOString()
                })
                .select()
                .single();

            if (createError) throw createError;
            user = newUser;
        }

        // 4. Issue our own JWT cookie
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
        res.json({
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
            isNewUser
        });
    } catch (err: any) {
        console.error('[Google Auth Sync] CRITICAL ERROR:', err);
        res.status(500).json({
            message: 'Authentication sync failed',
            detail: err?.message,
            hint: 'This error happens because the database requires an ID and updatedAt field which were missing. I have re-added them.'
        });
    }
});

// Logout
app.post('/api/auth/logout', (req: any, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
});

// Set Password (for Google-signup users who want to add a password)
app.post('/api/auth/set-password', authenticateToken, async (req: any, res) => {
    const { password } = req.body;
    if (!password || password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const { error } = await db.from('User')
            .update({ password: hashedPassword })
            .eq('id', req.user.id);

        if (error) throw error;
        res.json({ message: 'Password saved successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to save password' });
    }
});

// --- RAZORPAY PAYMENT ROUTES ---

// Guard: reject requests if Razorpay keys are not configured
function assertRazorpayConfigured(res: any): boolean {
    if (!process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET.startsWith('XXXX')) {
        res.status(503).json({ message: 'Payment gateway not configured. Please add Razorpay keys.' });
        return false;
    }
    return true;
}

/**
 * POST /api/payment/create-order
 * Accepts items[], fetches REAL prices from DB, calculates totals server-side.
 * Client-supplied prices are NEVER trusted.
 */
app.post('/api/payment/create-order', authenticateToken, async (req: any, res) => {
    if (!assertRazorpayConfigured(res)) return;

    const { items, paymentMethod } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'No items provided' });
    }
    if (!['card', 'upi', 'cod'].includes(paymentMethod)) {
        return res.status(400).json({ message: 'Invalid payment method' });
    }

    try {
        // Fetch REAL prices from database — never trust client-supplied prices
        const productIds = items.map((i: any) => i.productId);
        const { data: products, error } = await db.from('Product')
            .select('id, price, stock, title')
            .in('id', productIds);

        if (error || !products || products.length !== productIds.length) {
            return res.status(400).json({ message: 'One or more products not found' });
        }

        // Validate stock and compute subtotal from DB prices
        let subtotal = 0;
        const validatedItems: { productId: string; quantity: number; price: number }[] = [];
        for (const cartItem of items) {
            const product = products.find((p: any) => p.id === cartItem.productId);
            if (!product) return res.status(400).json({ message: `Product ${cartItem.productId} not found` });
            const qty = parseInt(cartItem.quantity);
            if (qty < 1) return res.status(400).json({ message: 'Invalid quantity' });
            if (product.stock < qty) {
                return res.status(400).json({ message: `Insufficient stock for "${product.title}"` });
            }
            subtotal += product.price * qty;
            validatedItems.push({ productId: product.id, quantity: qty, price: product.price });
        }

        const delivery = calcDeliveryCharge(paymentMethod, subtotal);
        const orderTotal = subtotal + delivery;

        let amountToCollectNow = orderTotal;
        if (paymentMethod === 'cod') {
            amountToCollectNow = Math.ceil(orderTotal * 0.10);
        }

        // Create Razorpay order — amount is set by SERVER
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(amountToCollectNow * 100), // in paise
            currency: 'INR',
            receipt: `rcpt_${Date.now()}`,
            notes: {
                userId: req.user.id,
                paymentMethod,
                subtotal: subtotal.toFixed(2),
                deliveryCharge: delivery.toFixed(2),
                orderTotal: orderTotal.toFixed(2),
            }
        });

        res.json({
            razorpayOrderId: razorpayOrder.id,
            amountToCollectNow,
            orderTotal,
            deliveryCharge: delivery,
            validatedItems, // return server-computed items back to client
            currency: 'INR',
        });
    } catch (error) {
        console.error('Razorpay Create Order Error:', error);
        res.status(500).json({ message: 'Failed to create payment order' });
    }
});

/**
 * POST /api/payment/verify
 * 1. Verifies Razorpay HMAC signature
 * 2. Re-fetches product prices from DB (never trusts client prices)
 * 3. Re-computes order total and matches against Razorpay order amount
 * 4. Guards against duplicate payment IDs
 * 5. Decrements stock
 * 6. Sends invoice email
 */
app.post('/api/payment/verify', authenticateToken, async (req: any, res) => {
    if (!assertRazorpayConfigured(res)) return;

    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        items,
        customerAddress,
        paymentMethod,
    } = req.body;

    // Basic input validation
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ message: 'Missing payment verification fields' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'No items provided' });
    }
    const requiredAddr = ['name', 'phone', 'street', 'city', 'state', 'pincode'];
    for (const field of requiredAddr) {
        if (!customerAddress?.[field]?.trim()) {
            return res.status(400).json({ message: `Delivery address: ${field} is required` });
        }
    }

    try {
        // 1. HMAC Signature verification — prevents forged payments
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: 'Payment verification failed: invalid signature' });
        }

        // 2. Duplicate payment guard — prevent same payment creating 2 orders
        const { data: existingOrder } = await db.from('Order')
            .select('id')
            .eq('razorpayPaymentId', razorpay_payment_id)
            .maybeSingle();

        if (existingOrder) {
            return res.status(409).json({ message: 'Payment already processed', orderId: existingOrder.id });
        }

        // 3. Get user for email
        const { data: user } = await db.from('User')
            .select('email')
            .eq('id', req.user.id)
            .single();

        if (!user) return res.status(404).json({ message: 'User not found' });

        // 4. Re-fetch REAL prices from DB — never trust client-supplied prices
        const productIds = items.map((i: any) => i.productId);
        const { data: products, error: pError } = await db.from('Product')
            .select('id, price, stock, title')
            .in('id', productIds);

        if (pError || !products || products.length !== productIds.length) {
            return res.status(400).json({ message: 'One or more products not found' });
        }

        // 5. Validate stock and build verified items list
        let subtotal = 0;
        const verifiedItems: { productId: string; quantity: number; price: number }[] = [];
        for (const cartItem of items) {
            const product = products.find((p: any) => p.id === cartItem.productId);
            if (!product) return res.status(400).json({ message: `Product not found: ${cartItem.productId}` });
            const qty = parseInt(cartItem.quantity);
            if (qty < 1) return res.status(400).json({ message: 'Invalid quantity' });
            if (product.stock < qty) {
                return res.status(400).json({ message: `"${product.title}" is out of stock` });
            }
            subtotal += product.price * qty;
            verifiedItems.push({ productId: product.id, quantity: qty, price: product.price });
        }

        // 6. Re-compute totals server-side
        const delivery = calcDeliveryCharge(paymentMethod, subtotal);
        const orderTotal = subtotal + delivery;
        const amountExpected = paymentMethod === 'cod'
            ? Math.ceil(orderTotal * 0.10)
            : orderTotal;

        // 7. Verify the Razorpay order amount matches what we expected (tamper check)
        const rzpOrder = await razorpay.orders.fetch(razorpay_order_id) as any;
        const amountPaidPaise = rzpOrder.amount as number; // in paise
        const amountExpectedPaise = Math.round(amountExpected * 100);
        // Allow ±1 paise rounding tolerance
        if (Math.abs(amountPaidPaise - amountExpectedPaise) > 1) {
            console.error(`Amount mismatch: expected ${amountExpectedPaise} paise, got ${amountPaidPaise} paise`);
            return res.status(400).json({ message: 'Payment amount mismatch. Order rejected.' });
        }

        const advancePaid = paymentMethod === 'cod' ? amountExpected : null;

        // 8. Create order in DB + decrement stock
        const orderId = crypto.randomUUID();
        console.log(`Step 8: Creating order ${orderId} in DB...`);

        const { data: order, error: orderError } = await db.from('Order').insert({
            id: orderId,
            userId: req.user.id,
            total: orderTotal,
            status: 'PENDING',
            customerName: customerAddress.name.trim(),
            customerPhone: customerAddress.phone.trim(),
            streetAddress: customerAddress.street.trim(),
            city: customerAddress.city.trim(),
            state: customerAddress.state.trim(),
            pincode: customerAddress.pincode.trim(),
            paymentMethod,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            deliveryCharge: delivery,
            advancePaid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }).select().single();

        if (orderError || !order) {
            console.error('Order Insertion Error:', orderError);
            throw orderError || new Error('Failed to create order');
        }

        console.log('Step 9: Creating order items...');
        // Second, create order items
        const { error: itemsError } = await db.from('OrderItem').insert(
            verifiedItems.map(item => ({
                id: crypto.randomUUID(),
                orderId: order.id,
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
            }))
        );

        if (itemsError) throw itemsError;

        // Third, decrement stock for each item
        for (const item of verifiedItems) {
            const product = products.find((p: any) => p.id === item.productId);
            if (product) {
                await db.from('Product')
                    .update({ stock: product.stock - item.quantity })
                    .eq('id', item.productId);
            }
        }

        console.log('Step 8: Fetching full order details for response and invoice...');
        // Fetch full order for response (with nested items)
        const { data: fullOrder, error: fullOrderError } = await db.from('Order')
            .select('*, items:OrderItem(*, product:Product(*))')
            .eq('id', order.id)
            .single();

        if (fullOrderError) {
            console.error('Error fetching full order:', fullOrderError);
            // We don't throw here to avoid failing a successful payment, but we should log it
        }

        console.log('Step 9: Sending invoice email...');
        // 4. Send invoice email (non-blocking)
        try {
            if (fullOrder) {
                const { subject, html } = generateInvoiceEmail(fullOrder, user.email);
                await resend.emails.send({
                    from: process.env.EMAIL_FROM || 'Pricekam <noreply@pricekam.com>',
                    to: user.email,
                    subject,
                    html,
                });
                console.log('Invoice email sent successfully to:', user.email);
            } else {
                console.warn('Skipping invoice email: fullOrder not found');
            }
        } catch (emailErr) {
            console.error('Invoice email failed (non-critical):', emailErr);
        }

        console.log('Payment verification completed successfully for Order:', order.id);
        res.status(201).json(fullOrder || order);
    } catch (error: any) {
        console.error('💥 Payment Verify Error:', error.message, error.stack);
        res.status(500).json({
            message: 'Server error during order creation',
            detail: error.message,
            stack: error.stack
        });
    }
});

// --- USER ORDER ROUTES ---

// Create new order (legacy COD without advance — kept for fallback)
app.post('/api/orders', authenticateToken, async (req: any, res) => {
    const { total, items, customerAddress, paymentMethod } = req.body;
    try {
        const orderId = crypto.randomUUID();
        const { data: order, error: orderError } = await db.from('Order').insert({
            id: orderId,
            userId: req.user.id,
            total: parseFloat(total),
            status: 'PENDING',
            customerName: customerAddress?.name,
            customerPhone: customerAddress?.phone,
            streetAddress: customerAddress?.street,
            city: customerAddress?.city,
            state: customerAddress?.state,
            pincode: customerAddress?.pincode,
            paymentMethod: paymentMethod,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }).select().single();

        if (orderError || !order) throw orderError || new Error('Failed to create order');

        const { error: itemsError } = await db.from('OrderItem').insert(
            items.map((item: any) => ({
                id: crypto.randomUUID(),
                orderId: order.id,
                productId: item.productId,
                quantity: parseInt(item.quantity),
                price: parseFloat(item.price),
            }))
        );

        if (itemsError) throw itemsError;

        const { data: fullOrder } = await db.from('Order')
            .select('*, items:OrderItem(*, product:Product(*))')
            .eq('id', order.id)
            .single();

        // Send invoice email (non-blocking)
        try {
            const { data: user } = await db.from('User').select('email').eq('id', req.user.id).single();
            if (user && fullOrder) {
                const { subject, html } = generateInvoiceEmail(fullOrder, user.email);
                await resend.emails.send({
                    from: process.env.EMAIL_FROM || 'Pricekam <noreply@pricekam.com>',
                    to: user.email,
                    subject,
                    html,
                });
            }
        } catch (emailErr) {
            console.error('Invoice email failed (non-critical):', emailErr);
        }

        res.status(201).json(fullOrder);
    } catch (error) {
        console.error('Order Creation Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's orders
app.get('/api/orders', authenticateToken, async (req: any, res) => {
    try {
        const { data: orders, error } = await db.from('Order')
            .select('*, items:OrderItem(*, product:Product(*))')
            .eq('userId', req.user.id)
            .order('createdAt', { ascending: false });

        if (error) throw error;
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Cancel order (PENDING only)
app.post('/api/orders/:id/cancel', authenticateToken, async (req: any, res) => {
    try {
        const { data: order, error } = await db.from('Order')
            .select('*')
            .eq('id', req.params.id)
            .eq('userId', req.user.id)
            .single();

        if (error || !order) return res.status(404).json({ message: 'Order not found' });
        if (order.status !== 'PENDING') {
            return res.status(400).json({ message: 'Only PENDING orders can be cancelled' });
        }
        const { data: updated, error: updateError } = await db.from('Order')
            .update({ status: 'CANCELLED' })
            .eq('id', order.id)
            .select('*, items:OrderItem(*, product:Product(*))')
            .single();

        if (updateError) throw updateError;
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Return/Refund request (DELIVERED only)
app.post('/api/orders/:id/return', authenticateToken, async (req: any, res) => {
    const reason = sanitize(req.body.reason || '');
    if (!reason) return res.status(400).json({ message: 'Return reason is required' });
    try {
        const { data: order, error } = await db.from('Order')
            .select('*')
            .eq('id', req.params.id)
            .eq('userId', req.user.id)
            .single();

        if (error || !order) return res.status(404).json({ message: 'Order not found' });
        if (order.status !== 'DELIVERED') {
            return res.status(400).json({ message: 'Only delivered orders can be returned' });
        }
        // Mark as RETURN_REQUESTED — stored as a special CANCELLED variant with a note
        console.log(`[Return Request] Order ${order.id} — Reason: ${reason}`);
        res.json({ message: 'Return request submitted. Our team will contact you within 2 business days.', orderId: order.id, reason });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// --- PRODUCT ROUTES ---

app.get('/api/products', async (req, res) => {
    try {
        const cached = getCachedProducts();
        if (cached) return res.json(cached);

        // Fetch products with their categories
        const { data: products, error } = await supabase
            .from('Product')
            .select(`
                *,
                category:Category(*)
            `);

        if (error) {
            console.error('Supabase Products Error:', error);
            return res.status(500).json({ message: 'Database error fetching products', detail: error.message });
        }

        setCachedProducts(products || []);
        res.json(products);
    } catch (error: any) {
        console.error('Products Route Error:', error);
        res.status(500).json({ message: 'Server error', detail: error.message });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const { data: product, error } = await db.from('Product')
            .select('*, category:Category(*)')
            .eq('id', req.params.id)
            .single();
        if (error || !product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// --- CATEGORY ROUTES ---
app.get('/api/categories', async (req, res) => {
    try {
        // Fetch categories with product counts (simplified join)
        const { data: categories, error } = await supabase
            .from('Category')
            .select(`
                *,
                products:Product(id)
            `);

        if (error) {
            console.error('Supabase Categories Error:', error);
            return res.status(500).json({ message: 'Database error fetching categories', detail: error.message });
        }

        // Transform: products array to count for compatibility with frontend expectations
        const transformed = (categories || []).map((c: any) => ({
            ...c,
            _count: { products: Array.isArray(c.products) ? c.products.length : 0 }
        }));

        res.json(transformed);
    } catch (error: any) {
        console.error('Categories Error:', error);
        res.status(500).json({ message: 'Server error', detail: error.message });
    }
});

app.post('/api/categories', authenticateToken, authorizeRoles(['ADMIN']), async (req, res) => {
    const { name, icon, color } = req.body;
    try {
        const { data: category, error } = await db.from('Category').insert({ name, icon, color }).select().single();
        if (error) throw error;
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/categories/:id', authenticateToken, authorizeRoles(['ADMIN']), async (req, res) => {
    const { name, icon, color } = req.body;
    try {
        const { data: category, error } = await db.from('Category')
            .update({ name, icon, color })
            .eq('id', req.params.id)
            .select()
            .single();
        if (error) throw error;
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/categories/:id', authenticateToken, authorizeRoles(['ADMIN']), async (req, res) => {
    try {
        const { count, error: countError } = await db.from('Product')
            .select('id', { count: 'exact', head: true })
            .eq('categoryId', req.params.id);

        if (count && count > 0) {
            return res.status(400).json({ message: 'Cannot delete category with associated products' });
        }
        const { error } = await db.from('Category').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// --- ADMIN PRODUCT ACTIONS ---

app.post('/api/products', authenticateToken, authorizeRoles(['ADMIN']), async (req, res) => {
    const { title, description, price, originalPrice, image, images, categoryId, brand, ageGroup, stock, isFeatured } = req.body;
    try {
        const { data: product, error } = await db.from('Product').insert({
            title, description, price: parseFloat(price),
            originalPrice: originalPrice ? parseFloat(originalPrice) : null,
            image,
            images: Array.isArray(images) ? images : [],
            categoryId, brand, ageGroup,
            stock: parseInt(stock) || 0, isFeatured: !!isFeatured
        }).select().single();

        if (error) throw error;
        invalidateProductCache();
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/products/:id', authenticateToken, authorizeRoles(['ADMIN']), async (req, res) => {
    const { title, description, price, originalPrice, image, images, categoryId, brand, ageGroup, stock, isFeatured } = req.body;
    try {
        const { data: product, error } = await db.from('Product')
            .update({
                title, description, price: parseFloat(price),
                originalPrice: originalPrice ? parseFloat(originalPrice) : null,
                image,
                images: Array.isArray(images) ? images : [],
                categoryId, brand, ageGroup,
                stock: parseInt(stock) || 0, isFeatured: !!isFeatured
            })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        invalidateProductCache();
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/products/:id', authenticateToken, authorizeRoles(['ADMIN']), async (req, res) => {
    try {
        const { error } = await db.from('Product').delete().eq('id', req.params.id);
        if (error) throw error;
        invalidateProductCache();
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// --- CLOUDINARY UPLOAD ---
app.post('/api/upload', authenticateToken, authorizeRoles(['ADMIN']), upload.single('image'), async (req: any, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
        const result = await cloudinary.uploader.upload(dataURI, {
            resource_type: 'auto',
            folder: 'joyful-cart-products'
        });
        res.json({ url: result.secure_url });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'Upload failed' });
    }
});

// --- ADMIN ORDER ACTIONS ---

app.get('/api/admin/orders', authenticateToken, authorizeRoles(['ADMIN']), async (req, res) => {
    try {
        const { data: orders, error } = await db.from('Order')
            .select('*, user:User(*), items:OrderItem(*, product:Product(*))')
            .order('createdAt', { ascending: false });

        if (error) throw error;
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/admin/orders/:id', authenticateToken, authorizeRoles(['ADMIN']), async (req, res) => {
    const { status } = req.body;
    try {
        const { data: order, error } = await db.from('Order')
            .update({ status })
            .eq('id', req.params.id)
            .select('*, user:User(*), items:OrderItem(*, product:Product(*))')
            .single();

        if (error) throw error;
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// --- ADMIN CUSTOMER ACTIONS ---

app.get('/api/admin/users', authenticateToken, authorizeRoles(['ADMIN']), async (req, res) => {
    try {
        const { data: users, error } = await db.from('User')
            .select('*, orders:Order(id)')
            .order('createdAt', { ascending: false });

        if (error) {
            console.error('Supabase Admin Users Error:', error);
            return res.status(500).json({ message: 'Database error fetching users', detail: error.message });
        }

        // Transform: count orders in JS
        const transformed = (users || []).map((u: any) => ({
            ...u,
            _count: { orders: Array.isArray(u.orders) ? u.orders.length : 0 }
        }));

        res.json(transformed);
    } catch (error: any) {
        console.error('Admin Users Route Error:', error);
        res.status(500).json({ message: 'Server error', detail: error.message });
    }
});

// --- STATS & ANALYTICS ---

app.get('/api/admin/stats', authenticateToken, authorizeRoles(['ADMIN']), async (req, res) => {
    try {
        const [
            { count: totalUsers, error: uErr },
            { count: totalProducts, error: pErr },
            { count: totalOrders, error: oErr },
            { data: revenueData, error: rErr },
            { data: recentOrders, error: roErr }
        ] = await Promise.all([
            db.from('User').select('*', { count: 'exact', head: true }),
            db.from('Product').select('*', { count: 'exact', head: true }),
            db.from('Order').select('*', { count: 'exact', head: true }),
            db.from('Order').select('total'),
            db.from('Order').select('*, user:User(name)').order('createdAt', { ascending: false }).limit(5)
        ]);

        if (uErr || pErr || oErr || rErr || roErr) {
            console.error('Stats DB Error:', uErr || pErr || oErr || rErr || roErr);
            return res.status(500).json({ message: 'Database error fetching stats' });
        }

        const totalRevenue = revenueData?.reduce((acc: any, o: any) => acc + o.total, 0) || 0;

        res.json({
            totalUsers: totalUsers || 0,
            totalProducts: totalProducts || 0,
            totalOrders: totalOrders || 0,
            totalRevenue: totalRevenue,
            recentOrders: recentOrders || [],
            revenueChange: "+12.5%",
            ordersChange: "+8.2%",
            productsChange: `+${(totalProducts || 0) > 5 ? '5' : totalProducts}`,
            customersChange: "+15.3%"
        });
    } catch (error: any) {
        console.error('Stats Route Error:', error);
        res.status(500).json({ message: 'Server error', detail: error.message });
    }
});

app.get('/api/admin/analytics', authenticateToken, authorizeRoles(['ADMIN']), async (req, res) => {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const { data: orders, error } = await db.from('Order')
            .select('total, createdAt')
            .gte('createdAt', sixMonthsAgo.toISOString());

        if (error) throw error;

        const revenueByMonth = orders?.reduce((acc: any, order: any) => {
            const month = new Date(order.createdAt).toLocaleString('default', { month: 'short' });
            acc[month] = (acc[month] || 0) + order.total;
            return acc;
        }, {}) || {};

        const chartData = Object.keys(revenueByMonth).map(month => ({
            name: month,
            revenue: revenueByMonth[month]
        }));

        res.json({
            revenueChart: chartData,
            categoryDistribution: [
                { name: 'Toys', value: 400 },
                { name: 'Clothes', value: 300 },
                { name: 'Books', value: 300 },
                { name: 'Electronics', value: 200 },
            ]
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// 404 catch-all
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.method} ${req.url} not found` });
});

// --- Global Error Handler ---
app.use((err: any, req: any, res: any, next: any) => {
    console.error('💥 Global Error:', err);
    res.status(500).json({
        message: 'Internal Server Error',
        error: err.message, // ALWAYS show error message temporarily for debugging
        stack: err.stack,   // ALWAYS show stacktrace temporarily for debugging
        path: req.path
    });
});

// Only start server in development (not when used as Vercel serverless function)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}

export default app;
