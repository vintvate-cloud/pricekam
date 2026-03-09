import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

const AuthCallbackPage = () => {
    const navigate = useNavigate();
    const { refetchUser } = useAuth();
    const [error, setError] = useState('');

    useEffect(() => {
        let handled = false;

        const handleCallback = async (session: any) => {
            if (handled || !session) return;
            handled = true;

            try {
                // Send Supabase access token to our backend → get JWT cookie
                const res = await fetch('/api/auth/supabase', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ access_token: session.access_token }),
                });

                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.message || 'Failed to authenticate with server');
                }

                const data = await res.json();
                await refetchUser();

                // New Google users go to set-password; returning users go home
                if (data.isNewUser) {
                    navigate('/set-password');
                } else {
                    navigate('/');
                }
            } catch (err: any) {
                console.error('Auth callback error:', err);
                setError(err.message || 'Something went wrong during Google sign-in');
            }
        };

        // Check if session already exists (e.g. after redirect)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) handleCallback(session);
        });

        // Also listen for auth state change (catches the redirect token exchange)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) setTimeout(() => handleCallback(session), 300);
        });

        return () => subscription.unsubscribe();
    }, [navigate, refetchUser]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4 max-w-md px-6">
                    <div className="text-5xl">😔</div>
                    <h1 className="text-2xl font-display font-black text-foreground">Sign-in Failed</h1>
                    <p className="text-muted-foreground font-body">{error}</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-display font-semibold hover:opacity-90 transition-all"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <p className="font-display font-semibold text-foreground text-lg">Signing you in with Google...</p>
                <p className="text-muted-foreground font-body text-sm">Welcome to Pricekam!</p>
            </div>
        </div>
    );
};

export default AuthCallbackPage;
