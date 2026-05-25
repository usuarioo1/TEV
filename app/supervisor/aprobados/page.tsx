import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { requireRole } from '@/lib/permissions';
import { ROLES } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import IniciarEjecucionButton from '@/components/supervisor/IniciarEjecucionButton';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

export default async function ServiciosAprobadosPage() {
    await requireRole([ROLES.SUPERVISOR, ROLES.JEFATURAS]);

    const session = await getSession();
    if (!session) redirect('/login');

    // Obtener servicios aprobados
    const serviciosAprobados = await prisma.servicio.findMany({
        where: {
            estado: 'APROBADO',
            aprobacion: {
                isNot: null,
            },
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
        orderBy: {
            updatedAt: 'desc',
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
                                className="border-green-500 text-green-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm shrink-0"
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

                {/* Lista de Servicios Aprobados */}
                <div className="mb-8">
                    <div className="bg-white shadow rounded-lg p-6 mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Servicios Aprobados
                        </h2>
                        <p className="text-sm text-gray-600">
                            Total: {serviciosAprobados.length} servicios
                        </p>
                    </div>

                    {serviciosAprobados.length === 0 ? (
                        <div className="bg-white shadow rounded-lg p-8 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay servicios aprobados</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Aún no se han aprobado servicios
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {serviciosAprobados.map((servicio) => (
                                <div key={servicio.id} className="bg-white shadow rounded-lg overflow-hidden border-l-4 border-green-500">
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3">
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {servicio.codigo}
                                                    </h3>
                                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        ✓ Aprobado
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Aprobado el {servicio.aprobacion?.fechaAprobacion && new Date(servicio.aprobacion.fechaAprobacion).toLocaleDateString('es-ES', {
                                                        day: '2-digit',
                                                        month: 'long',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Ruta */}
                                        <div className="mb-4">
                                            <div className="flex items-center space-x-2 text-sm bg-gray-50 p-3 rounded-lg">
                                                <div className="flex-1">
                                                    <p className="text-gray-500 text-xs mb-1">Origen</p>
                                                    <p className="font-medium text-gray-900">{servicio.origen}</p>
                                                </div>
                                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

                                        {/* Info del Supervisor y Personal */}
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
                                                <p className="text-sm font-medium text-green-700">
                                                    {servicio.aprobacion?.supervisor?.name || servicio.aprobacion?.supervisor?.username}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Observaciones si existen */}
                                        {servicio.aprobacion?.observaciones && (
                                            <div className="mt-4 bg-blue-50 p-3 rounded-lg">
                                                <p className="text-xs text-gray-500 mb-1">Observaciones del supervisor</p>
                                                <p className="text-sm text-gray-700">{servicio.aprobacion.observaciones}</p>
                                            </div>
                                        )}

                                        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                                            <Link
                                                href={`/supervisor/${servicio.id}`}
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                            >
                                                Ver Detalles
                                            </Link>
                                        </div>


                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
