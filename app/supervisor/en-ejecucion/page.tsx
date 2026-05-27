import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { requireRole } from '@/lib/permissions';
import { ROLES } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Link from 'next/link';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

export default async function ServiciosEnEjecucionPage() {
    await requireRole([ROLES.SUPERVISOR, ROLES.JEFATURAS, ROLES.OPERARIO]);

    const session = await getSession();
    if (!session) redirect('/login');

    // Obtener servicios en ejecución
    const serviciosEnEjecucion = await prisma.servicio.findMany({
        where: {
            estado: 'EN_EJECUCION',
        },
        include: {
            empresa: {
                select: {
                    id: true,
                    nombre: true,
                },
            },
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
            checklistTractoCamion: true,
            checklistFatiga: true,
            analisisRiesgo: true,
        },
        orderBy: {
            fechaInicio: 'desc',
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
                                href="/supervisor"
                                className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm shrink-0"
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
                                className="border-indigo-500 text-indigo-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm shrink-0"
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

                {/* Lista de Servicios en Ejecución */}
                <div className="mb-8">
                    <div className="bg-white shadow rounded-lg p-6 mb-6">
                        <div className="flex items-center space-x-2">
                            <svg className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Servicios en Ejecución
                                </h2>
                                <p className="text-sm text-gray-600">
                                    Servicios actualmente en curso
                                </p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-2xl font-bold text-indigo-600">
                                {serviciosEnEjecucion.length} servicios activos
                            </p>
                        </div>
                    </div>

                    {serviciosEnEjecucion.length === 0 ? (
                        <div className="bg-white shadow rounded-lg p-8 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay servicios en ejecución</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                No hay servicios ejecutándose en este momento
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {serviciosEnEjecucion.map((servicio) => {
                                const tiempoEjecucion = servicio.fechaInicio
                                    ? Math.floor((new Date().getTime() - new Date(servicio.fechaInicio).getTime()) / 1000 / 60)
                                    : 0;

                                return (
                                    <div key={servicio.id} className="bg-white shadow rounded-lg overflow-hidden border-l-4 border-indigo-500">
                                        <div className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-3">
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {servicio.codigo}
                                                        </h3>
                                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 animate-pulse">
                                                            ⚡ En Ejecución
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        Iniciado el {servicio.fechaInicio && new Date(servicio.fechaInicio).toLocaleDateString('es-ES', {
                                                            day: '2-digit',
                                                            month: 'long',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </p>
                                                    <p className="text-xs text-indigo-600 mt-1 font-medium">
                                                        Tiempo transcurrido: {tiempoEjecucion < 60 ? `${tiempoEjecucion} minutos` : `${Math.floor(tiempoEjecucion / 60)} horas y ${tiempoEjecucion % 60} minutos`}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Ruta */}
                                            <div className="mb-4">
                                                <div className="flex items-center space-x-2 text-sm bg-indigo-50 p-3 rounded-lg">
                                                    <div className="flex-1">
                                                        <p className="text-gray-500 text-xs mb-1">Origen</p>
                                                        <p className="font-medium text-gray-900">{servicio.origen}</p>
                                                    </div>
                                                    <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                    </svg>
                                                    <div className="flex-1">
                                                        <p className="text-gray-500 text-xs mb-1">Destino</p>
                                                        <p className="font-medium text-gray-900">{servicio.destino}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Descripción */}
                                            {servicio.descripcion && (
                                                <p className="text-sm text-gray-600 mb-4">
                                                    {servicio.descripcion}
                                                </p>
                                            )}

                                            {servicio.empresa?.nombre && (
                                                <p className="text-xs text-gray-500 mb-4">
                                                    Servicio para: <span className="font-medium text-gray-700">{servicio.empresa.nombre}</span>
                                                </p>
                                            )}

                                            {/* Resumen de Validaciones */}
                                            <div className="mb-4 bg-gray-50 p-4 rounded-lg">
                                                <p className="text-xs text-gray-500 font-medium mb-2">Resumen de Validaciones</p>
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="text-center">
                                                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${servicio.checklistEquipo?.equipoEnCondiciones ? 'bg-green-100' : 'bg-yellow-100'} mb-1`}>
                                                            <svg className={`h-5 w-5 ${servicio.checklistEquipo?.equipoEnCondiciones ? 'text-green-600' : 'text-yellow-600'}`} fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                        <p className="text-xs text-gray-600">Equipo</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${servicio.checklistFatiga?.aptoParaTrabajar ? 'bg-green-100' : 'bg-yellow-100'} mb-1`}>
                                                            <svg className={`h-5 w-5 ${servicio.checklistFatiga?.aptoParaTrabajar ? 'text-green-600' : 'text-yellow-600'}`} fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                        <p className="text-xs text-gray-600">Operario</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${servicio.analisisRiesgo?.riesgosControlados ? 'bg-green-100' : 'bg-yellow-100'} mb-1`}>
                                                            <svg className={`h-5 w-5 ${servicio.analisisRiesgo?.riesgosControlados ? 'text-green-600' : 'text-yellow-600'}`} fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                        <p className="text-xs text-gray-600">Riesgos</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Info del Personal */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Operario</p>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {servicio.operario?.name || servicio.operario?.username}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Coordinador</p>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {servicio.coordinador?.name || servicio.coordinador?.username}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Aprobado por</p>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {servicio.aprobacion?.supervisor?.name || servicio.aprobacion?.supervisor?.username}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Observaciones del supervisor si existen */}
                                            {servicio.aprobacion?.observaciones && (
                                                <div className="mt-4 bg-blue-50 p-3 rounded-lg">
                                                    <p className="text-xs text-gray-500 mb-1">Observaciones del supervisor</p>
                                                    <p className="text-sm text-gray-700">{servicio.aprobacion.observaciones}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
