import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Obtener lista de empresas disponibles
export async function GET() {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const empresas = await prisma.empresa.findMany({
            select: {
                id: true,
                nombre: true,
            },
            orderBy: {
                nombre: 'asc',
            },
        });

        return NextResponse.json(empresas);
    } catch (error) {
        console.error('Error al obtener empresas:', error);
        return NextResponse.json(
            { error: 'Error al obtener empresas' },
            { status: 500 }
        );
    }
}

// POST - Crear una empresa (solo jefaturas)
export async function POST(request: Request) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.rol !== ROLES.JEFATURAS) {
        return NextResponse.json({ error: 'No tienes permisos para crear empresas' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const nombreValue = body?.nombre;
        const nombre = typeof nombreValue === 'string' ? nombreValue.trim() : '';

        if (!nombre) {
            return NextResponse.json({ error: 'El nombre de la empresa es requerido' }, { status: 400 });
        }

        const empresaExistente = await prisma.empresa.findFirst({
            where: {
                nombre: {
                    equals: nombre,
                    mode: 'insensitive',
                },
            },
            select: { id: true },
        });

        if (empresaExistente) {
            return NextResponse.json({ error: 'Ya existe una empresa con ese nombre' }, { status: 400 });
        }

        const empresa = await prisma.empresa.create({
            data: {
                nombre,
            },
            select: {
                id: true,
                nombre: true,
                createdAt: true,
            },
        });

        return NextResponse.json(empresa, { status: 201 });
    } catch (error) {
        console.error('Error al crear empresa:', error);
        return NextResponse.json(
            { error: 'Error al crear empresa' },
            { status: 500 }
        );
    }
}
