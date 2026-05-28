import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import ChecklistEquipoDetalle from '@/components/dashboard/operaciones/ChecklistEquipoDetalle';
import ChecklistFatigaDetalle from '@/components/dashboard/operaciones/ChecklistFatigaDetalle';
import ChecklistTractoCamionDetalle from '@/components/dashboard/operaciones/ChecklistTractoCamionDetalle';
import AnalisisRiesgoDetalle from '@/components/dashboard/operaciones/AnalisisRiesgoDetalle';
import AprobacionDetalle from '@/components/dashboard/operaciones/AprobacionDetalle';

const CIERRE_MARKER = 'ETAPA FINAL Y CIERRE - ANALISIS DE RIESGO';
const EVIDENCIAS_CIERRE_MARKER = 'EVIDENCIAS_FOTOGRAFICAS_CIERRE:';

type EvaluacionTerminoItem = {
    numero: number;
    pregunta: string;
    respuesta: string;
    observacion?: string;
};

type CierreAnalisisInfo = {
    evaluacion: EvaluacionTerminoItem[];
    observacionesFinales: string;
    observacionesCierre: string;
    detalleExtra: string[];
    evidencias: string[];
};

function extraerEvidenciasCierre(texto: string): string[] {
    if (!texto || !texto.includes(EVIDENCIAS_CIERRE_MARKER)) {
        return [];
    }

    const markerIndex = texto.indexOf(EVIDENCIAS_CIERRE_MARKER);
    const bloque = texto.slice(markerIndex);

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

function limpiarBloqueEvidenciasCierre(texto: string): string {
    if (!texto) {
        return '';
    }

    return texto
        .replace(/\r?\n?EVIDENCIAS_FOTOGRAFICAS_CIERRE:\r?\n(?:- \d+\.\s+https?:\/\/[^\r\n]+\r?\n?)*/g, '')
        .trim();
}

function parsearCierreAnalisis(textoCierre: string): CierreAnalisisInfo {
    const evidencias = extraerEvidenciasCierre(textoCierre);
    const textoSinEvidencias = limpiarBloqueEvidenciasCierre(textoCierre);

    const lineas = textoSinEvidencias
        .split(/\r?\n/)
        .map((linea) => linea.trim())
        .filter(Boolean);

    const evaluacion: EvaluacionTerminoItem[] = [];
    const detalleExtra: string[] = [];
    let observacionesFinales = '';
    let observacionesCierre = '';

    for (let i = 0; i < lineas.length; i++) {
        const linea = lineas[i];

        if (linea === CIERRE_MARKER || /^evaluacion de termino:?$/i.test(linea)) {
            continue;
        }

        const matchEvaluacion = linea.match(/^(\d+)\.\s*(.+?)\s*->\s*(.+)$/i);
        if (matchEvaluacion) {
            const item: EvaluacionTerminoItem = {
                numero: Number(matchEvaluacion[1]),
                pregunta: matchEvaluacion[2].trim(),
                respuesta: matchEvaluacion[3].trim(),
            };

            const siguiente = lineas[i + 1];
            if (siguiente && /^observacion:\s*/i.test(siguiente)) {
                item.observacion = siguiente.replace(/^observacion:\s*/i, '').trim();
                i += 1;
            }

            evaluacion.push(item);
            continue;
        }

        if (/^observaciones finales:\s*/i.test(linea)) {
            observacionesFinales = linea.replace(/^observaciones finales:\s*/i, '').trim();
            continue;
        }

        if (/^observaciones de cierre:\s*/i.test(linea)) {
            observacionesCierre = linea.replace(/^observaciones de cierre:\s*/i, '').trim();
            continue;
        }

        detalleExtra.push(linea);
    }

    return {
        evaluacion,
        observacionesFinales,
        observacionesCierre,
        detalleExtra,
        evidencias,
    };
}

export default async function DetalleOperacionPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session) {
        redirect('/login');
    }

    const resolvedParams = await params;
    const servicioId = parseInt(resolvedParams.id);
    if (isNaN(servicioId)) {
        redirect('/dashboard');
    }

    const servicio = await prisma.servicio.findUnique({
        where: { id: servicioId },
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
            checklistFatiga: true,
            checklistTractoCamion: true,
            analisisRiesgo: {
                include: {
                    supervisorResponsable: {
                        select: { id: true, name: true, username: true },
                    },
                },
            },
            aprobacion: {
                include: {
                    supervisor: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                        },
                    },
                },
            },
        },
    });

    if (!servicio) {
        redirect('/dashboard');
    }

    const observacionesTexto = servicio.observaciones || '';
    const cierreStart = observacionesTexto.indexOf(CIERRE_MARKER);
    const observacionesGenerales = cierreStart >= 0
        ? observacionesTexto.slice(0, cierreStart).trim()
        : observacionesTexto;
    const infoCierre = cierreStart >= 0
        ? observacionesTexto.slice(cierreStart).trim()
        : '';
    const cierreAnalisis = infoCierre ? parsearCierreAnalisis(infoCierre) : null;

    const getEstadoBadgeColor = (estado: string) => {
        const colores: Record<string, string> = {
            'ASIGNADO': 'bg-blue-100 text-blue-800',
            'ACEPTADO': 'bg-cyan-100 text-cyan-800',
            'RECHAZADO': 'bg-red-100 text-red-800',
            'PENDIENTE_APROBACION': 'bg-yellow-100 text-yellow-800',
            'APROBADO': 'bg-green-100 text-green-800',
            'EN_EJECUCION': 'bg-purple-100 text-purple-800',
            'COMPLETADO': 'bg-gray-100 text-gray-800',
        };
        return colores[estado] || 'bg-gray-100 text-gray-800';
    };

    const getEstadoTexto = (estado: string) => {
        const textos: Record<string, string> = {
            'ASIGNADO': 'Asignado',
            'ACEPTADO': 'Aceptado',
            'RECHAZADO': 'Rechazado',
            'PENDIENTE_APROBACION': 'Pendiente Aprobación',
            'APROBADO': 'Aprobado',
            'EN_EJECUCION': 'En Ejecución',
            'COMPLETADO': 'Completado',
        };
        return textos[estado] || estado;
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header con botón de volver */}
                <div className="mb-6">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Volver al Dashboard
                    </Link>

                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Servicio {servicio.codigo}
                                </h1>
                                <p className="text-gray-600 mt-1">{servicio.descripcion}</p>
                            </div>
                            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getEstadoBadgeColor(servicio.estado)}`}>
                                {getEstadoTexto(servicio.estado)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Información del Servicio */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Información General</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <dl className="space-y-3">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Código del Servicio</dt>
                                    <dd className="mt-1 text-sm text-gray-900 font-mono">{servicio.codigo}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Descripción</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{servicio.descripcion}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Ruta</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        <div className="flex items-center">
                                            <span className="font-medium">{servicio.origen}</span>
                                            <svg className="h-5 w-5 mx-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                            <span className="font-medium">{servicio.destino}</span>
                                        </div>
                                    </dd>
                                </div>
                                {(servicio.telefonoOrigen || servicio.telefonoDestino) && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Teléfonos de Contacto</dt>
                                        <dd className="mt-1 text-sm text-gray-900 space-y-1">
                                            {servicio.telefonoOrigen && (
                                                <div className="flex items-center">
                                                    <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                    <span className="text-xs text-gray-500 mr-2">Origen:</span>
                                                    <a href={`tel:${servicio.telefonoOrigen}`} className="hover:text-blue-600">
                                                        {servicio.telefonoOrigen}
                                                    </a>
                                                </div>
                                            )}
                                            {servicio.telefonoDestino && (
                                                <div className="flex items-center">
                                                    <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                    <span className="text-xs text-gray-500 mr-2">Destino:</span>
                                                    <a href={`tel:${servicio.telefonoDestino}`} className="hover:text-blue-600">
                                                        {servicio.telefonoDestino}
                                                    </a>
                                                </div>
                                            )}
                                        </dd>
                                    </div>
                                )}
                                {observacionesGenerales && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Observaciones</dt>
                                        <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{observacionesGenerales}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                        <div>
                            <dl className="space-y-3">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Operario Asignado</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {servicio.operario?.name || servicio.operario?.username}
                                        {servicio.operario?.email && (
                                            <span className="text-gray-500 block text-xs">{servicio.operario.email}</span>
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Coordinador</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {servicio.coordinador?.name || servicio.coordinador?.username}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Fecha de Asignación</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {new Date(servicio.fechaAsignacion).toLocaleDateString('es-ES', {
                                            day: '2-digit',
                                            month: 'long',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </dd>
                                </div>
                                {servicio.fechaAceptacion && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Fecha de Aceptación</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {new Date(servicio.fechaAceptacion).toLocaleDateString('es-ES', {
                                                day: '2-digit',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </dd>
                                    </div>
                                )}
                                {servicio.fechaRechazo && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Fecha de Rechazo</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {new Date(servicio.fechaRechazo).toLocaleDateString('es-ES', {
                                                day: '2-digit',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </dd>
                                    </div>
                                )}
                                {servicio.fechaInicio && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Fecha de Inicio</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {new Date(servicio.fechaInicio).toLocaleDateString('es-ES', {
                                                day: '2-digit',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </dd>
                                    </div>
                                )}
                                {servicio.fechaFinalizacion && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Fecha de Finalización</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {new Date(servicio.fechaFinalizacion).toLocaleDateString('es-ES', {
                                                day: '2-digit',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>
                </div>

                {cierreAnalisis && (
                    <div className="bg-white shadow rounded-xl p-6 mb-6 border border-indigo-100">
                        <div className="flex items-start gap-3 mb-5">
                            <div className="shrink-0 h-10 w-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Etapa Final y Cierre - Análisis de Riesgo</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Resumen de cierre registrado por el operario al finalizar el servicio.
                                </p>
                            </div>
                        </div>

                        {cierreAnalisis.evaluacion.length > 0 && (
                            <div className="mb-5">
                                <h3 className="text-sm font-semibold text-gray-800 mb-3">Evaluación de término</h3>
                                <div className="space-y-3">
                                    {cierreAnalisis.evaluacion.map((item) => (
                                        <div key={`${item.numero}-${item.pregunta}`} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                            <div className="flex items-start justify-between gap-3">
                                                <p className="text-sm text-gray-900 font-medium">
                                                    {item.numero}. {item.pregunta}
                                                </p>
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${item.respuesta === 'SI'
                                                    ? 'bg-green-100 text-green-800'
                                                    : item.respuesta === 'NO'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {item.respuesta}
                                                </span>
                                            </div>
                                            {item.observacion && (
                                                <p className="text-sm text-amber-900 mt-2 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                                                    <span className="font-medium">Observación:</span> {item.observacion}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(cierreAnalisis.observacionesFinales || cierreAnalisis.observacionesCierre || cierreAnalisis.detalleExtra.length > 0) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                                {cierreAnalisis.observacionesFinales && (
                                    <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
                                        <h3 className="text-sm font-semibold text-sky-900 mb-2">Observaciones finales</h3>
                                        <p className="text-sm text-sky-900 whitespace-pre-line">{cierreAnalisis.observacionesFinales}</p>
                                    </div>
                                )}
                                {cierreAnalisis.observacionesCierre && (
                                    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                                        <h3 className="text-sm font-semibold text-indigo-900 mb-2">Observaciones de cierre</h3>
                                        <p className="text-sm text-indigo-900 whitespace-pre-line">{cierreAnalisis.observacionesCierre}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {cierreAnalisis.detalleExtra.length > 0 && (
                            <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
                                <h3 className="text-sm font-semibold text-gray-800 mb-2">Detalle adicional</h3>
                                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                                    {cierreAnalisis.detalleExtra.map((linea, index) => (
                                        <li key={`${linea}-${index}`}>{linea}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div>
                            <h3 className="text-sm font-semibold text-gray-800 mb-3">Evidencias fotográficas de cierre</h3>
                            {cierreAnalisis.evidencias.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {cierreAnalisis.evidencias.map((url, index) => (
                                        <a
                                            key={`${url}-${index}`}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group block rounded-lg border border-gray-200 overflow-hidden bg-white hover:shadow-md transition-shadow"
                                        >
                                            <img
                                                src={url}
                                                alt={`Evidencia de cierre ${index + 1}`}
                                                className="h-40 w-full object-cover"
                                            />
                                            <div className="px-3 py-2 border-t border-gray-100">
                                                <p className="text-xs font-medium text-indigo-700 group-hover:text-indigo-900">
                                                    Ver imagen completa
                                                </p>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
                                    <p className="text-sm text-gray-500">No se registraron evidencias fotográficas para este cierre.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Checklist de Equipo */}
                {servicio.checklistEquipo && (
                    <ChecklistEquipoDetalle checklist={{
                        ...servicio.checklistEquipo,
                        fecha: servicio.checklistEquipo.fecha.toISOString().split('T')[0],
                    }} />
                )}

                {/* Checklist de Fatiga */}
                {servicio.checklistFatiga && (
                    <ChecklistFatigaDetalle checklist={{
                        ...servicio.checklistFatiga,
                        fecha: servicio.checklistFatiga.fecha.toISOString().split('T')[0],
                    }} />
                )}

                {/* Checklist de Tracto Camión */}
                {servicio.checklistTractoCamion && (
                    <ChecklistTractoCamionDetalle checklist={{
                        ...servicio.checklistTractoCamion,
                        fecha: servicio.checklistTractoCamion.fecha.toISOString().split('T')[0],
                    }} />
                )}

                {/* Análisis de Riesgo */}
                {servicio.analisisRiesgo && (
                    <AnalisisRiesgoDetalle analisis={{
                        ...servicio.analisisRiesgo,
                        fecha: servicio.analisisRiesgo.fecha.toISOString().split('T')[0],
                        fechaAprobacion: servicio.analisisRiesgo.fechaAprobacion?.toISOString() || null,
                    }} />
                )}

                {/* Información de Aprobación */}
                {servicio.aprobacion && (
                    <AprobacionDetalle aprobacion={{
                        aprobado: servicio.aprobacion.aprobado,
                        observaciones: servicio.aprobacion.observaciones,
                        supervisor: servicio.aprobacion.supervisor,
                        fechaDecision: servicio.aprobacion.fechaAprobacion.toISOString(),
                    }} />
                )}

                {/* Mensaje si no hay checklists completados */}
                {!servicio.checklistEquipo && !servicio.checklistFatiga && !servicio.checklistTractoCamion && !servicio.analisisRiesgo && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <div className="flex items-center">
                            <svg className="h-6 w-6 text-yellow-400 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div>
                                <h3 className="text-md font-semibold text-yellow-900">Sin formularios completados</h3>
                                <p className="text-sm text-yellow-700 mt-1">
                                    El operario aún no ha completado ningún checklist o formulario para este servicio.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
