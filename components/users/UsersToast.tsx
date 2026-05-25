'use client';

import { useEffect, useState } from 'react';

interface UsersToastProps {
    message: string;
    type?: 'success' | 'error';
}

export default function UsersToast({ message, type = 'success' }: UsersToastProps) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setVisible(false);
        }, 3500);

        return () => {
            window.clearTimeout(timer);
        };
    }, []);

    if (!visible) {
        return null;
    }

    const styles = type === 'success'
        ? 'bg-green-50 border-green-200 text-green-800'
        : 'bg-red-50 border-red-200 text-red-800';

    return (
        <div
            role="status"
            aria-live="polite"
            className={`fixed top-4 right-4 z-50 w-full max-w-sm rounded-lg border shadow-lg ${styles}`}
        >
            <div className="flex items-start p-4">
                <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    {type === 'success' ? (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    ) : (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-4a1 1 0 112 0 1 1 0 01-2 0zm.293-7.707a1 1 0 011.414 0l.01.01a1 1 0 01.283.697l-.5 5a1 1 0 01-1.99 0l-.5-5a1 1 0 01.283-.707l.01-.01z" clipRule="evenodd" />
                    )}
                </svg>
                <p className="ml-3 text-sm font-medium">{message}</p>
            </div>
        </div>
    );
}