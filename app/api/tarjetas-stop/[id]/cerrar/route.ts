import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// PATCH - Cerrar una tarjeta stop
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const tarjetaId = parseInt(id);
        const body = await request.json();
        const { comentarioCierre, imagenCierre } = body;

        // Verificar que la tarjeta existe y el usuario es el responsable
        const tarjeta = await prisma.tarjetaStop.findUnique({
            where: { id: tarjetaId },
        });

        if (!tarjeta) {
            return NextResponse.json({ error: 'Tarjeta no encontrada' }, { status: 404 });
        }

        if (tarjeta.responsableCierreId !== session.id) {
            return NextResponse.json(
                { error: 'No eres el responsable de esta tarjeta' },
                { status: 403 }
            );
        }

        // Actualizar la tarjeta
        const tarjetaActualizada = await prisma.tarjetaStop.update({
            where: { id: tarjetaId },
            data: {
                estado: 'CERRADO',
                fechaCierre: new Date(),
                comentarioCierre,
                imagenCierre: imagenCierre || null,
            },
            include: {
                creadoPor: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        rol: true,
                    },
                },
                responsableCierre: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        rol: true,
                    },
                },
            },
        });

        return NextResponse.json(tarjetaActualizada);
    } catch (error) {
        console.error('Error al cerrar tarjeta:', error);
        return NextResponse.json({ error: 'Error al cerrar tarjeta' }, { status: 500 });
    }
}
