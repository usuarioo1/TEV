'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface SessionData {
    id: number;
    username: string;
    rol: string;
    name: string | null;
    email: string | null;
    rut: string | null;
    empresa: string | null;
}

interface SessionContextValue {
    session: SessionData | null;
    loading: boolean;
    refresh: () => void;
}

const SessionContext = createContext<SessionContextValue>({
    session: null,
    loading: true,
    refresh: () => { },
});

export function SessionProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<SessionData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchSession = () => {
        fetch('/api/auth/session')
            .then(res => {
                if (!res.ok) return null;
                return res.json();
            })
            .then(data => setSession(data))
            .catch(() => setSession(null))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchSession();
    }, []);

    return (
        <SessionContext.Provider value={{ session, loading, refresh: fetchSession }}>
            {children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    return useContext(SessionContext);
}
