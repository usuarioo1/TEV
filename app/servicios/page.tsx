import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { requireRole } from '@/lib/permissions';
import { ROLES } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { EstadoServicio } from '@/app/generated/prisma/enums';
import ServicioCard from '@/components/servicios/ServicioCard';
import Link from 'next/link';
import { isChecklistItemCritico } from '@/lib/checklist-critical-items';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

export default async function ServiciosOperarioPage() {
    // Verificar que el usuario tenga acceso al módulo de servicios
    await requireRole([ROLES.OPERARIO, ROLES.SUPERVISOR, ROLES.COORDINADOR, ROLES.JEFATURAS]);

    const session = await getSession();
    if (!session) redirect('/login');

    console.log('=== DEBUG SERVICIOS PAGE ===');
    console.log('Usuario:', session.username, 'ID:', session.id, 'Rol:', session.rol);

    // Determinar qué servicios mostrar según el rol
    const whereClause = session.rol === ROLES.OPERARIO
        ? {
            // Operarios ven solo sus servicios asignados
            operarioId: session.id,
            estado: {
                notIn: ['COMPLETADO', 'CANCELADO', 'RECHAZADO'] as EstadoServicio[],
            },
        }
        : {
            // Supervisores y superiores ven los servicios que coordinan
            coordinadorId: session.id,
            estado: {
                notIn: ['COMPLETADO', 'CANCELADO', 'RECHAZADO'] as EstadoServicio[],
            },
        };

    console.log('Where clause:', JSON.stringify(whereClause, null, 2));

    // Obtener servicios según el rol
    const servicios = await prisma.servicio.findMany({
        where: whereClause,
        include: {
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
            checklistEquipo: true,
            checklistTractoCamion: true,
            checklistFatiga: true,
            analisisRiesgo: true,
            noConformidades: {
                where: {
                    estado: 'ABIERTA',
                    checklistTipo: {
                        in: ['TRACTO_CAMION', 'SEMIREMOLQUE'],
                    },
                },
                select: {
                    checklistTipo: true,
                    itemNombre: true,
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
        orderBy: {
            fechaAsignacion: 'desc',
        },
    });

    console.log('Servicios encontrados:', servicios.length);
    servicios.forEach(s => {
        console.log(`- Servicio ${s.codigo}: operarioId=${s.operarioId}, coordinadorId=${s.coordinadorId}, estado=${s.estado}`);
    });

    const serviciosConEstadoVisual = servicios.map((servicio) => {
        const tieneNcCriticaAbierta =
            servicio.estado === 'EN_CHECKLIST'
            && servicio.noConformidades.some((nc) =>
                isChecklistItemCritico(nc.checklistTipo, nc.itemNombre)
            );

        return {
            ...servicio,
            requiereReenvio: tieneNcCriticaAbierta,
        };
    });

    // Determinar qué servicios completados mostrar según el rol
    const whereClauseCompletados = session.rol === ROLES.OPERARIO
        ? {
            operarioId: session.id,
            estado: {
                in: ['COMPLETADO', 'CANCELADO'] as EstadoServicio[],
            },
        }
        : {
            coordinadorId: session.id,
            estado: {
                in: ['COMPLETADO', 'CANCELADO'] as EstadoServicio[],
            },
        };

    // Servicios completados recientemente
    const serviciosCompletados = await prisma.servicio.findMany({
        where: whereClauseCompletados,
        take: 5,
        orderBy: {
            updatedAt: 'desc',
        },
        include: {
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

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                {session.rol === ROLES.OPERARIO ? 'Mis Servicios' : 'Servicios'}
                            </h1>
                            <p className="mt-2 text-sm text-gray-600">
                                {session.rol === ROLES.OPERARIO
                                    ? 'Gestiona tus servicios asignados y completa los checklists requeridos'
                                    : 'Gestiona los servicios creados y supervisa su progreso'
                                }
                            </p>
                        </div>
                        {/* Botón para crear servicios (solo coordinadores y jefaturas) */}
                        {(session.rol === ROLES.COORDINADOR ||
                            session.rol === ROLES.JEFATURAS) && (
                                <Link
                                    href="/servicios/nuevo"
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Crear Servicio
                                </Link>
                            )}
                    </div>
                </div>

                {/* Estadísticas rápidas */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-1">
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Servicios Activos
                                    </dt>
                                    <dd className="mt-1 text-3xl font-semibold text-gray-900">
                                        {serviciosConEstadoVisual.length}
                                    </dd>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-1">
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Pendientes de Acción
                                    </dt>
                                    <dd className="mt-1 text-3xl font-semibold text-blue-600">
                                        {serviciosConEstadoVisual.filter((s) => ['ASIGNADO', 'ACEPTADO', 'EN_CHECKLIST'].includes(s.estado)).length}
                                    </dd>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-1">
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Completados (Total)
                                    </dt>
                                    <dd className="mt-1 text-3xl font-semibold text-green-600">
                                        {serviciosCompletados.length}
                                    </dd>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Servicios Activos */}
                {serviciosConEstadoVisual.length > 0 ? (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Servicios Activos
                        </h2>
                        <div className="grid grid-cols-1 gap-6">
                            {serviciosConEstadoVisual.map((servicio) => (
                                <ServicioCard key={servicio.id} servicio={servicio} />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white shadow rounded-lg p-12 text-center">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                            No hay servicios asignados
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Cuando se te asigne un servicio, aparecerá aquí.
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}
