import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/session';

export async function POST() {
    try {
        await deleteSession();
        return NextResponse.json({ message: 'Sesión cerrada exitosamente' });
    } catch (error) {
        console.error('Error en logout:', error);
        return NextResponse.json(
            { error: 'Error al cerrar sesión' },
            { status: 500 }
        );
    }
}
