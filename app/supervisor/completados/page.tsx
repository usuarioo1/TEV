import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { requireRole } from '@/lib/permissions';
import { ROLES } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Link from 'next/link';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

const EVIDENCIAS_CIERRE_MARKER = 'EVIDENCIAS_FOTOGRAFICAS_CIERRE:';
const BLOQUE_CIERRE_HEADER = 'ETAPA FINAL Y CIERRE - ANALISIS DE RIESGO';

function extraerEvidenciasCierre(observaciones?: string | null): string[] {
    if (!observaciones || !observaciones.includes(EVIDENCIAS_CIERRE_MARKER)) return [];

    const markerIndex = observaciones.indexOf(EVIDENCIAS_CIERRE_MARKER);
    const bloque = observaciones.slice(markerIndex);

    return bloque
        .split(/\r?\n/)
        .map((linea) => linea.trim())
        .filter((linea) => linea.startsWith('- '))
        .map((linea) => {
            const match = linea.match(/https?:\/\/\S+/i);
            return match?.[0] || '';
        })
        .filter((url) => url.length > 0)
        .slice(0, 3);
}

function limpiarBloqueEvidenciasCierre(observaciones?: string | null): string {
    if (!observaciones) return '';

    return observaciones
        .replace(/\r?\n?EVIDENCIAS_FOTOGRAFICAS_CIERRE:\r?\n(?:- \d+\.\s+https?:\/\/[^\r\n]+\r?\n?)*/g, '')
        .trim();
}

function extraerObservacionesCierreOperario(observaciones?: string | null): string {
    if (!observaciones) return '';

    if (observaciones.includes('CIERRE:')) {
        const cierreLegacy = observaciones.split('CIERRE:')[1]?.trim() || '';
        const limpio = limpiarBloqueEvidenciasCierre(cierreLegacy);

        return limpio
            .split(/\r?\n/)
            .map((linea) => linea.trim())
            .filter((linea) => !/^https?:\/\//i.test(linea))
            .filter((linea) => !/^-\s*\d+\.\s*https?:\/\//i.test(linea))
            .join('\n')
            .trim();
    }

    if (!observaciones.includes(BLOQUE_CIERRE_HEADER)) {
        return '';
    }

    const cierreDesdeHeader = observaciones.slice(observaciones.indexOf(BLOQUE_CIERRE_HEADER));
    const cierreSinEvidencias = limpiarBloqueEvidenciasCierre(cierreDesdeHeader);

    const lineas = cierreSinEvidencias
        .split(/\r?\n/)
        .map((linea) => linea.trim());

    const observacionesLinea = lineas
        .filter((linea) => /^Observaciones (finales|de cierre):/i.test(linea))
        .map((linea) => linea.replace(/^Observaciones (finales|de cierre):\s*/i, '').trim())
        .filter((linea) => linea.length > 0);

    return observacionesLinea.join('\n');
}

export default async function ServiciosCompletadosPage() {
    await requireRole([ROLES.SUPERVISOR, ROLES.JEFATURAS]);

    const session = await getSession();
    if (!session) redirect('/login');

    // Obtener servicios completados
    const serviciosCompletados = await prisma.servicio.findMany({
        where: {
            estado: 'COMPLETADO',
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
                                className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm shrink-0"
                            >
                                En Ejecución
                            </Link>
                            <Link
                                href="/supervisor/completados"
                                className="border-blue-500 text-blue-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm shrink-0"
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

                {/* Lista de Servicios Completados */}
                <div className="mb-8">
                    <div className="bg-white shadow rounded-lg p-6 mb-6">
                        <div className="flex items-center space-x-2">
                            <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Servicios Completados
                                </h2>
                                <p className="text-sm text-gray-600">
                                    Servicios finalizados por los operarios
                                </p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-2xl font-bold text-blue-600">
                                {serviciosCompletados.length} servicios completados
                            </p>
                        </div>
                    </div>

                    {serviciosCompletados.length === 0 ? (
                        <div className="bg-white shadow rounded-lg p-8 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay servicios completados</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Aún no se han completado servicios
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {serviciosCompletados.map((servicio) => {
                                const duracionTotal = servicio.fechaInicio && servicio.fechaFinalizacion
                                    ? Math.floor((new Date(servicio.fechaFinalizacion).getTime() - new Date(servicio.fechaInicio).getTime()) / 1000 / 60)
                                    : null;
                                const observacionesCierreOperario = extraerObservacionesCierreOperario(servicio.observaciones);
                                const evidenciasCierre = extraerEvidenciasCierre(servicio.observaciones);

                                return (
                                    <div key={servicio.id} className="bg-white shadow rounded-lg overflow-hidden border-l-4 border-blue-500">
                                        <div className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-3">
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {servicio.codigo}
                                                        </h3>
                                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            ✓ Completado
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        Finalizado el {servicio.fechaFinalizacion && new Date(servicio.fechaFinalizacion).toLocaleDateString('es-ES', {
                                                            day: '2-digit',
                                                            month: 'long',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Duración del servicio */}
                                            {duracionTotal !== null && (
                                                <div className="mb-4 bg-blue-50 p-3 rounded-lg">
                                                    <p className="text-xs text-blue-600 font-medium mb-1">
                                                        Duración total del servicio
                                                    </p>
                                                    <p className="text-sm text-blue-900 font-semibold">
                                                        {duracionTotal < 60
                                                            ? `${duracionTotal} minutos`
                                                            : `${Math.floor(duracionTotal / 60)} horas y ${duracionTotal % 60} minutos`}
                                                    </p>
                                                </div>
                                            )}

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

                                            {servicio.empresa?.nombre && (
                                                <p className="text-xs text-gray-500 mb-4">
                                                    Servicio para: <span className="font-medium text-gray-700">{servicio.empresa.nombre}</span>
                                                </p>
                                            )}

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

                                            {/* Observaciones y evidencias finales del operario */}
                                            {(observacionesCierreOperario || evidenciasCierre.length > 0) && (
                                                <div className="mt-4 bg-green-50 p-3 rounded-lg">
                                                    <p className="text-xs text-green-600 font-medium mb-1">Observaciones del operario al finalizar</p>

                                                    {observacionesCierreOperario && (
                                                        <p className="text-sm text-green-900 whitespace-pre-line">
                                                            {observacionesCierreOperario}
                                                        </p>
                                                    )}

                                                    {evidenciasCierre.length > 0 && (
                                                        <div className="mt-3">
                                                            <p className="text-xs text-green-700 font-medium mb-2">
                                                                Evidencias fotográficas ({evidenciasCierre.length})
                                                            </p>
                                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                                {evidenciasCierre.map((url, index) => (
                                                                    <a
                                                                        key={`${url}-${index}`}
                                                                        href={url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="block rounded-lg overflow-hidden border border-green-200 hover:border-green-400 transition-colors bg-white"
                                                                        title={`Abrir evidencia ${index + 1}`}
                                                                    >
                                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                        <img
                                                                            src={url}
                                                                            alt={`Evidencia de cierre ${index + 1}`}
                                                                            className="w-full h-28 object-cover"
                                                                        />
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Botón para ver detalles completos */}
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <Link
                                                    href={`/servicios/${servicio.id}`}
                                                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                    Ver detalles completos
                                                    <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </Link>
                                            </div>
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
