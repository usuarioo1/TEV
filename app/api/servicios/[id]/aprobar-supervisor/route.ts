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

        // Solo supervisores y jefaturas pueden aprobar
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

        // Verificar que el servicio existe y está pendiente de aprobación
        const servicio = await prisma.servicio.findUnique({
            where: { id: servicioId },
            include: {
                checklistEquipo: true,
                checklistTractoCamion: true,
                checklistFatiga: true,
                analisisRiesgo: true,
                aprobacion: true,
            },
        });

        console.log('=== APROBAR SERVICIO ===');
        console.log('Servicio ID:', servicioId);
        console.log('Estado actual:', servicio?.estado);
        console.log('Supervisor:', session.username, 'ID:', session.id);

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

        // Verificar que todos los checklists estén completos
        if (!servicio.checklistEquipo?.completado ||
            !servicio.checklistTractoCamion?.completado ||
            !servicio.checklistFatiga?.completado ||
            !servicio.analisisRiesgo?.completado) {
            return NextResponse.json(
                { message: 'No se pueden aprobar servicios con checklists incompletos' },
                { status: 400 }
            );
        }

        // Extraer el estado de los checklists
        const checklistEquipoOk = servicio.checklistEquipo.equipoEnCondiciones;
        const checklistTractoCamionOk = servicio.checklistTractoCamion.equipoEnCondiciones;
        const checklistFatigaOk = servicio.checklistFatiga.aptoParaTrabajar;
        const analisisRiesgoOk = servicio.analisisRiesgo.riesgosControlados;

        // Generar firma digital (timestamp + supervisor + servicio)
        const fechaAprobacion = new Date();
        const firmaDigital = `${session.id}-${servicioId}-${fechaAprobacion.getTime()}`;

        console.log('Validaciones de checklists:');
        console.log('  - Equipo OK:', checklistEquipoOk);
        console.log('  - Tracto Camión OK:', checklistTractoCamionOk);
        console.log('  - Fatiga OK:', checklistFatigaOk);
        console.log('  - Riesgo OK:', analisisRiesgoOk);

        // Crear o actualizar el registro de aprobación
        const aprobacion = await prisma.aprobacionSupervisor.upsert({
            where: { servicioId: servicioId },
            update: {
                aprobado: true,
                supervisorId: session.id,
                fechaAprobacion: fechaAprobacion,
                observaciones: observaciones || null,
                checklistEquipoOk,
                checklistTractoCamionOk,
                checklistFatigaOk,
                analisisRiesgoOk,
                firmaDigital,
                motivoRechazo: null,
            },
            create: {
                servicioId: servicioId,
                aprobado: true,
                supervisorId: session.id,
                fechaAprobacion: fechaAprobacion,
                observaciones: observaciones || null,
                checklistEquipoOk,
                checklistTractoCamionOk,
                checklistFatigaOk,
                analisisRiesgoOk,
                firmaDigital,
            },
        });

        // Actualizar el estado del servicio a APROBADO
        const servicioActualizado = await prisma.servicio.update({
            where: { id: servicioId },
            data: {
                estado: 'APROBADO',
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

        console.log('✅ Servicio aprobado exitosamente');
        console.log('Nuevo estado:', servicioActualizado.estado);

        return NextResponse.json({
            message: 'Servicio aprobado exitosamente',
            servicio: servicioActualizado,
            aprobacion,
        });
    } catch (error) {
        console.error('Error al aprobar servicio:', error);
        return NextResponse.json(
            {
                message: 'Error interno del servidor',
                error: error instanceof Error ? error.message : 'Error desconocido'
            },
            { status: 500 }
        );
    }
}
