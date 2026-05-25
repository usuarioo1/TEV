import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// PATCH - Cerrar un reporte de peligro
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
        const { comentarioCierre, imagenCierre, responsableVerificacionId } = body;

        // Verificar que el reporte existe y el usuario es el responsable
        const reporte = await prisma.reportePeligro.findUnique({
            where: { id: reporteId },
        });

        if (!reporte) {
            return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 });
        }

        if (reporte.responsableCierreId !== session.id) {
            return NextResponse.json(
                { error: 'No eres el responsable de este reporte' },
                { status: 403 }
            );
        }

        // Verificar que se proporcionó un responsable de verificación
        if (!responsableVerificacionId) {
            return NextResponse.json(
                { error: 'Debes asignar un responsable de verificación' },
                { status: 400 }
            );
        }

        // Actualizar el reporte - cambia a PENDIENTE_VERIFICACION en lugar de CERRADO
        const reporteActualizado = await prisma.reportePeligro.update({
            where: { id: reporteId },
            data: {
                estado: 'PENDIENTE_VERIFICACION',  // Nuevo estado
                fechaCierre: new Date(),
                comentarioCierre,
                imagenCierre: imagenCierre || null,
                responsableVerificacionId: parseInt(responsableVerificacionId),  // Asignar responsable de verificación
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
            },
        });

        return NextResponse.json(reporteActualizado);
    } catch (error) {
        console.error('Error al cerrar reporte:', error);
        return NextResponse.json({ error: 'Error al cerrar reporte' }, { status: 500 });
    }
}
