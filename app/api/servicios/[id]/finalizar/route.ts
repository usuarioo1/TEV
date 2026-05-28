import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/auth';

const PREGUNTAS_TERMINO = [
    '¿Durante la ejecución se registraron y reportaron incidentes?',
    '¿Queda algún peligro en el área que deba ser reportado?',
    '¿El área se entrega en condiciones de orden y limpieza?',
    'Dejar registro de Guía de Despacho',
];

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getSession();

        // Solo operarios pueden finalizar servicios
        if (!session) {
            return NextResponse.json(
                { message: 'No autorizado' },
                { status: 401 }
            );
        }

        // Validar que solo operarios puedan finalizar servicios
        if (session.rol !== ROLES.OPERARIO) {
            return NextResponse.json(
                { message: 'Solo los operarios pueden finalizar servicios' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const {
            observacionesCierre,
            evaluacionTermino,
            observacionesFinales,
            evidenciasFotograficas,
        } = body;

        const evidenciasNormalizadas = Array.isArray(evidenciasFotograficas)
            ? evidenciasFotograficas
                .filter((item: unknown): item is string => typeof item === 'string')
                .map((url) => url.trim())
                .filter((url) => url.length > 0)
            : [];

        if (evidenciasNormalizadas.length > 3) {
            return NextResponse.json(
                { message: 'Solo se permiten hasta 3 evidencias fotográficas en el cierre' },
                { status: 400 }
            );
        }

        const urlsValidas = evidenciasNormalizadas.every((url) => /^https?:\/\//i.test(url));
        if (!urlsValidas) {
            return NextResponse.json(
                { message: 'Las evidencias fotográficas deben ser URLs válidas' },
                { status: 400 }
            );
        }

        const servicioId = parseInt(id);

        // Verificar que el servicio existe y está en ejecución
        const servicio = await prisma.servicio.findUnique({
            where: { id: servicioId },
            include: {
                operario: true,
                analisisRiesgo: true,
            },
        });

        console.log('=== FINALIZAR SERVICIO ===');
        console.log('Servicio ID:', servicioId);
        console.log('Estado actual:', servicio?.estado);
        console.log('Usuario:', session.username, 'Rol:', session.rol);

        if (!servicio) {
            return NextResponse.json(
                { message: 'Servicio no encontrado' },
                { status: 404 }
            );
        }

        if (servicio.estado !== 'EN_EJECUCION') {
            return NextResponse.json(
                { message: 'El servicio debe estar en ejecución para finalizarlo' },
                { status: 400 }
            );
        }

        // Verificar que el operario que finaliza sea el operario asignado al servicio
        if (servicio.operarioId !== session.id) {
            return NextResponse.json(
                { message: 'Solo el operario asignado puede finalizar este servicio' },
                { status: 403 }
            );
        }

        // Construir bloque de cierre para dejar trazabilidad completa en el servicio.
        const cierreLineas: string[] = ['ETAPA FINAL Y CIERRE - ANALISIS DE RIESGO'];

        if (evaluacionTermino && typeof evaluacionTermino === 'object') {
            cierreLineas.push('Evaluacion de termino:');

            for (let i = 0; i < PREGUNTAS_TERMINO.length; i++) {
                const item = evaluacionTermino[i];
                const respuesta = item?.respuesta || 'SIN RESPUESTA';
                const observacion = item?.observacion?.trim();

                cierreLineas.push(`${i + 1}. ${PREGUNTAS_TERMINO[i]} -> ${respuesta}`);
                if (observacion) {
                    cierreLineas.push(`   Observacion: ${observacion}`);
                }
            }
        }

        if (observacionesFinales && String(observacionesFinales).trim()) {
            cierreLineas.push(`Observaciones finales: ${String(observacionesFinales).trim()}`);
        }

        if (observacionesCierre && String(observacionesCierre).trim()) {
            cierreLineas.push(`Observaciones de cierre: ${String(observacionesCierre).trim()}`);
        }

        if (evidenciasNormalizadas.length > 0) {
            cierreLineas.push('EVIDENCIAS_FOTOGRAFICAS_CIERRE:');
            evidenciasNormalizadas.forEach((url, index) => {
                cierreLineas.push(`- ${index + 1}. ${url}`);
            });
        }

        const bloqueCierre = cierreLineas.join('\n');
        const observacionesActualizadas = [
            servicio.observaciones?.trim(),
            bloqueCierre,
        ]
            .filter((v): v is string => !!v)
            .join('\n\n');

        // Actualizar el estado del servicio a COMPLETADO
        const servicioActualizado = await prisma.servicio.update({
            where: { id: servicioId },
            data: {
                estado: 'COMPLETADO',
                fechaFinalizacion: new Date(),
                observaciones: observacionesActualizadas || null,
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
            },
        });

        console.log('✅ Servicio finalizado exitosamente');
        console.log('Nuevo estado:', servicioActualizado.estado);
        console.log('Fecha de finalización:', servicioActualizado.fechaFinalizacion);

        return NextResponse.json({
            message: 'Servicio finalizado exitosamente',
            servicio: servicioActualizado,
        });
    } catch (error) {
        console.error('Error al finalizar servicio:', error);
        return NextResponse.json(
            {
                message: 'Error interno del servidor',
                error: error instanceof Error ? error.message : 'Error desconocido'
            },
            { status: 500 }
        );
    }
}
