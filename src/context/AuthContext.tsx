import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type Profile = {
    id: string;
    role: 'student' | 'parent';
    live_status: boolean;
    full_name?: string;
    age?: number;
    year?: string;
    department?: string;
    skills?: string[];
    onboarded?: boolean;
};

type AuthContextType = {
    session: Session | null;
    isOnboarded: boolean;
    loading: boolean;
    signOut: () => Promise<void>;
    setIsOnboarded: (val: boolean) => void;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    isOnboarded: false,
    loading: true,
    signOut: async () => { },
    setIsOnboarded: () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [isOnboarded, setIsOnboarded] = useState(false);
    const [loading, setLoading] = useState(true);

    const checkUser = async (currentSession: Session | null) => {
        if (!currentSession) {
            setSession(null);
            setIsOnboarded(false);
            setLoading(false);
            return;
        }

        setSession(currentSession);

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('onboarded')
                .eq('id', currentSession.user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile status:', error);
            }

            setIsOnboarded(data?.onboarded === true);
        } catch (error) {
            console.error(error);
            setIsOnboarded(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            checkUser(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, newSession) => {
                setLoading(true); // Lock the UI during transition
                checkUser(newSession);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ session, isOnboarded, loading, signOut, setIsOnboarded }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
