import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// PATCH - Verificar un reporte de peligro (último paso antes del cierre completo)
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
        const reporteId = parseInt(id);
        const body = await request.json();
        const { comentarioVerificacion, imagenVerificacion } = body;

        // Verificar que el reporte existe y el usuario es el responsable de verificación
        const reporte = await prisma.reportePeligro.findUnique({
            where: { id: reporteId },
        });

        if (!reporte) {
            return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 });
        }

        // Verificar que el reporte está en estado PENDIENTE_VERIFICACION
        if (reporte.estado !== 'PENDIENTE_VERIFICACION') {
            return NextResponse.json(
                { error: 'Este reporte no está pendiente de verificación' },
                { status: 400 }
            );
        }

        // Verificar que el usuario es el responsable de verificación
        if (reporte.responsableVerificacionId !== session.id) {
            return NextResponse.json(
                { error: 'No eres el responsable de verificar este reporte' },
                { status: 403 }
            );
        }

        // Actualizar el reporte a estado CERRADO completamente
        const reporteActualizado = await prisma.reportePeligro.update({
            where: { id: reporteId },
            data: {
                estado: 'CERRADO',
                fechaVerificacion: new Date(),
                comentarioVerificacion,
                imagenVerificacion,
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
                responsableVerificacion: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        rol: true,
                    },
                },
                caminata: {
                    select: {
                        id: true,
                        codigo: true,
                        zona: true,
                    },
                },
            },
        });

        return NextResponse.json(reporteActualizado);
    } catch (error) {
        console.error('Error al verificar reporte:', error);
        return NextResponse.json({ error: 'Error al verificar reporte' }, { status: 500 });
    }
}
