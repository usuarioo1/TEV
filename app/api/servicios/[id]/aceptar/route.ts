import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/auth';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getSession();

        if (!session || session.rol !== ROLES.OPERARIO) {
            return NextResponse.json(
                { message: 'No autorizado' },
                { status: 401 }
            );
        }

        const servicioId = parseInt(id);

        // Verificar que el servicio existe y está asignado al operario
        const servicio = await prisma.servicio.findUnique({
            where: { id: servicioId },
        });

        if (!servicio) {
            return NextResponse.json(
                { message: 'Servicio no encontrado' },
                { status: 404 }
            );
        }

        if (servicio.operarioId !== session.id) {
            return NextResponse.json(
                { message: 'No tienes permiso para aceptar este servicio' },
                { status: 403 }
            );
        }

        if (servicio.estado !== 'ASIGNADO') {
            return NextResponse.json(
                { message: 'El servicio no está en estado ASIGNADO' },
                { status: 400 }
            );
        }

        // Actualizar el servicio a estado ACEPTADO
        const servicioActualizado = await prisma.servicio.update({
            where: { id: servicioId },
            data: {
                estado: 'ACEPTADO',
                fechaAceptacion: new Date(),
            },
        });

        return NextResponse.json({
            message: 'Servicio aceptado exitosamente',
            servicio: servicioActualizado,
        });
    } catch (error) {
        console.error('Error al aceptar servicio:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
