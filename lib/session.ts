import { cookies } from 'next/headers';
import { verifyToken, UserPayload } from './auth';

const COOKIE_NAME = 'auth_token';

/**
 * Obtiene la sesión del usuario actual desde las cookies
 */
export async function getSession(): Promise<UserPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
        return null;
    }

    return verifyToken(token);
}

/**
 * Crea una sesión para el usuario
 */
export async function createSession(token: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 días
        path: '/',
    });
}

/**
 * Elimina la sesión del usuario
 */
export async function deleteSession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}
