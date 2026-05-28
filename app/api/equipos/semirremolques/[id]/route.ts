import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const TIPOS_VALIDOS = new Set([
    'rampa_plana',
    'drop_deck',
    'lowboy',
    'portacontenedor',
    'tolva',
    'refrigerado',
    'palote',
    'neumatiquera',
    'otro',
]);

// PATCH - Actualizar un semirremolque existente
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
        const semiremolqueId = parseInt(id, 10);

        if (Number.isNaN(semiremolqueId)) {
            return NextResponse.json({ error: 'ID de semirremolque inválido' }, { status: 400 });
        }

        const body = await request.json() as {
            patente?: unknown;
            tipo?: unknown;
            marca?: unknown;
            año?: unknown;
            activo?: unknown;
        };

        if (
            typeof body.patente !== 'string' ||
            typeof body.tipo !== 'string' ||
            typeof body.marca !== 'string' ||
            body.año === undefined
        ) {
            return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
        }

        if (body.activo !== undefined && typeof body.activo !== 'boolean') {
            return NextResponse.json({ error: 'Estado inválido para activo' }, { status: 400 });
        }

        const patenteFormatted = body.patente.trim().toUpperCase().replace(/\s+/g, '');
        if (patenteFormatted.length < 5 || patenteFormatted.length > 10) {
            return NextResponse.json({ error: 'Patente inválida' }, { status: 400 });
        }

        const tipoFormatted = body.tipo.trim();
        if (!TIPOS_VALIDOS.has(tipoFormatted)) {
            return NextResponse.json({ error: 'Tipo de semirremolque inválido' }, { status: 400 });
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

        const existente = await prisma.semiremolque.findUnique({
            where: { id: semiremolqueId },
        });

        if (!existente) {
            return NextResponse.json({ error: 'Semirremolque no encontrado' }, { status: 404 });
        }

        const patenteEnUso = await prisma.semiremolque.findUnique({
            where: { patente: patenteFormatted },
        });

        if (patenteEnUso && patenteEnUso.id !== semiremolqueId) {
            return NextResponse.json({ error: 'Ya existe un semirremolque con esta patente' }, { status: 400 });
        }

        const semiremolque = await prisma.semiremolque.update({
            where: { id: semiremolqueId },
            data: {
                patente: patenteFormatted,
                tipo: tipoFormatted,
                marca: marcaFormatted,
                año: añoNum,
                activo: typeof body.activo === 'boolean' ? body.activo : existente.activo,
            },
        });

        return NextResponse.json(semiremolque);
    } catch (error) {
        console.error('Error al actualizar semirremolque:', error);
        return NextResponse.json({ error: 'Error al actualizar semirremolque' }, { status: 500 });
    }
}