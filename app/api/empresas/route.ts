import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Obtener lista única de empresas
export async function GET() {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        // Obtener todos los usuarios con empresa
        const usuarios = await prisma.user.findMany({
            where: {
                empresa: {
                    not: null
                }
            },
            select: {
                empresa: true
            },
            distinct: ['empresa']
        });

        // Extraer y filtrar empresas únicas
        const empresas = usuarios
            .map(u => u.empresa)
            .filter((empresa): empresa is string => empresa !== null)
            .sort();

        return NextResponse.json(empresas);
    } catch (error) {
        console.error('Error al obtener empresas:', error);
        return NextResponse.json(
            { error: 'Error al obtener empresas' },
            { status: 500 }
        );
    }
}
