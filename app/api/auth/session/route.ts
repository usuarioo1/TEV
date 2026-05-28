import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Devolver información básica de la sesión (sin información sensible)
    return NextResponse.json({
        id: session.id,
        username: session.username,
        rol: session.rol,
        name: session.name,
        email: session.email,
        rut: session.rut,
        empresa: session.empresa,
    });
}
