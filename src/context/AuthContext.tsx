import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '@/lib/api-config';


interface User {
    id: string;
    email: string;
    name: string;
    role: 'CUSTOMER' | 'ADMIN';
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    logout: () => void;
    refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const queryClient = useQueryClient();

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['me'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/auth/me`, {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });
            if (!res.ok) return null;
            return res.json();
        },
        retry: false,
    });

    const user = data?.user || null;

    useEffect(() => {
        if (user) {
            localStorage.setItem('userRole', user.role.toLowerCase());
        } else if (data !== undefined) {
            localStorage.removeItem('userRole');
        }
    }, [user, data]);

    const logoutMutation = useMutation({
        mutationFn: async () => {
            await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });
        },
        onSuccess: () => {
            localStorage.removeItem('userRole');
            queryClient.invalidateQueries({ queryKey: ['me'] });
        },
    });

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            logout: () => logoutMutation.mutate(),
            refetchUser: refetch
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
