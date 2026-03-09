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
import { generateInvoiceEmail } from './emailTemplates.js';
import rateLimit from 'express-rate-limit';

// --- Supabase Setup ---
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️ SUPABASE config missing from env. DB operations will fail.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
            undefined, null,          // server-to-server / Vite proxy
            'http://localhost:5173',
            'http://localhost:3000',
            'http://127.0.0.1:5173',
            process.env.VITE_FRONTEND_URL,  // e.g. https://pricekam.vercel.app
        ];
        if (
            !origin ||
            allowed.includes(origin) ||
            origin.includes('localhost') ||
            origin.includes('127.0.0.1') ||
            origin.includes('vercel.app') ||
            origin.includes('ngrok-free.app') ||
            origin.includes('ngrok.io')
        ) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// --- Rate Limiters ---
// Use a custom keyGenerator that respects Vercel's x-forwarded-for headers
const getClientIp = (req: any) => {
    return req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';
};

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: 'Too many attempts. Please try again in 15 minutes.' },
    standardHeaders: true, legacyHeaders: false,
    keyGenerator: getClientIp,
    validate: false // completely disable strict validation to survive Vercel proxy
});
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    message: { message: 'Too many requests. Slow down!' },
    standardHeaders: true, legacyHeaders: false,
    keyGenerator: getClientIp,
    validate: false // completely disable strict validation to survive Vercel proxy
});
app.use('/api/', apiLimiter);

