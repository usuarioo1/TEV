import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST - Crear tarjeta alto/stop
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const caminataId = parseInt(id);
        const body = await request.json();

        // Verificar que la caminata existe
        const caminata = await prisma.caminataSeguridad.findUnique({
            where: { id: caminataId },
        });

        if (!caminata) {
            return NextResponse.json({ error: 'Caminata no encontrada' }, { status: 404 });
        }

        // Verificar que el usuario es el asignado
        if (caminata.asignadoId !== session.id) {
            return NextResponse.json(
                { error: 'Solo el asignado puede crear tarjetas stop' },
                { status: 403 }
            );
        }

        // Extraer el responsableCierre del body
        const { responsableCierre, ...datosTarjeta } = body;

        // Crear tarjeta stop
        const tarjeta = await prisma.tarjetaStop.create({
            data: {
                caminataId,
                creadoPorId: session.id,
                datos: datosTarjeta as any, // Guardamos todo el formulario como JSON (sin responsableCierre)
                estado: 'PENDIENTE',
                responsableCierreId: responsableCierre ? parseInt(responsableCierre) : null,
            },
        });

        return NextResponse.json(tarjeta);
    } catch (error) {
        console.error('Error al crear tarjeta stop:', error);
        return NextResponse.json(
            { error: 'Error al crear tarjeta stop' },
            { status: 500 }
        );
    }
}
