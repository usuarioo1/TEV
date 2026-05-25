import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// PATCH - Devolver un reporte de peligro de PENDIENTE_VERIFICACION a PENDIENTE (pendiente de cierre)
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
        const { motivoDevolucion } = body;

        if (!motivoDevolucion || !motivoDevolucion.trim()) {
            return NextResponse.json(
                { error: 'Debe indicar el motivo de la devolución' },
                { status: 400 }
            );
        }

        const reporte = await prisma.reportePeligro.findUnique({
            where: { id: reporteId },
            include: {
                responsableCierre: {
                    select: { id: true, name: true, username: true },
                },
                responsableVerificacion: {
                    select: { id: true, name: true, username: true },
                },
            },
        });

        if (!reporte) {
            return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 });
        }

        if (reporte.estado !== 'PENDIENTE_VERIFICACION') {
            return NextResponse.json(
                { error: 'El reporte no está en estado de verificación' },
                { status: 400 }
            );
        }

        if (reporte.responsableVerificacionId !== session.id) {
            return NextResponse.json(
                { error: 'No eres el responsable de verificar este reporte' },
                { status: 403 }
            );
        }

        // Agregar entrada al historial de devoluciones en datos JSON
        const datosActuales = (reporte.datos as any) || {};
        const historialDevoluciones: any[] = datosActuales.historialDevoluciones || [];

        historialDevoluciones.push({
            fecha: new Date().toISOString(),
            motivo: motivoDevolucion.trim(),
            devueltoPorId: session.id,
            devueltoPorNombre: (session as any).name || (session as any).username,
            cierreAnterior: {
                fecha: reporte.fechaCierre?.toISOString() || null,
                comentario: reporte.comentarioCierre || null,
                imagen: reporte.imagenCierre || null,
                responsableId: reporte.responsableCierreId,
                responsableNombre:
                    reporte.responsableCierre?.name ||
                    reporte.responsableCierre?.username ||
                    null,
            },
        });

        const reporteActualizado = await prisma.reportePeligro.update({
            where: { id: reporteId },
            data: {
                estado: 'PENDIENTE',
                // Limpiar campos de cierre para que el responsable vuelva a cerrar
                fechaCierre: null,
                comentarioCierre: null,
                imagenCierre: null,
                // Limpiar campos de verificación y responsable
                responsableVerificacionId: null,
                fechaVerificacion: null,
                comentarioVerificacion: null,
                imagenVerificacion: null,
                // Guardar historial en datos
                datos: {
                    ...datosActuales,
                    historialDevoluciones,
                },
            },
        });

        return NextResponse.json(reporteActualizado);
    } catch (error) {
        console.error('Error al devolver reporte:', error);
        return NextResponse.json({ error: 'Error al devolver reporte' }, { status: 500 });
    }
}
