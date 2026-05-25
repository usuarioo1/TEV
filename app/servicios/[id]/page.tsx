import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/session';
import { ROLES } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import FinalizarServicioButton from '@/components/servicios/FinalizarServicioButton';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

const EVIDENCIAS_CIERRE_MARKER = 'EVIDENCIAS_FOTOGRAFICAS_CIERRE:';

function formatChileDate(
    value: string | Date | null | undefined,
    options: Intl.DateTimeFormatOptions
) {
    if (!value) return '';
    return new Date(value).toLocaleDateString('es-ES', {
        ...options,
        timeZone: 'America/Santiago',
    });
}

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

export default async function ServicioDetallePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const session = await getSession();

    if (!session) redirect('/login');

    // Obtener el servicio con todos sus detalles
    const servicio = await prisma.servicio.findUnique({
        where: { id: parseInt(id) },
        include: {
            operario: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                    email: true,
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

    if (!servicio) {
        notFound();
    }

    // Calcular tiempo de ejecución si está en ejecución
    const tiempoEjecucion = servicio.fechaInicio
        ? Math.floor((new Date().getTime() - new Date(servicio.fechaInicio).getTime()) / 1000 / 60)
        : null;
    const evidenciasCierre = extraerEvidenciasCierre(servicio.observaciones);
    const observacionesSinEvidencias = limpiarBloqueEvidenciasCierre(servicio.observaciones);

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/servicios"
                        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Volver a Mis Servicios
                    </Link>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                {servicio.codigo}
                            </h1>
                            <p className="mt-2 text-sm text-gray-600">
                                Detalle completo del servicio
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-start sm:justify-end gap-3">
                            <span className={`px-4 py-2 rounded-full text-sm font-medium ${servicio.estado === 'EN_EJECUCION'
                                ? 'bg-orange-500 text-white font-semibold animate-pulse'
                                : servicio.estado === 'APROBADO'
                                    ? 'bg-green-100 text-green-800'
                                    : servicio.estado === 'COMPLETADO'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-800'
                                }`}>
                                {servicio.estado === 'EN_EJECUCION' ? '⚡ En Ejecución' : servicio.estado}
                            </span>
                            <a
                                href={`/api/servicios/${servicio.id}/pdf`}
                                download
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Descargar PDF
                            </a>
                        </div>
                    </div>
                </div>

                {/* Estado de Ejecución - Solo si está en ejecución */}
                {servicio.estado === 'EN_EJECUCION' && (
                    <div className="bg-orange-50 border-l-4 border-orange-500 p-6 mb-6 rounded-lg">
                        <div className="flex items-center mb-4">
                            <svg className="h-8 w-8 text-orange-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <div>
                                <h2 className="text-xl font-semibold text-orange-900">
                                    Servicio en Ejecución
                                </h2>
                                <p className="text-sm text-orange-700">
                                    El servicio está actualmente en curso
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="bg-white p-4 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Iniciado el</p>
                                <p className="text-sm font-semibold text-gray-900">
                                    {servicio.fechaInicio && formatChileDate(servicio.fechaInicio, {
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Tiempo transcurrido</p>
                                <p className="text-sm font-semibold text-orange-600">
                                    {tiempoEjecucion !== null && (
                                        tiempoEjecucion < 60
                                            ? `${tiempoEjecucion} minutos`
                                            : `${Math.floor(tiempoEjecucion / 60)} horas y ${tiempoEjecucion % 60} minutos`
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Botón para Finalizar Servicio - Solo si está en ejecución y es el operario */}
                {servicio.estado === 'EN_EJECUCION' && session.rol === ROLES.OPERARIO && servicio.operarioId === session.id && (
                    <div className="mb-6">
                        <FinalizarServicioButton
                            servicioId={servicio.id}
                            codigoServicio={servicio.codigo}
                        />
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Columna Principal */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Información del Servicio */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Información del Servicio
                            </h3>

                            {/* Ruta */}
                            <div className="mb-6">
                                <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-lg">
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 mb-1">Origen</p>
                                        <p className="text-base font-semibold text-gray-900">{servicio.origen}</p>
                                        {servicio.telefonoOrigen && (
                                            <a href={`tel:${servicio.telefonoOrigen}`} className="text-xs text-blue-600 hover:text-blue-800 flex items-center mt-2">
                                                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                                {servicio.telefonoOrigen}
                                            </a>
                                        )}
                                    </div>
                                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 mb-1">Destino</p>
                                        <p className="text-base font-semibold text-gray-900">{servicio.destino}</p>
                                        {servicio.telefonoDestino && (
                                            <a href={`tel:${servicio.telefonoDestino}`} className="text-xs text-blue-600 hover:text-blue-800 flex items-center mt-2">
                                                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                                {servicio.telefonoDestino}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Descripción */}
                            {servicio.descripcion && (
                                <div className="mb-4">
                                    <p className="text-xs text-gray-500 mb-2">Descripción</p>
                                    <p className="text-sm text-gray-700">{servicio.descripcion}</p>
                                </div>
                            )}

                            {/* Fechas */}
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Fecha de Asignación</p>
                                    <p className="text-sm text-gray-900">
                                        {formatChileDate(servicio.fechaAsignacion, {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </p>
                                </div>
                                {servicio.fechaAceptacion && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Fecha de Aceptación</p>
                                        <p className="text-sm text-gray-900">
                                            {formatChileDate(servicio.fechaAceptacion, {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Observaciones */}
                            {observacionesSinEvidencias && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-xs text-gray-500 mb-2">Observaciones</p>
                                    <p className="text-sm text-gray-700 whitespace-pre-line">{observacionesSinEvidencias}</p>
                                </div>
                            )}

                            {evidenciasCierre.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-xs text-gray-500 mb-2">Evidencias Fotográficas de Cierre</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {evidenciasCierre.map((url, index) => (
                                            <a
                                                key={`${url}-${index}`}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors"
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={url}
                                                    alt={`Evidencia de cierre ${index + 1}`}
                                                    className="w-full h-32 object-cover"
                                                />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Validaciones y Checklists */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Validaciones Completadas
                            </h3>

                            {/* Checklist de Equipo */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center">
                                        <svg className={`h-6 w-6 mr-2 ${!servicio.checklistEquipo
                                            ? 'text-gray-300'
                                            : servicio.checklistEquipo.completado
                                                ? servicio.checklistEquipo.equipoEnCondiciones ? 'text-green-500' : 'text-red-500'
                                                : 'text-yellow-500'
                                            }`} fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="font-medium text-gray-900">Checklist de Equipo - Rampla</span>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${!servicio.checklistEquipo
                                        ? 'bg-gray-100 text-gray-600'
                                        : servicio.checklistEquipo.completado
                                            ? servicio.checklistEquipo.equipoEnCondiciones
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {!servicio.checklistEquipo
                                            ? 'Pendiente'
                                            : servicio.checklistEquipo.completado
                                                ? servicio.checklistEquipo.equipoEnCondiciones ? 'Completado' : 'Con Fallas'
                                                : 'En Checklist'
                                        }
                                    </span>
                                </div>
                                {servicio.checklistEquipo?.observaciones && (
                                    <p className="text-sm text-gray-600 ml-8">{servicio.checklistEquipo.observaciones}</p>
                                )}
                            </div>

                            {/* Checklist de Tracto Camión */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center">
                                        <svg className={`h-6 w-6 mr-2 ${!servicio.checklistTractoCamion
                                            ? 'text-gray-300'
                                            : servicio.checklistTractoCamion.completado
                                                ? servicio.checklistTractoCamion.equipoEnCondiciones ? 'text-green-500' : 'text-red-500'
                                                : 'text-yellow-500'
                                            }`} fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="font-medium text-gray-900">Checklist de Tracto Camión</span>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${!servicio.checklistTractoCamion
                                        ? 'bg-gray-100 text-gray-600'
                                        : servicio.checklistTractoCamion.completado
                                            ? servicio.checklistTractoCamion.equipoEnCondiciones
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {!servicio.checklistTractoCamion
                                            ? 'Pendiente'
                                            : servicio.checklistTractoCamion.completado
                                                ? servicio.checklistTractoCamion.equipoEnCondiciones ? 'Completado' : 'Con Fallas'
                                                : 'En Checklist'
                                        }
                                    </span>
                                </div>
                                {servicio.checklistTractoCamion?.observacionesGenerales && (
                                    <p className="text-sm text-gray-600 ml-8">{servicio.checklistTractoCamion.observacionesGenerales}</p>
                                )}
                            </div>

                            {/* Checklist de Fatiga */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center">
                                        <svg className={`h-6 w-6 mr-2 ${!servicio.checklistFatiga
                                            ? 'text-gray-300'
                                            : servicio.checklistFatiga.completado
                                                ? servicio.checklistFatiga.aptoParaTrabajar ? 'text-green-500' : 'text-red-500'
                                                : 'text-yellow-500'
                                            }`} fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="font-medium text-gray-900">Checklist de Fatiga</span>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${!servicio.checklistFatiga
                                        ? 'bg-gray-100 text-gray-600'
                                        : servicio.checklistFatiga.completado
                                            ? servicio.checklistFatiga.aptoParaTrabajar
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {!servicio.checklistFatiga
                                            ? 'Pendiente'
                                            : servicio.checklistFatiga.completado
                                                ? servicio.checklistFatiga.aptoParaTrabajar ? 'Apto' : 'No Apto'
                                                : 'En Checklist'
                                        }
                                    </span>
                                </div>
                                {servicio.checklistFatiga?.observaciones && (
                                    <p className="text-sm text-gray-600 ml-8">{servicio.checklistFatiga.observaciones}</p>
                                )}
                            </div>

                            {/* Análisis de Riesgo */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center">
                                        <svg className={`h-6 w-6 mr-2 ${!servicio.analisisRiesgo
                                            ? 'text-gray-300'
                                            : servicio.analisisRiesgo.completado
                                                ? servicio.analisisRiesgo.riesgosControlados ? 'text-green-500' : 'text-yellow-500'
                                                : 'text-yellow-500'
                                            }`} fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="font-medium text-gray-900">Análisis de Riesgo (AST/ART)</span>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${!servicio.analisisRiesgo
                                        ? 'bg-gray-100 text-gray-600'
                                        : servicio.analisisRiesgo.completado
                                            ? servicio.analisisRiesgo.riesgosControlados
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {!servicio.analisisRiesgo
                                            ? 'Pendiente'
                                            : servicio.analisisRiesgo.completado
                                                ? servicio.analisisRiesgo.riesgosControlados ? 'Controlado' : 'Con Observaciones'
                                                : 'En Análisis'
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Aprobación del Supervisor */}
                        {servicio.aprobacion && (
                            <div className="bg-white shadow rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Aprobación del Supervisor
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center">
                                        {servicio.aprobacion.aprobado ? (
                                            <svg className="h-6 w-6 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            <svg className="h-6 w-6 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.536-10.95a1 1 0 00-1.414-1.414L10 7.757 7.879 5.636a1 1 0 10-1.414 1.414L8.586 9.17l-2.121 2.122a1 1 0 001.414 1.414L10 10.585l2.121 2.121a1 1 0 001.414-1.414L11.414 9.17l2.122-2.121z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                        <span className="font-medium text-gray-900">
                                            {servicio.aprobacion.aprobado ? 'Aprobado por: ' : 'Rechazado por: '}
                                            {servicio.aprobacion.supervisor?.name || servicio.aprobacion.supervisor?.username || 'Supervisor'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">
                                            {servicio.aprobacion.aprobado ? 'Fecha de Aprobación' : 'Fecha de Rechazo'}
                                        </p>
                                        <p className="text-sm text-gray-900">
                                            {servicio.aprobacion.fechaAprobacion && formatChileDate(servicio.aprobacion.fechaAprobacion, {
                                                day: '2-digit',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                    {servicio.aprobacion.observaciones && (
                                        <div className={`p-3 rounded-lg mt-3 ${servicio.aprobacion.aprobado ? 'bg-blue-50' : 'bg-red-50'}`}>
                                            <p className={`text-xs font-medium mb-1 ${servicio.aprobacion.aprobado ? 'text-blue-600' : 'text-red-600'}`}>
                                                {servicio.aprobacion.aprobado ? 'Observaciones' : 'Motivo de rechazo'}
                                            </p>
                                            <p className={`text-sm ${servicio.aprobacion.aprobado ? 'text-blue-900' : 'text-red-900'}`}>
                                                {servicio.aprobacion.observaciones}
                                            </p>
                                        </div>
                                    )}
                                    {!servicio.aprobacion.aprobado && servicio.aprobacion.motivoRechazo && (
                                        <div className="bg-red-50 p-3 rounded-lg mt-3">
                                            <p className="text-xs text-red-600 font-medium mb-1">Motivo de rechazo</p>
                                            <p className="text-sm text-red-900">{servicio.aprobacion.motivoRechazo}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Columna Lateral */}
                    <div className="space-y-6">
                        {/* Personal Involucrado */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Personal
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Operario</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {servicio.operario?.name || servicio.operario?.username}
                                    </p>
                                    {servicio.operario?.email && (
                                        <p className="text-xs text-gray-500">{servicio.operario.email}</p>
                                    )}
                                </div>
                                <div className="pt-4 border-t border-gray-200">
                                    <p className="text-xs text-gray-500 mb-1">Coordinador</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {servicio.coordinador?.name || servicio.coordinador?.username}
                                    </p>
                                </div>
                                {servicio.aprobacion?.supervisor && (
                                    <div className="pt-4 border-t border-gray-200">
                                        <p className="text-xs text-gray-500 mb-1">Supervisor</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {servicio.aprobacion.supervisor.name || servicio.aprobacion.supervisor.username}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Línea de Tiempo
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-900">Asignado</p>
                                        <p className="text-xs text-gray-500">
                                            {formatChileDate(servicio.fechaAsignacion, {
                                                day: '2-digit',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </div>

                                {servicio.fechaAceptacion && (
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                            <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-900">Aceptado</p>
                                            <p className="text-xs text-gray-500">
                                                {formatChileDate(servicio.fechaAceptacion, {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {servicio.aprobacion?.fechaAprobacion && (
                                    <div className="flex items-start">
                                        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${servicio.aprobacion.aprobado ? 'bg-purple-100' : 'bg-red-100'}`}>
                                            {servicio.aprobacion.aprobado ? (
                                                <svg className="h-4 w-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <svg className="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.536-10.95a1 1 0 00-1.414-1.414L10 7.757 7.879 5.636a1 1 0 10-1.414 1.414L8.586 9.17l-2.121 2.122a1 1 0 001.414 1.414L10 10.585l2.121 2.121a1 1 0 001.414-1.414L11.414 9.17l2.122-2.121z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="ml-3">
                                            <p className={`text-sm font-medium ${servicio.aprobacion.aprobado ? 'text-gray-900' : 'text-red-700'}`}>
                                                {servicio.aprobacion.aprobado ? 'Aprobado' : 'Rechazado'}
                                            </p>
                                            <p className={`text-xs ${servicio.aprobacion.aprobado ? 'text-gray-500' : 'text-red-600'}`}>
                                                {formatChileDate(servicio.aprobacion.fechaAprobacion, {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {servicio.aprobacion.supervisor?.name || servicio.aprobacion.supervisor?.username || 'Supervisor'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {servicio.fechaInicio && (
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                            <svg className="h-4 w-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-indigo-900">En Ejecución</p>
                                            <p className="text-xs text-indigo-600">
                                                {formatChileDate(servicio.fechaInicio, {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {servicio.fechaFinalizacion && (
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                                            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-bold text-green-700">✓ Completado</p>
                                            <p className="text-xs text-gray-500">
                                                {formatChileDate(servicio.fechaFinalizacion, {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
