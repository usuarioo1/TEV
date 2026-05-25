import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { requireRole } from '@/lib/permissions';
import { ROLES } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { ESTADO_LABELS, ESTADO_COLORS } from '@/lib/servicio-utils';
import CrearServicioButton from '@/components/servicios/CrearServicioButton';
import { parseSantiagoDate } from '@/lib/date-chile';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

interface SupervisorDashboardPageProps {
    searchParams: Promise<{
        fechaInicio?: string | string[];
        fechaFin?: string | string[];
    }>;
}

function normalizeDateParam(value?: string | string[]): string | undefined {
    const firstValue = Array.isArray(value) ? value[0] : value;
    if (!firstValue || !/^\d{4}-\d{2}-\d{2}$/.test(firstValue)) {
        return undefined;
    }

    return firstValue;
}

export default async function SupervisorDashboardPage({ searchParams }: SupervisorDashboardPageProps) {
    // Solo supervisores y jefaturas pueden acceder
    await requireRole([ROLES.SUPERVISOR, ROLES.JEFATURAS]);

    const session = await getSession();
    if (!session) redirect('/login');

    const params = await searchParams;
    const fechaInicioParam = normalizeDateParam(params.fechaInicio);
    const fechaFinParam = normalizeDateParam(params.fechaFin);
    const fechaInicioDate = fechaInicioParam ? parseSantiagoDate(fechaInicioParam) : null;
    const fechaFinDate = fechaFinParam ? parseSantiagoDate(fechaFinParam, true) : null;
    const hasDateFilter = !!(fechaInicioDate || fechaFinDate);
    const filtroFechaWhere = {
        ...(fechaInicioDate && { gte: fechaInicioDate }),
        ...(fechaFinDate && { lte: fechaFinDate }),
    };

    const supervisorQueryParams = new URLSearchParams();
    if (fechaInicioParam) supervisorQueryParams.set('fechaInicio', fechaInicioParam);
    if (fechaFinParam) supervisorQueryParams.set('fechaFin', fechaFinParam);
    const supervisorBaseHref = supervisorQueryParams.toString()
        ? `/supervisor?${supervisorQueryParams.toString()}`
        : '/supervisor';

    const pendientesWhere = session.rol === ROLES.SUPERVISOR
        ? {
            estado: 'PENDIENTE_APROBACION' as const,
            analisisRiesgo: {
                is: {
                    supervisorResponsableId: session.id,
                },
            },
            ...(hasDateFilter && { fechaAsignacion: filtroFechaWhere }),
        }
        : {
            estado: 'PENDIENTE_APROBACION' as const,
            ...(hasDateFilter && { fechaAsignacion: filtroFechaWhere }),
        };

    // Obtener servicios pendientes de aprobación
    const serviciosPendientes = await prisma.servicio.findMany({
        where: pendientesWhere,
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
            checklistEquipo: true,
            checklistTractoCamion: true,
            checklistFatiga: true,
            analisisRiesgo: true,
        },
        orderBy: {
            updatedAt: 'desc',
        },
    });

    // Servicios aprobados recientemente
    const serviciosAprobados = await prisma.servicio.findMany({
        where: {
            estado: 'APROBADO',
            aprobacion: {
                isNot: null,
            },
            ...(hasDateFilter && { fechaAsignacion: filtroFechaWhere }),
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
        take: 5,
        orderBy: {
            updatedAt: 'desc',
        },
    });

    // Servicios en ejecución
    const serviciosEnEjecucion = await prisma.servicio.findMany({
        where: {
            estado: 'EN_EJECUCION',
            ...(hasDateFilter && { fechaAsignacion: filtroFechaWhere }),
        },
        orderBy: {
            fechaInicio: 'desc',
        },
    });

    // Servicios completados
    const serviciosCompletados = await prisma.servicio.findMany({
        where: {
            estado: 'COMPLETADO',
            ...(hasDateFilter && { fechaAsignacion: filtroFechaWhere }),
        },
        orderBy: {
            fechaFinalizacion: 'desc',
        },
    });

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header con navegación */}
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                        Panel de Aprobaciones
                    </h1>

                    {/* Tabs de navegación - Responsive con scroll horizontal en móvil */}
                    <div className="border-b border-gray-200 -mx-4 sm:mx-0">
                        <nav className="flex overflow-x-auto px-4 sm:px-0 -mb-px space-x-4 sm:space-x-8 scrollbar-hide">
                            <Link
                                href={supervisorBaseHref}
                                className="border-blue-500 text-blue-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm shrink-0"
                            >
                                Pendientes
                            </Link>
                            <Link
                                href="/supervisor/aprobados"
                                className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm shrink-0"
                            >
                                Aprobados
                            </Link>
                            <Link
                                href="/supervisor/en-ejecucion"
                                className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm shrink-0"
                            >
                                En Ejecución
                            </Link>
                            <Link
                                href="/supervisor/completados"
                                className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm shrink-0"
                            >
                                Completados
                            </Link>
                            <Link
                                href="/supervisor/rechazados"
                                className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm shrink-0"
                            >
                                Rechazados
                            </Link>
                        </nav>
                    </div>
                </div>

                <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <form method="GET" className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 text-gray-700">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium text-sm">Filtrar por fecha de asignacion</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-500" htmlFor="supervisor-fecha-inicio">Desde</label>
                            <input
                                id="supervisor-fecha-inicio"
                                name="fechaInicio"
                                type="date"
                                defaultValue={fechaInicioParam || ''}
                                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-500" htmlFor="supervisor-fecha-fin">Hasta</label>
                            <input
                                id="supervisor-fecha-fin"
                                name="fechaFin"
                                type="date"
                                defaultValue={fechaFinParam || ''}
                                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                            />
                        </div>

                        <button
                            type="submit"
                            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Aplicar filtro
                        </button>

                        {(fechaInicioParam || fechaFinParam) && (
                            <Link
                                href="/supervisor"
                                className="px-4 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Limpiar
                            </Link>
                        )}

                        {(fechaInicioParam || fechaFinParam) && (
                            <span className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                {fechaInicioParam && fechaFinParam
                                    ? `${fechaInicioParam} -> ${fechaFinParam}`
                                    : fechaInicioParam
                                        ? `Desde ${fechaInicioParam}`
                                        : `Hasta ${fechaFinParam}`}
                            </span>
                        )}
                    </form>
                </div>

                <CrearServicioButton />
                {/* Estadísticas - Responsive Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
                    <Link
                        href={supervisorBaseHref}
                        className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow cursor-pointer"
                    >
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-1 min-w-0">
                                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                                        Pendientes de Aprobación
                                    </dt>
                                    <dd className="mt-1 text-2xl sm:text-3xl font-semibold text-blue-600">
                                        {serviciosPendientes.length}
                                    </dd>
                                </div>
                                <div className="ml-3 shrink-0">
                                    <svg className="h-10 w-10 sm:h-12 sm:w-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/supervisor/aprobados"
                        className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow cursor-pointer"
                    >
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-1 min-w-0">
                                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                                        Aprobados Recientes
                                    </dt>
                                    <dd className="mt-1 text-2xl sm:text-3xl font-semibold text-green-600">
                                        {serviciosAprobados.length}
                                    </dd>
                                </div>
                                <div className="ml-3 shrink-0">
                                    <svg className="h-10 w-10 sm:h-12 sm:w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/supervisor/en-ejecucion"
                        className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow cursor-pointer"
                    >
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-1 min-w-0">
                                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                                        En Ejecución
                                    </dt>
                                    <dd className="mt-1 text-2xl sm:text-3xl font-semibold text-indigo-600">
                                        {serviciosEnEjecucion.length}
                                    </dd>
                                </div>
                                <div className="ml-3 shrink-0">
                                    <svg className="h-10 w-10 sm:h-12 sm:w-12 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/supervisor/completados"
                        className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow cursor-pointer"
                    >
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-1 min-w-0">
                                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                                        Completados
                                    </dt>
                                    <dd className="mt-1 text-2xl sm:text-3xl font-semibold text-blue-600">
                                        {serviciosCompletados.length}
                                    </dd>
                                </div>
                                <div className="ml-3 shrink-0">
                                    <svg className="h-10 w-10 sm:h-12 sm:w-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </Link>

                </div>

                {/* Servicios Pendientes de Aprobación */}
                <div className="mb-8">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
                        Servicios Pendientes de Aprobación
                    </h2>

                    {serviciosPendientes.length === 0 ? (
                        <div className="bg-white shadow rounded-lg p-8 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay servicios pendientes</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Todos los servicios han sido procesados
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
                            {serviciosPendientes.map((servicio) => {
                                const tieneProblemas = !servicio.checklistEquipo?.equipoEnCondiciones ||
                                    !servicio.checklistTractoCamion?.equipoEnCondiciones ||
                                    !servicio.checklistFatiga?.aptoParaTrabajar ||
                                    !servicio.analisisRiesgo?.riesgosControlados;

                                return (
                                    <div key={servicio.id} className={`bg-white shadow rounded-lg overflow-hidden ${tieneProblemas ? 'border-2 border-red-300' : ''}`}>
                                        <div className="p-4 sm:p-6">
                                            {/* Header */}
                                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 truncate">
                                                        {servicio.codigo}
                                                    </h3>
                                                    <p className="text-xs sm:text-sm text-gray-500">
                                                        Enviado el {new Date(servicio.updatedAt).toLocaleDateString('es-ES', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </p>
                                                </div>
                                                {tieneProblemas && (
                                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 whitespace-nowrap shrink-0">
                                                        ⚠️ Requiere Atención
                                                    </span>
                                                )}
                                            </div>

                                            {/* Ruta */}
                                            <div className="mb-4">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 sm:space-x-2 text-sm">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-gray-500 mb-1 text-xs">Origen</p>
                                                        <p className="font-medium text-gray-900 truncate">{servicio.origen}</p>
                                                    </div>
                                                    <svg className="h-5 w-5 text-gray-400 hidden sm:block shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                    </svg>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-gray-500 mb-1 text-xs">Destino</p>
                                                        <p className="font-medium text-gray-900 truncate">{servicio.destino}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Descripción */}
                                            {servicio.descripcion && (
                                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                                    {servicio.descripcion}
                                                </p>
                                            )}

                                            {/* Validaciones */}
                                            <div className="mb-4 space-y-2 bg-gray-50 rounded-lg p-3">
                                                <div className="flex items-center text-xs">
                                                    <svg className={`h-4 w-4 mr-2 ${servicio.checklistEquipo?.equipoEnCondiciones ? 'text-green-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className={servicio.checklistEquipo?.equipoEnCondiciones ? 'text-gray-700' : 'text-red-700 font-medium'}>
                                                        Semi-remolque {servicio.checklistEquipo?.equipoEnCondiciones ? 'en condiciones' : 'con fallas'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center text-xs">
                                                    <svg className={`h-4 w-4 mr-2 ${servicio.checklistTractoCamion?.equipoEnCondiciones ? 'text-green-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className={servicio.checklistTractoCamion?.equipoEnCondiciones ? 'text-gray-700' : 'text-red-700 font-medium'}>
                                                        TractoCamión {servicio.checklistTractoCamion?.equipoEnCondiciones ? 'en condiciones' : 'con fallas'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center text-xs">
                                                    <svg className={`h-4 w-4 mr-2 ${servicio.checklistFatiga?.aptoParaTrabajar ? 'text-green-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className={servicio.checklistFatiga?.aptoParaTrabajar ? 'text-gray-700' : 'text-red-700 font-medium'}>
                                                        Operario {servicio.checklistFatiga?.aptoParaTrabajar ? 'apto' : 'no apto'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center text-xs">
                                                    <svg className={`h-4 w-4 mr-2 ${servicio.analisisRiesgo?.riesgosControlados ? 'text-green-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className={servicio.analisisRiesgo?.riesgosControlados ? 'text-gray-700' : 'text-red-700 font-medium'}>
                                                        Riesgos {servicio.analisisRiesgo?.riesgosControlados ? 'controlados' : 'no controlados'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Info del Operario y Coordinador */}
                                            <div className="mb-4 pt-4 border-t border-gray-200 space-y-1">
                                                <p className="text-xs text-gray-500">
                                                    Operario: <span className="font-medium text-gray-700">{servicio.operario?.name || servicio.operario?.username}</span>
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Coordinado por: <span className="font-medium text-gray-700">{servicio.coordinador?.name || servicio.coordinador?.username}</span>
                                                </p>
                                            </div>

                                            {/* Botón de Acción */}
                                            <Link
                                                href={`/supervisor/${servicio.id}`}
                                                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                                            >
                                                Revisar y Aprobar
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Aprobaciones Recientes */}
                {serviciosAprobados.length > 0 && (
                    <div>
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
                            Aprobaciones Recientes
                        </h2>
                        <div className="bg-white shadow rounded-lg overflow-hidden">
                            <ul className="divide-y divide-gray-200">
                                {serviciosAprobados.map((servicio) => (
                                    <li key={servicio.id} className="p-4 hover:bg-gray-50">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{servicio.codigo}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Operario: {servicio.operario?.name || servicio.operario?.username}
                                                </p>
                                            </div>
                                            <div className="text-left sm:text-right sm:ml-4 shrink-0">
                                                <p className="text-xs text-gray-500">
                                                    Aprobado por: {servicio.aprobacion?.supervisor?.name || servicio.aprobacion?.supervisor?.username}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {servicio.aprobacion?.fechaAprobacion && new Date(servicio.aprobacion.fechaAprobacion).toLocaleDateString('es-ES', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
