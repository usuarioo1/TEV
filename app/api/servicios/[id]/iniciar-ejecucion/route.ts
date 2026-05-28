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

        // Solo operarios pueden iniciar ejecución
        if (!session) {
            return NextResponse.json(
                { message: 'No autorizado' },
                { status: 401 }
            );
        }

        // Validar que solo operarios puedan iniciar ejecución
        if (session.rol !== ROLES.OPERARIO) {
            return NextResponse.json(
                { message: 'Solo los operarios pueden iniciar la ejecución de servicios' },
                { status: 403 }
            );
        }

        const servicioId = parseInt(id);

        // Verificar que el servicio existe y está aprobado
        const servicio = await prisma.servicio.findUnique({
            where: { id: servicioId },
            include: {
                aprobacion: true,
                operario: true,
            },
        });

        console.log('=== INICIAR EJECUCIÓN DE SERVICIO ===');
        console.log('Servicio ID:', servicioId);
        console.log('Estado actual:', servicio?.estado);
        console.log('Usuario:', session.username, 'Rol:', session.rol);

        if (!servicio) {
            return NextResponse.json(
                { message: 'Servicio no encontrado' },
                { status: 404 }
            );
        }

        if (servicio.estado !== 'APROBADO') {
            return NextResponse.json(
                { message: 'El servicio debe estar aprobado para iniciar ejecución' },
                { status: 400 }
            );
        }

        // Verificar que el operario que inicia la ejecución sea el operario asignado
        if (servicio.operarioId !== session.id) {
            return NextResponse.json(
                { message: 'Solo el operario asignado puede iniciar la ejecución de este servicio' },
                { status: 403 }
            );
        }

        // Verificar que el servicio tenga aprobación del supervisor
        if (!servicio.aprobacion || !servicio.aprobacion.aprobado) {
            return NextResponse.json(
                { message: 'El servicio no tiene aprobación del supervisor' },
                { status: 400 }
            );
        }

        // Actualizar el estado del servicio a EN_EJECUCION
        const servicioActualizado = await prisma.servicio.update({
            where: { id: servicioId },
            data: {
                estado: 'EN_EJECUCION',
                fechaInicio: new Date(),
            },
            include: {
                operario: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                    },
                },
                coordinador: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                    },
                },
                aprobacion: {
                    include: {
                        supervisor: {
                            select: {
                                name: true,
                                username: true,
                            },
                        },
                    },
                },
                checklistEquipo: true,
                checklistFatiga: true,
                analisisRiesgo: true,
            },
        });

        console.log('✅ Servicio iniciado en ejecución exitosamente');
        console.log('Nuevo estado:', servicioActualizado.estado);
        console.log('Fecha de inicio:', servicioActualizado.fechaInicio);

        return NextResponse.json({
            message: 'Servicio iniciado en ejecución exitosamente',
            servicio: servicioActualizado,
        });
    } catch (error) {
        console.error('Error al iniciar ejecución del servicio:', error);
        return NextResponse.json(
            {
                message: 'Error interno del servidor',
                error: error instanceof Error ? error.message : 'Error desconocido'
            },
            { status: 500 }
        );
    }
}
