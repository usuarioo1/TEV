import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Obtener lista de usuarios asignables para actividades
export async function GET() {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo prevencionistas pueden obtener esta lista (para asignar caminatas)
    if (session.rol !== ROLES.PREVENCIONISTA) {
        return NextResponse.json({ error: 'No autorizado - Solo prevencionistas pueden asignar actividades' }, { status: 403 });
    }

    try {
        const usuarios = await prisma.user.findMany({
            where: {
                OR: [
                    { rol: ROLES.SUPERVISOR },
                    { rol: ROLES.COORDINADOR },
                    { rol: ROLES.JEFATURAS },
                    { rol: ROLES.PREVENCIONISTA },
                ],
            },
            select: {
                id: true,
                username: true,
                name: true,
                rol: true,
                email: true,
            },
            orderBy: [
                { rol: 'asc' },
                { name: 'asc' },
            ],
        });

        return NextResponse.json(usuarios);
    } catch (error) {
        console.error('Error al obtener usuarios asignables:', error);
        return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
    }
}
