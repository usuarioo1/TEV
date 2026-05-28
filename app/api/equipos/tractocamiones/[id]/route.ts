import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// PATCH - Actualizar un tractocamión existente
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo jefaturas puede editar equipos
    if (session.rol !== ROLES.JEFATURAS) {
        return NextResponse.json({ error: 'No tienes permisos para editar equipos' }, { status: 403 });
    }

    try {
        const { id } = await params;
        const tractocamionId = parseInt(id, 10);

        if (Number.isNaN(tractocamionId)) {
            return NextResponse.json({ error: 'ID de tractocamión inválido' }, { status: 400 });
        }

        const body = await request.json() as {
            patente?: unknown;
            marca?: unknown;
            año?: unknown;
            activo?: unknown;
        };

        if (typeof body.patente !== 'string' || typeof body.marca !== 'string' || body.año === undefined) {
            return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
        }

        if (body.activo !== undefined && typeof body.activo !== 'boolean') {
            return NextResponse.json({ error: 'Estado inválido para activo' }, { status: 400 });
        }

        const patenteFormatted = body.patente.trim().toUpperCase().replace(/\s+/g, '');
        if (patenteFormatted.length < 5 || patenteFormatted.length > 10) {
            return NextResponse.json({ error: 'Patente inválida' }, { status: 400 });
        }

        const marcaFormatted = body.marca.trim();
        if (!marcaFormatted) {
            return NextResponse.json({ error: 'La marca es requerida' }, { status: 400 });
        }

        const añoNum = parseInt(String(body.año), 10);
        const currentYear = new Date().getFullYear();
        if (Number.isNaN(añoNum) || añoNum < 1980 || añoNum > currentYear + 1) {
            return NextResponse.json({ error: 'Año inválido' }, { status: 400 });
        }

        const existente = await prisma.tractoCamion.findUnique({
            where: { id: tractocamionId },
        });

        if (!existente) {
            return NextResponse.json({ error: 'Tractocamión no encontrado' }, { status: 404 });
        }

        const patenteEnUso = await prisma.tractoCamion.findUnique({
            where: { patente: patenteFormatted },
        });

        if (patenteEnUso && patenteEnUso.id !== tractocamionId) {
            return NextResponse.json({ error: 'Ya existe un tractocamión con esta patente' }, { status: 400 });
        }

        const tractocamion = await prisma.tractoCamion.update({
            where: { id: tractocamionId },
            data: {
                patente: patenteFormatted,
                marca: marcaFormatted,
                año: añoNum,
                activo: typeof body.activo === 'boolean' ? body.activo : existente.activo,
            },
        });

        return NextResponse.json(tractocamion);
    } catch (error) {
        console.error('Error al actualizar tractocamión:', error);
        return NextResponse.json({ error: 'Error al actualizar tractocamión' }, { status: 500 });
    }
}