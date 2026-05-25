import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Obtener lista de usuarios
export async function GET(request: Request) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        // Obtener parámetros de query
        const { searchParams } = new URL(request.url);
        const rol = searchParams.get('rol');

        // Construir filtros
        const where: any = {};
        if (rol) {
            where.rol = rol;
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                username: true,
                rol: true,
            },
            orderBy: {
                name: 'asc',
            },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        return NextResponse.json(
            { error: 'Error al obtener usuarios' },
            { status: 500 }
        );
    }
}
