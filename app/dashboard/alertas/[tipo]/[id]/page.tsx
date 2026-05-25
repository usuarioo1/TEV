import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Metadata } from 'next';
import AlertTimeline from '@/components/caminatas/AlertTimeline';
import AlertaDetailPdfButton from '@/components/dashboard/AlertaDetailPdfButton';

interface PageProps {
    params: Promise<{
        tipo: string;
        id: string;
    }>;
}

interface TimelineEvent {
    timestamp: Date;
    title: string;
    description: string;
    user?: {
        name: string | null;
        username: string;
    };
    status?: string;
    image?: string | null;
    comment?: string | null;
    type: 'creation' | 'assignment' | 'status_change' | 'verification' | 'closure';
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const resolvedParams = await params;

    const tipoLabels: Record<string, string> = {
        'tarjeta-stop': 'Tarjeta Stop',
        'reporte-peligro': 'Reporte de Peligro',
        'control-art': 'Control ART'
    };

    return {
        title: `${tipoLabels[resolvedParams.tipo] || 'Alerta'} #${resolvedParams.id} - Dashboard`,
        description: 'Detalle de alerta de seguridad'
    };
}

export default async function DetalleAlertaPage({ params }: PageProps) {
    const resolvedParams = await params;
    const { tipo, id } = resolvedParams;

    let alerta: any = null;
    let tipoLabel = '';
    let colorScheme = '';

    try {
        const alertaId = parseInt(id);
        if (isNaN(alertaId)) {
            notFound();
        }

        // Buscar según el tipo
        switch (tipo) {
            case 'tarjeta-stop':
                alerta = await prisma.tarjetaStop.findUnique({
                    where: { id: alertaId },
                    include: {
                        creadoPor: {
                            select: {
                                name: true,
                                username: true,
                                rol: true
                            }
                        },
                        responsableCierre: {
                            select: {
                                name: true,
                                username: true
                            }
                        },
                        caminata: {
                            select: {
                                id: true,
                                codigo: true,
                                zona: true,
                                faena: true,
                                estado: true
                            }
                        }
                    }
                });
                tipoLabel = 'Tarjeta Stop';
                colorScheme = 'red';
                break;

            case 'reporte-peligro':
                alerta = await prisma.reportePeligro.findUnique({
                    where: { id: alertaId },
                    include: {
                        creadoPor: {
                            select: {
                                name: true,
                                username: true,
                                rol: true
                            }
                        },
                        responsableCierre: {
                            select: {
                                name: true,
                                username: true
                            }
                        },
                        responsableVerificacion: {
                            select: {
                                name: true,
                                username: true
                            }
                        },
                        caminata: {
                            select: {
                                id: true,
                                codigo: true,
                                zona: true,
                                faena: true,
                                estado: true
                            }
                        }
                    }
                });
                tipoLabel = 'Reporte de Peligro';
                colorScheme = 'orange';
                break;

            case 'control-art':
                alerta = await prisma.controlCalidadART.findUnique({
                    where: { id: alertaId },
                    include: {
                        creadoPor: {
                            select: {
                                name: true,
                                username: true,
                                rol: true
                            }
                        },
                        caminata: {
                            select: {
                                id: true,
                                codigo: true,
                                zona: true,
                                faena: true,
                                estado: true
                            }
                        }
                    }
                });
                tipoLabel = 'Control de Calidad ART';
                colorScheme = 'blue';
                break;

            default:
                notFound();
        }

        if (!alerta) {
            notFound();
        }

    } catch (error) {
        console.error('Error al cargar alerta:', error);
        notFound();
    }

    const datos = alerta.datos as any || {};
    const imagenes = datos.imagenes || [];

    // Construir timeline events
    const buildTimelineEvents = (): TimelineEvent[] => {
        const events: TimelineEvent[] = [];

        // Evento 1: Creación
        events.push({
            timestamp: alerta.createdAt,
            title: `${tipoLabel} Creada`,
            description: `Se ha creado una nueva ${tipoLabel.toLowerCase()}`,
            user: alerta.creadoPor,
            type: 'creation'
        });

        // Para Tarjetas Stop
        if (tipo === 'tarjeta-stop') {
            // Evento 2: Asignación de responsable de cierre
            if (alerta.responsableCierre) {
                events.push({
                    timestamp: alerta.createdAt,
                    title: 'Responsable de Cierre Asignado',
                    description: `Se asignó a ${alerta.responsableCierre.name || alerta.responsableCierre.username} como responsable de cierre`,
                    user: alerta.creadoPor,
                    type: 'assignment'
                });
            }

            // Evento 3: Cierre
            if (alerta.fechaCierre) {
                events.push({
                    timestamp: new Date(alerta.fechaCierre),
                    title: 'Tarjeta Cerrada',
                    description: 'La tarjeta stop ha sido cerrada',
                    user: alerta.responsableCierre,
                    comment: alerta.comentarioCierre,
                    image: alerta.imagenCierre,
                    status: alerta.estado,
                    type: 'closure'
                });
            }
        }

        // Para Reportes de Peligro
        if (tipo === 'reporte-peligro') {
            // Evento 2: Asignación de responsable de cierre
            if (alerta.responsableCierre) {
                events.push({
                    timestamp: alerta.createdAt,
                    title: 'Responsable de Cierre Asignado',
                    description: `Se asignó a ${alerta.responsableCierre.name || alerta.responsableCierre.username} como responsable de implementar medidas correctivas`,
                    user: alerta.creadoPor,
                    type: 'assignment'
                });
            }

            // Eventos históricos: ciclos anteriores de cierre + devolución
            const datosJson = alerta.datos as any || {};
            const historialDevoluciones: any[] = datosJson.historialDevoluciones || [];

            historialDevoluciones.forEach((dev: any, i: number) => {
                // Cierre anterior del ciclo i
                if (dev.cierreAnterior?.fecha) {
                    events.push({
                        timestamp: new Date(dev.cierreAnterior.fecha),
                        title: `Cierre Realizado (intento ${i + 1})`,
                        description: 'El responsable de cierre implementó las medidas correctivas',
                        user: dev.cierreAnterior.responsableNombre
                            ? { name: dev.cierreAnterior.responsableNombre, username: dev.cierreAnterior.responsableNombre }
                            : alerta.responsableCierre,
                        comment: dev.cierreAnterior.comentario,
                        image: dev.cierreAnterior.imagen,
                        status: 'PENDIENTE_VERIFICACION',
                        type: 'status_change'
                    });
                }

                // Devolución del ciclo i
                events.push({
                    timestamp: new Date(dev.fecha),
                    title: 'Devuelto por Inconformidades',
                    description: 'El verificador devolvió el reporte al responsable de cierre',
                    user: dev.devueltoPorNombre
                        ? { name: dev.devueltoPorNombre, username: dev.devueltoPorNombre }
                        : undefined,
                    comment: dev.motivo,
                    status: 'PENDIENTE',
                    type: 'status_change'
                });
            });

            // Evento: Cierre actual (Pendiente Verificación o Cerrado)
            if (alerta.fechaCierre) {
                const pendienteVerificacionTimestamp = alerta.fechaVerificacion
                    ? new Date(new Date(alerta.fechaVerificacion).getTime() - 60000)
                    : new Date(alerta.fechaCierre);

                events.push({
                    timestamp: pendienteVerificacionTimestamp,
                    title: historialDevoluciones.length > 0
                        ? `Cierre Realizado (intento ${historialDevoluciones.length + 1})`
                        : 'Pendiente Verificación',
                    description: 'El responsable de cierre ha implementado las medidas correctivas',
                    user: alerta.responsableCierre,
                    comment: alerta.comentarioCierre,
                    image: alerta.imagenCierre,
                    status: 'PENDIENTE_VERIFICACION',
                    type: 'status_change'
                });

                // Verificador asignado
                if (alerta.responsableVerificacion) {
                    const asignacionVerificadorTimestamp = new Date(pendienteVerificacionTimestamp.getTime() + 30000);
                    events.push({
                        timestamp: asignacionVerificadorTimestamp,
                        title: 'Verificador Asignado',
                        description: `Se asignó a ${alerta.responsableVerificacion.name || alerta.responsableVerificacion.username} para verificar el cierre`,
                        user: alerta.creadoPor,
                        type: 'assignment'
                    });
                }

                // Verificación realizada
                if (alerta.fechaVerificacion) {
                    events.push({
                        timestamp: new Date(alerta.fechaVerificacion),
                        title: 'Verificación Realizada',
                        description: 'El verificador ha revisado las medidas implementadas',
                        user: alerta.responsableVerificacion,
                        comment: alerta.comentarioVerificacion,
                        image: alerta.imagenVerificacion,
                        status: alerta.estado,
                        type: 'verification'
                    });

                    // Cierre definitivo
                    if (alerta.estado === 'CERRADO') {
                        events.push({
                            timestamp: new Date(new Date(alerta.fechaVerificacion).getTime() + 10000),
                            title: 'Reporte Cerrado',
                            description: 'El reporte de peligro ha sido cerrado exitosamente',
                            user: alerta.responsableVerificacion,
                            status: 'CERRADO',
                            type: 'closure'
                        });
                    }
                }
            }
        }

        // Para Control ART
        if (tipo === 'control-art') {
            events.push({
                timestamp: alerta.createdAt,
                title: 'Control Registrado',
                description: 'Se ha completado el registro del control de calidad ART',
                user: alerta.creadoPor,
                status: 'COMPLETADO',
                type: 'closure'
            });
        }

        return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    };

    const timelineEvents = buildTimelineEvents();

    // Extraer zona y faena de caminata o de datos JSON
    let zona = alerta.caminata?.zona;
    let faena = alerta.caminata?.faena;
    if (!zona && datos.zonas) zona = datos.zonas;
    if (!faena && datos.faenas) faena = datos.faenas;

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleString('es-CL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Función para obtener colores según el esquema
    const getColorClasses = (prefix: string) => {
        const colors: Record<string, Record<string, string>> = {
            red: {
                bg: 'bg-red-50',
                border: 'border-red-200',
                text: 'text-red-900',
                textMuted: 'text-red-600',
                badge: 'bg-red-100 text-red-800'
            },
            orange: {
                bg: 'bg-orange-50',
                border: 'border-orange-200',
                text: 'text-orange-900',
                textMuted: 'text-orange-600',
                badge: 'bg-orange-100 text-orange-800'
            },
            blue: {
                bg: 'bg-blue-50',
                border: 'border-blue-200',
                text: 'text-blue-900',
                textMuted: 'text-blue-600',
                badge: 'bg-blue-100 text-blue-800'
            }
        };
        return colors[colorScheme]?.[prefix] || '';
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Volver al Dashboard
                    </Link>

                    <div className={`${getColorClasses('bg')} ${getColorClasses('border')} border rounded-lg p-6`}>
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className={`text-2xl font-bold ${getColorClasses('text')}`}>
                                        {tipoLabel}
                                    </h1>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getColorClasses('badge')}`}>
                                        ID: {alerta.id}
                                    </span>
                                </div>
                                <div className="space-y-1 text-sm">
                                    <p className={getColorClasses('textMuted')}>
                                        <span className="font-medium">Fecha:</span> {formatDate(alerta.createdAt)}
                                    </p>
                                    <p className={getColorClasses('textMuted')}>
                                        <span className="font-medium">Creado por:</span> {alerta.creadoPor.name || alerta.creadoPor.username}
                                        <span className="ml-2 text-xs">({alerta.creadoPor.rol})</span>
                                    </p>
                                    {alerta.caminata && (
                                        <p className={getColorClasses('textMuted')}>
                                            <span className="font-medium">Caminata:</span>
                                            <Link
                                                href={`/caminatas/${alerta.caminata.id}`}
                                                className="ml-2 font-mono text-xs bg-white px-2 py-1 rounded border hover:bg-gray-50"
                                            >
                                                {alerta.caminata.codigo}
                                            </Link>
                                        </p>
                                    )}
                                    {!alerta.caminata && (
                                        <p className={getColorClasses('textMuted')}>
                                            <span className="font-medium">Tipo:</span> Alerta Independiente (sin caminata asociada)
                                        </p>
                                    )}
                                    {(zona || faena) && (
                                        <p className={getColorClasses('textMuted')}>
                                            <span className="font-medium">Ubicación:</span> {zona || '-'} {faena ? `• ${faena}` : ''}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botón PDF */}
                <div className="flex justify-end mb-4">
                    <AlertaDetailPdfButton
                        tipo={tipo as 'reporte-peligro' | 'tarjeta-stop' | 'control-art'}
                        id={alerta.id}
                    />
                </div>

                {/* Detalles según tipo */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6">
                        {tipo === 'tarjeta-stop' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de la Tarjeta Stop</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Motivo de Aplicación</label>
                                            <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                                <p className="text-gray-900">{datos.motivoAplicacionFinal || datos.motivoAplicacion || '-'}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Causa</label>
                                            <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                                <p className="text-gray-900">{datos.causa || '-'}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Responsable de Cierre</label>
                                            <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                                <p className="text-gray-900">{alerta.responsableCierre ? (alerta.responsableCierre.name || alerta.responsableCierre.username) : '-'}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Tarjeta</label>
                                            <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                                <p className="text-gray-900">
                                                    {datos.fechaTarjeta ? formatDate(new Date(datos.fechaTarjeta)) : '-'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Descripción Detallada</label>
                                    <div className="bg-gray-50 p-4 rounded border border-gray-200">
                                        <p className="text-gray-900 whitespace-pre-wrap">{datos.descripcionDetallada || '-'}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Causal de Detención</label>
                                    <div className="bg-gray-50 p-4 rounded border border-gray-200">
                                        <p className="text-gray-900 whitespace-pre-wrap">{datos.causalDetencion || '-'}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Medida Correctiva</label>
                                    <div className="bg-gray-50 p-4 rounded border border-gray-200">
                                        <p className="text-gray-900 whitespace-pre-wrap">{datos.medidaCorrectiva || '-'}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Solución Implementada</label>
                                    <div className="bg-gray-50 p-4 rounded border border-gray-200">
                                        <p className="text-gray-900 whitespace-pre-wrap">{datos.solucionImplementada || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {tipo === 'reporte-peligro' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Reporte de Peligro</h2>

                                    {/* Grid de campos principales */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Peligro</label>
                                            <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                                <p className="text-gray-900">{datos.tipoPeligro || '-'}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Zonas Afectadas</label>
                                            <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                                <p className="text-gray-900">{datos.zonas || '-'}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Faena</label>
                                            <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                                <p className="text-gray-900">{datos.faena || '-'}</p>
                                            </div>
                                        </div>



                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Actividad</label>
                                            <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                                <p className="text-gray-900">{datos.actividad || '-'}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Tarea</label>
                                            <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                                <p className="text-gray-900">{datos.tarea || '-'}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Responsable de Cierre</label>
                                            <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                                <p className="text-gray-900">{alerta.responsableCierre ? (alerta.responsableCierre.name || alerta.responsableCierre.username) : '-'}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Riesgo</label>
                                            <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                                <p className={`font-semibold ${datos.tipoRiesgo === 'Alto' ? 'text-red-600' :
                                                    datos.tipoRiesgo === 'Medio' ? 'text-yellow-600' :
                                                        datos.tipoRiesgo === 'Bajo' ? 'text-green-600' :
                                                            'text-gray-900'
                                                    }`}>
                                                    {datos.tipoRiesgo || '-'}
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Nivel de Hallazgo</label>
                                            <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                                <p className={`font-semibold ${datos.nivelHallazgo === 'Crítico' ? 'text-red-600' :
                                                    datos.nivelHallazgo === 'Mayor' ? 'text-orange-600' :
                                                        datos.nivelHallazgo === 'Menor' ? 'text-yellow-600' :
                                                            datos.nivelHallazgo === 'Observación' ? 'text-blue-600' :
                                                                'text-gray-900'
                                                    }`}>
                                                    {datos.nivelHallazgo || '-'}
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Plazo de Cierre</label>
                                            <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                                <p className="text-gray-900">
                                                    {datos.plazoCierre ? new Date(datos.plazoCierre).toLocaleDateString('es-CL') : '-'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Campos de texto largo */}
                                {datos.descripcionPeligro || datos.consecuenciaPotencial || datos.medidasSugeridas ? (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Descripción del Peligro</label>
                                            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                                                <p className="text-gray-900 whitespace-pre-wrap">{datos.descripcionPeligro || '-'}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Consecuencia Potencial</label>
                                            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                                                <p className="text-gray-900 whitespace-pre-wrap">{datos.consecuenciaPotencial || '-'}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Medidas Sugeridas</label>
                                            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                                                <p className="text-gray-900 whitespace-pre-wrap">{datos.medidasSugeridas || '-'}</p>
                                            </div>
                                        </div>
                                    </>
                                ) : datos.descripcionDetallada ? (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Descripción Detallada
                                            <span className="ml-2 text-xs text-gray-500">(formato antiguo)</span>
                                        </label>
                                        <div className="bg-gray-50 p-4 rounded border border-gray-200">
                                            <p className="text-gray-900 whitespace-pre-wrap">{datos.descripcionDetallada}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <p className="text-yellow-800 text-sm">No se encontró información detallada del reporte.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {tipo === 'control-art' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Control de Calidad ART</h2>

                                    {/* Información general */}
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-gray-50 p-4 rounded border border-gray-200">
                                            <p className="text-sm text-gray-600 mb-1">Área</p>
                                            <p className="text-gray-900 font-medium">{datos.area || 'N/A'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded border border-gray-200">
                                            <p className="text-sm text-gray-600 mb-1">Tarea/Actividad</p>
                                            <p className="text-gray-900 font-medium">{datos.tareaActividad || 'N/A'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded border border-gray-200">
                                            <p className="text-sm text-gray-600 mb-1">Zona</p>
                                            <p className="text-gray-900 font-medium">{datos.zonas || 'N/A'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded border border-gray-200">
                                            <p className="text-sm text-gray-600 mb-1">Faena</p>
                                            <p className="text-gray-900 font-medium">{datos.faenas || 'N/A'}</p>
                                        </div>
                                    </div>

                                    {/* Items de Control */}
                                    {datos.itemsControl && datos.itemsControl.length > 0 && (() => {
                                        const itemsLabels = [
                                            'El ART-AST es específica para la tarea y no es genérica.',
                                            'Si cambian las condiciones o se incluyen nuevos riesgos, se evalúa nuevamente el ART-AST.',
                                            'Todo el personal involucrado está registrado en el ART-AST.',
                                            'La ART-AST la revisó el líder de la tarea y la firmó debidamente.',
                                            'Se identifican todos los riesgos para controlar la tarea.',
                                            'Los controles identificados en el documento son concordantes con los implementados en terreno.',
                                            'En ART-AST se identifica el procedimiento que aplica a la tarea.',
                                            'Los Controles críticos identificados, son evidenciables en terreno.',
                                            'Están correctamente identificados los controles si existe trabajos SIMULTÁNEOS.',
                                        ];

                                        const itemsCumplidos = datos.itemsControl.filter((item: any) => item.cumple === 'SI').length;
                                        const totalItems = datos.itemsControl.length;
                                        const porcentaje = totalItems > 0 ? Math.round((itemsCumplidos / totalItems) * 100) : 0;

                                        return (
                                            <div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="text-md font-semibold text-gray-900">Items de Control</h3>
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${porcentaje >= 80 ? 'bg-green-100 text-green-800' :
                                                        porcentaje >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                        {itemsCumplidos}/{totalItems} ({porcentaje}%)
                                                    </span>
                                                </div>
                                                <div className="space-y-2">
                                                    {datos.itemsControl.map((item: any, idx: number) => (
                                                        <div key={idx} className="bg-gray-50 p-3 rounded border border-gray-200">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-sm text-gray-900 flex-1 pr-4">
                                                                    <span className="font-medium mr-2">1.{idx + 1}</span>
                                                                    {item.descripcion || itemsLabels[idx] || `Item ${idx + 1}`}
                                                                </span>
                                                                <span className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap ${item.cumple === 'SI' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                                    }`}>
                                                                    {item.cumple}
                                                                </span>
                                                            </div>
                                                            {item.comentario && (
                                                                <div className="text-xs text-gray-600 ml-8 mt-1 italic">
                                                                    Comentario: {item.comentario}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {datos.observaciones && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
                                        <div className="bg-gray-50 p-4 rounded border border-gray-200">
                                            <p className="text-gray-900 whitespace-pre-wrap">{datos.observaciones}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Imágenes */}
                        {imagenes.length > 0 && (
                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Imágenes Adjuntas ({imagenes.length})
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {imagenes.map((imagen: any, idx: number) => (
                                        <div key={idx} className="group">
                                            <a
                                                href={imagen.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block"
                                            >
                                                <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 bg-white group-hover:border-blue-400 transition-colors" style={{ minHeight: '200px' }}>
                                                    <img
                                                        src={imagen.url}
                                                        alt={`Imagen ${idx + 1}`}
                                                        loading="lazy"
                                                        className="w-full h-auto max-h-96 object-contain mx-auto"
                                                        style={{ display: 'block' }}
                                                    />
                                                    <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Click para ampliar
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-600 mt-2 text-center">Imagen {idx + 1}</p>
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Timeline del Proceso */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Timeline del Proceso</h2>
                    <AlertTimeline events={timelineEvents} />
                </div>

                {/* Botón volver */}
                <div className="mt-6 flex justify-end">
                    <Link
                        href="/dashboard"
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Volver al Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
