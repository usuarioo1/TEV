import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/auth';
import { isChecklistItemCritico } from '@/lib/checklist-critical-items';
import { sendServicioPendienteAprobacionSupervisorEmail } from '@/lib/resend';

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
        let body: { supervisorResponsableId?: unknown } = {};
        try {
            body = await request.json() as { supervisorResponsableId?: unknown };
        } catch {
            body = {};
        }
        const supervisorResponsableId = Number(body.supervisorResponsableId);

        if (!Number.isInteger(supervisorResponsableId) || supervisorResponsableId <= 0) {
            return NextResponse.json(
                { message: 'Debes seleccionar un supervisor válido para enviar la aprobación' },
                { status: 400 }
            );
        }

        // Verificar que el servicio existe y está asignado al operario
        const servicio = await prisma.servicio.findUnique({
            where: { id: servicioId },
            include: {
                checklistEquipo: true,
                checklistFatiga: true,
                analisisRiesgo: true,
                operario: {
                    select: {
                        name: true,
                        username: true,
                    },
                },
                coordinador: {
                    select: {
                        name: true,
                        username: true,
                    },
                },
            },
        });

        const supervisor = await prisma.user.findUnique({
            where: { id: supervisorResponsableId },
            select: {
                id: true,
                rol: true,
                email: true,
                name: true,
                username: true,
            },
        });

        if (!supervisor || supervisor.rol !== ROLES.SUPERVISOR) {
            return NextResponse.json(
                { message: 'El supervisor seleccionado no es válido' },
                { status: 400 }
            );
        }

        console.log('=== ENVIAR A APROBACIÓN DEBUG ===');
        console.log('Servicio ID:', servicioId);
        console.log('Estado del servicio:', servicio?.estado);
        console.log('Checklist Equipo completado:', servicio?.checklistEquipo?.completado);
        console.log('Checklist Fatiga completado:', servicio?.checklistFatiga?.completado);
        console.log('Análisis Riesgo completado:', servicio?.analisisRiesgo?.completado);
        console.log('Equipo en condiciones:', servicio?.checklistEquipo?.equipoEnCondiciones);
        console.log('Apto para trabajar:', servicio?.checklistFatiga?.aptoParaTrabajar);
        console.log('Riesgos controlados:', servicio?.analisisRiesgo?.riesgosControlados);

        if (!servicio) {
            return NextResponse.json(
                { message: 'Servicio no encontrado' },
                { status: 404 }
            );
        }

        if (servicio.operarioId !== session.id) {
            return NextResponse.json(
                { message: 'No tienes permiso para modificar este servicio' },
                { status: 403 }
            );
        }

        if (servicio.estado !== 'EN_CHECKLIST') {
            console.log('❌ Error: Estado incorrecto. Estado actual:', servicio.estado);
            return NextResponse.json(
                { message: `El servicio no está en el estado correcto para enviar a aprobación. Estado actual: ${servicio.estado}` },
                { status: 400 }
            );
        }

        // Verificar que todos los checklists estén completos
        if (!servicio.checklistEquipo?.completado) {
            console.log('❌ Error: Checklist de Equipo no completado');
            return NextResponse.json(
                { message: 'Debes completar el Checklist de Equipo' },
                { status: 400 }
            );
        }

        if (!servicio.checklistFatiga?.completado) {
            console.log('❌ Error: Checklist de Fatiga no completado');
            return NextResponse.json(
                { message: 'Debes completar el Checklist de Fatiga' },
                { status: 400 }
            );
        }

        if (!servicio.analisisRiesgo?.completado) {
            console.log('❌ Error: Análisis de Riesgo no completado');
            return NextResponse.json(
                { message: 'Debes completar el Análisis de Riesgo' },
                { status: 400 }
            );
        }

        const noConformidadesAbiertas = await prisma.noConformidad.findMany({
            where: {
                servicioId,
                estado: 'ABIERTA',
                checklistTipo: {
                    in: ['TRACTO_CAMION', 'SEMIREMOLQUE'],
                },
            },
            select: {
                checklistTipo: true,
                itemNombre: true,
            },
        });

        const noConformidadesCriticasAbiertas = noConformidadesAbiertas.filter((nc) =>
            isChecklistItemCritico(nc.checklistTipo, nc.itemNombre)
        );

        if (noConformidadesCriticasAbiertas.length > 0) {
            return NextResponse.json(
                {
                    message: 'No puedes enviar a aprobación: hay no conformidades críticas abiertas en checklist de tracto camión o semirremolque.',
                    requiresResend: true,
                    noConformidadesCriticasAbiertas: noConformidadesCriticasAbiertas.length,
                },
                { status: 409 }
            );
        }

        console.log('✅ Todos los checklists están completados.');
        console.log('📋 Resumen de validaciones:');
        console.log('   - Equipo en condiciones:', servicio.checklistEquipo.equipoEnCondiciones);
        console.log('   - Apto para trabajar:', servicio.checklistFatiga.aptoParaTrabajar);
        console.log('   - Riesgos controlados:', servicio.analisisRiesgo.riesgosControlados);
        console.log('✅ Enviando a aprobación del supervisor...');

        const fechaEnvioAprobacion = new Date();

        const [, servicioActualizado] = await prisma.$transaction([
            prisma.analisisRiesgo.update({
                where: { servicioId },
                data: {
                    supervisorResponsableId,
                    fechaAprobacion: fechaEnvioAprobacion,
                },
            }),
            prisma.servicio.update({
                where: { id: servicioId },
                data: {
                    estado: 'PENDIENTE_APROBACION',
                },
            }),
        ]);

        if (supervisor.email?.trim()) {
            try {
                await sendServicioPendienteAprobacionSupervisorEmail({
                    to: supervisor.email,
                    supervisorNombre: supervisor.name || supervisor.username,
                    codigo: servicio.codigo,
                    descripcion: servicio.descripcion,
                    origen: servicio.origen,
                    destino: servicio.destino,
                    operarioNombre: servicio.operario?.name || servicio.operario?.username || null,
                    coordinadorNombre: servicio.coordinador?.name || servicio.coordinador?.username || null,
                    fechaEnvioAprobacion,
                });

                console.log('Correo de servicio pendiente de aprobación enviado a:', supervisor.email);
            } catch (emailError) {
                console.error('No se pudo enviar correo de servicio pendiente de aprobación:', emailError);
            }
        } else {
            console.warn(`Supervisor ${supervisor.id} no tiene email. Se omite notificación.`);
        }

        return NextResponse.json({
            message: 'Servicio enviado a aprobación exitosamente',
            servicio: servicioActualizado,
        });
    } catch (error) {
        console.error('Error al enviar a aprobación:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
