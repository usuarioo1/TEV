'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface LogoutButtonProps {
    variant?: 'default' | 'navbar' | 'mobile';
}

export default function LogoutButton({ variant = 'default' }: LogoutButtonProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleLogout = async () => {
        setLoading(true);

        // Intentar cerrar sesión con timeout
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 5000)
        );

        const logoutPromise = fetch('/api/auth/logout', {
            method: 'POST',
        });

        try {
            const response = await Promise.race([logoutPromise, timeoutPromise]) as Response;

            if (response.ok) {
                // Usar window.location para forzar recarga completa
                window.location.href = '/login';
            } else {
                console.error('Error al cerrar sesión');
                setLoading(false);
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            // En caso de timeout o error, redirigir de todos modos
            window.location.href = '/login';
        }
    };

    const baseClasses = "bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors";
    const sizeClasses = variant === 'navbar'
        ? "py-1.5 px-3 text-sm"
        : variant === 'mobile'
            ? "py-2 px-4 text-base w-full"
            : "py-2 px-6";

    return (
        <button
            onClick={handleLogout}
            disabled={loading}
            className={`${baseClasses} ${sizeClasses}`}
        >
            {loading ? 'Cerrando...' : 'Cerrar sesión'}
        </button>
    );
}
