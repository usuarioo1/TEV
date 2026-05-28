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

        // Solo supervisores y jefaturas pueden rechazar
        if (!session) {
            return NextResponse.json(
                { message: 'No autorizado' },
                { status: 401 }
            );
        }

        const allowedRoles: typeof session.rol[] = [ROLES.SUPERVISOR, ROLES.JEFATURAS];
        if (!allowedRoles.includes(session.rol)) {
            return NextResponse.json(
                { message: 'No autorizado' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { observaciones } = body;

        const servicioId = parseInt(id);

        // Validar que se proporcionen observaciones
        if (!observaciones || !observaciones.trim()) {
            return NextResponse.json(
                { message: 'Debes proporcionar un motivo para el rechazo' },
                { status: 400 }
            );
        }

        // Verificar que el servicio existe y está pendiente de aprobación
        const servicio = await prisma.servicio.findUnique({
            where: { id: servicioId },
            include: {
                aprobacion: true,
                analisisRiesgo: {
                    select: {
                        supervisorResponsableId: true,
                    },
                },
            },
        });

        console.log('=== RECHAZAR SERVICIO ===');
        console.log('Servicio ID:', servicioId);
        console.log('Estado actual:', servicio?.estado);
        console.log('Supervisor:', session.username, 'ID:', session.id);
        console.log('Motivo:', observaciones);

        if (!servicio) {
            return NextResponse.json(
                { message: 'Servicio no encontrado' },
                { status: 404 }
            );
        }

        if (servicio.estado !== 'PENDIENTE_APROBACION') {
            return NextResponse.json(
                { message: 'El servicio no está pendiente de aprobación' },
                { status: 400 }
            );
        }

        if (
            session.rol === ROLES.SUPERVISOR
            && servicio.analisisRiesgo?.supervisorResponsableId !== session.id
        ) {
            return NextResponse.json(
                { message: 'Este servicio no está asignado a tu supervisión' },
                { status: 403 }
            );
        }

        // Verificar que el servicio tenga los checklists
        const servicioCompleto = await prisma.servicio.findUnique({
            where: { id: servicioId },
            include: {
                checklistEquipo: true,
                checklistTractoCamion: true,
                checklistFatiga: true,
                analisisRiesgo: true,
            },
        });

        if (!servicioCompleto) {
            return NextResponse.json(
                { message: 'Servicio no encontrado' },
                { status: 404 }
            );
        }

        // Extraer el estado de los checklists
        const checklistEquipoOk = servicioCompleto.checklistEquipo?.equipoEnCondiciones ?? false;
        const checklistTractoCamionOk = servicioCompleto.checklistTractoCamion?.equipoEnCondiciones ?? false;
        const checklistFatigaOk = servicioCompleto.checklistFatiga?.aptoParaTrabajar ?? false;
        const analisisRiesgoOk = servicioCompleto.analisisRiesgo?.riesgosControlados ?? false;

        // Generar firma digital (timestamp + supervisor + servicio)
        const fechaAprobacion = new Date();
        const firmaDigital = `${session.id}-${servicioId}-${fechaAprobacion.getTime()}`;

        console.log('Validaciones de checklists al rechazar:');
        console.log('  - Equipo OK:', checklistEquipoOk);
        console.log('  - Tracto Camión OK:', checklistTractoCamionOk);
        console.log('  - Fatiga OK:', checklistFatigaOk);
        console.log('  - Riesgo OK:', analisisRiesgoOk);

        // Crear o actualizar el registro de aprobación (como rechazado)
        const aprobacion = await prisma.aprobacionSupervisor.upsert({
            where: { servicioId: servicioId },
            update: {
                aprobado: false,
                supervisorId: session.id,
                fechaAprobacion: fechaAprobacion,
                observaciones: null,
                motivoRechazo: observaciones.trim(),
                checklistEquipoOk,
                checklistTractoCamionOk,
                checklistFatigaOk,
                analisisRiesgoOk,
                firmaDigital,
            },
            create: {
                servicioId: servicioId,
                aprobado: false,
                supervisorId: session.id,
                fechaAprobacion: fechaAprobacion,
                observaciones: null,
                motivoRechazo: observaciones.trim(),
                checklistEquipoOk,
                checklistTractoCamionOk,
                checklistFatigaOk,
                analisisRiesgoOk,
                firmaDigital,
            },
        });

        // Actualizar el estado del servicio a RECHAZADO
        const servicioActualizado = await prisma.servicio.update({
            where: { id: servicioId },
            data: {
                estado: 'RECHAZADO',
                fechaRechazo: new Date(),
            },
            include: {
                operario: {
                    select: {
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
            },
        });

        console.log('✅ Servicio rechazado exitosamente');
        console.log('Nuevo estado:', servicioActualizado.estado);

        return NextResponse.json({
            message: 'Servicio rechazado exitosamente',
            servicio: servicioActualizado,
            aprobacion,
        });
    } catch (error) {
        console.error('Error al rechazar servicio:', error);
        return NextResponse.json(
            {
                message: 'Error interno del servidor',
                error: error instanceof Error ? error.message : 'Error desconocido'
            },
            { status: 500 }
        );
    }
}