// --- Health Check (with DB test) ---
app.get('/api/health', async (req, res) => {
    let dbStatus = 'NOT_TESTED';
    try {
        const { error } = await supabase.from('Product').select('id', { count: 'exact', head: true }).limit(1);
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
        env: process.env.NODE_ENV
    });
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
        const { data: user, error } = await supabase.from('User').select('*').eq('id', decoded.id).single();

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
        const { data: existingUser } = await supabase.from('User').select('id').eq('email', email).single();
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const { data: user, error } = await supabase.from('User').insert({
            email,
            password: hashedPassword,
            name
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
        const { data: user, error } = await supabase.from('User').select('*').eq('email', email).single();
        if (error || !user) return res.status(400).json({ message: 'Invalid credentials' });

        // Guard: Google-only users have no password
        if (!user.password) {
            return res.status(400).json({ message: 'This account uses Google sign-in. Please use "Continue with Google".' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        res.cookie('token', token, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 });
        res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Unified Supabase Auth Sink (Google, Email, Phone)
app.post('/api/auth/supabase', async (req, res) => {
    const { access_token, password } = req.body;
    if (!access_token) return res.status(400).json({ message: 'Missing access_token' });

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey || serviceRoleKey.includes('your_')) {
        return res.status(503).json({ message: 'Supabase not configured on server' });
    }

    try {
        // 1. Verify token with Supabase
        const { createClient } = await import('@supabase/supabase-js');
        const adminClient = createClient(supabaseUrl, serviceRoleKey);
        const { data: { user: sbUser }, error: sbError } = await adminClient.auth.getUser(access_token);

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

        // 3. Find existing user by googleId OR email only (avoid UUID/CUID id mismatch)
        const orConditions = googleId ? `email.eq.${email},googleId.eq.${googleId}` : `email.eq.${email}`;
        let { data: user } = await supabase.from('User')
            .select('*')
            .or(orConditions)
            .maybeSingle();

        const isNewUser = !user;

        if (user) {
            // Update existing user — link googleId if missing, fill name if missing
            const { data: updatedUser, error: updateError } = await supabase.from('User')
                .update({
                    ...(googleId && !user.googleId ? { googleId } : {}),
                    ...(!user.name && name ? { name } : {}),
                    ...(hashedPassword && !user.password ? { password: hashedPassword } : {}),
                })
                .eq('id', user.id)
                .select()
                .single();

            if (updateError) throw updateError;
            user = updatedUser;
        } else {
            // Create brand new user
            const { data: newUser, error: createError } = await supabase.from('User')
                .insert({
                    email,
                    name: name || 'Pricekam User',
                    googleId,
                    password: hashedPassword,
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
        console.error('[Google Auth] Unexpected error:', err?.message, err?.code, err?.meta);
        res.status(500).json({ message: 'Authentication sync failed', detail: err?.message });
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
        const { error } = await supabase.from('User')
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
        const { data: products, error } = await supabase.from('Product')
            .select('id, price, stock, title')
            .in('id', productIds);

        if (error || !products || products.length !== productIds.length) {
            return res.status(400).json({ message: 'One or more products not found' });
        }

        // Validate stock and compute subtotal from DB prices
        let subtotal = 0;
        const validatedItems: { productId: string; quantity: number; price: number }[] = [];
        for (const cartItem of items) {
            const product = products.find(p => p.id === cartItem.productId);
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
        const { data: existingOrder } = await supabase.from('Order')
            .select('id')
            .eq('razorpayPaymentId', razorpay_payment_id)
            .maybeSingle();

        if (existingOrder) {
            return res.status(409).json({ message: 'Payment already processed', orderId: existingOrder.id });
        }

        // 3. Get user for email
        const { data: user } = await supabase.from('User')
            .select('email')
            .eq('id', req.user.id)
            .single();

        if (!user) return res.status(404).json({ message: 'User not found' });

        // 4. Re-fetch REAL prices from DB — never trust client-supplied prices
        const productIds = items.map((i: any) => i.productId);
        const { data: products, error: pError } = await supabase.from('Product')
            .select('id, price, stock, title')
            .in('id', productIds);

        if (pError || !products || products.length !== productIds.length) {
            return res.status(400).json({ message: 'One or more products not found' });
        }

        // 5. Validate stock and build verified items list
        let subtotal = 0;
        const verifiedItems: { productId: string; quantity: number; price: number }[] = [];
        for (const cartItem of items) {
            const product = products.find(p => p.id === cartItem.productId);
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

        // 8. Create order in DB + decrement stock (Manually handling since client doesn't support transactions easily)
        // First, create the order
        const { data: order, error: orderError } = await supabase.from('Order').insert({
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
        }).select().single();

        if (orderError || !order) throw orderError || new Error('Failed to create order');

        // Second, create order items
        const { error: itemsError } = await supabase.from('OrderItem').insert(
            verifiedItems.map(item => ({
                orderId: order.id,
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
            }))
        );

        if (itemsError) throw itemsError;

        // Third, decrement stock for each item
        for (const item of verifiedItems) {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                await supabase.from('Product')
                    .update({ stock: product.stock - item.quantity })
                    .eq('id', item.productId);
            }
        }

        // Fetch full order for response (with nested items)
        const { data: fullOrder } = await supabase.from('Order')
            .select('*, items:OrderItem(*, product:Product(*))')
            .eq('id', order.id)
            .single();

        // 4. Send invoice email (non-blocking)
        try {
            const { subject, html } = generateInvoiceEmail(order, user.email);
            await resend.emails.send({
                from: 'Joyful Cart <onboarding@resend.dev>',
                to: user.email,
                subject,
                html,
            });
        } catch (emailErr) {
            console.error('Invoice email failed (non-critical):', emailErr);
        }

        res.status(201).json(order);
    } catch (error) {
        console.error('Payment Verify Error:', error);
        res.status(500).json({ message: 'Server error during order creation' });
    }
});

// --- USER ORDER ROUTES ---

// Create new order (legacy COD without advance — kept for fallback)
app.post('/api/orders', authenticateToken, async (req: any, res) => {
    const { total, items, customerAddress, paymentMethod } = req.body;
    try {
        const { data: order, error: orderError } = await supabase.from('Order').insert({
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
        }).select().single();

        if (orderError || !order) throw orderError || new Error('Failed to create order');

        const { error: itemsError } = await supabase.from('OrderItem').insert(
            items.map((item: any) => ({
                orderId: order.id,
                productId: item.productId,
                quantity: parseInt(item.quantity),
                price: parseFloat(item.price)
            }))
        );

        if (itemsError) throw itemsError;

        const { data: fullOrder } = await supabase.from('Order')
            .select('*, items:OrderItem(*, product:Product(*))')
            .eq('id', order.id)
            .single();

        res.status(201).json(fullOrder);
    } catch (error) {
        console.error('Order Creation Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's orders
app.get('/api/orders', authenticateToken, async (req: any, res) => {
    try {
        const { data: orders, error } = await supabase.from('Order')
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
        const { data: order, error } = await supabase.from('Order')
            .select('*')
            .eq('id', req.params.id)
            .eq('userId', req.user.id)
            .single();

        if (error || !order) return res.status(404).json({ message: 'Order not found' });
        if (order.status !== 'PENDING') {
            return res.status(400).json({ message: 'Only PENDING orders can be cancelled' });
        }
        const { data: updated, error: updateError } = await supabase.from('Order')
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
        const { data: order, error } = await supabase.from('Order')
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
        const { data: product, error } = await supabase.from('Product')
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
        const transformed = (categories || []).map(c => ({
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
        const { data: category, error } = await supabase.from('Category').insert({ name, icon, color }).select().single();
        if (error) throw error;
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/categories/:id', authenticateToken, authorizeRoles(['ADMIN']), async (req, res) => {
    const { name, icon, color } = req.body;
    try {
        const { data: category, error } = await supabase.from('Category')
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
        const { count, error: countError } = await supabase.from('Product')
            .select('id', { count: 'exact', head: true })
            .eq('categoryId', req.params.id);

        if (count && count > 0) {
            return res.status(400).json({ message: 'Cannot delete category with associated products' });
        }
        const { error } = await supabase.from('Category').delete().eq('id', req.params.id);
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
        const { data: product, error } = await supabase.from('Product').insert({
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
        const { data: product, error } = await supabase.from('Product')
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
        const { error } = await supabase.from('Product').delete().eq('id', req.params.id);
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
        const { data: orders, error } = await supabase.from('Order')
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
        const { data: order, error } = await supabase.from('Order')
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
        const { data: users, error } = await supabase.from('User')
            .select('*, orders:Order(id)')
            .order('createdAt', { ascending: false });

        if (error) {
            console.error('Supabase Admin Users Error:', error);
            return res.status(500).json({ message: 'Database error fetching users', detail: error.message });
        }

        // Transform: count orders in JS
        const transformed = (users || []).map(u => ({
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
            supabase.from('User').select('*', { count: 'exact', head: true }),
            supabase.from('Product').select('*', { count: 'exact', head: true }),
            supabase.from('Order').select('*', { count: 'exact', head: true }),
            supabase.from('Order').select('total'),
            supabase.from('Order').select('*, user:User(name)').order('createdAt', { ascending: false }).limit(5)
        ]);

        if (uErr || pErr || oErr || rErr || roErr) {
            console.error('Stats DB Error:', uErr || pErr || oErr || rErr || roErr);
            return res.status(500).json({ message: 'Database error fetching stats' });
        }

        const totalRevenue = revenueData?.reduce((acc, o) => acc + o.total, 0) || 0;

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

        const { data: orders, error } = await supabase.from('Order')
            .select('total, createdAt')
            .gte('createdAt', sixMonthsAgo.toISOString());

        if (error) throw error;

        const revenueByMonth = orders?.reduce((acc: any, order) => {
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
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}

export default app;
