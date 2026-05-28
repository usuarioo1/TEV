'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import FiltrosTabla from '@/components/dashboard/tabla-actividades/FiltrosTabla';
import HistorialActividadesTabla from '@/components/dashboard/HistorialActividadesTabla';
import type { ActividadRow, TablaFilters } from '@/components/dashboard/tabla-actividades/types';
import { getSantiagoDateKey } from '@/lib/date-chile';


export const dynamic = 'force-dynamic';

interface DashboardMetrics {
    serviciosPorEstado: Record<string, number>;
    serviciosCompletados: {
        hoy: number;
        semana: number;
        mes: number;
        mesAnterior: number;
        crecimiento: number;
    };
    seguridad: {
        porcentajeRiesgosControlados: number;
        totalAnalisisRiesgo: number;
        porcentajeEquiposOk: number;
        totalChecklistEquipo: number;
        conductoresNoAptos: number;
        conductoresReemplazo: number;
        porcentajeConductoresAptos: number;
        totalChecklistFatiga: number;
    };
    alertas: {
        equiposConProblemas: number;
        tractosConProblemas: number;
        serviciosRechazados: number;
        serviciosConAtencion: number;
    };
    tiempos: {
        promedioCicloHoras: number;
        promedioAprobacionMinutos: number;
        totalServiciosAnalizados: number;
    };
    aprobaciones: {
        tasaAprobacion: number;
        totalAprobaciones: number;
        aprobadas: number;
        rechazadas: number;
    };
    aceptacionOperarios: {
        porcentaje: number;
        totalAsignados: number;
        aceptados: number;
        rechazados: number;
    };
    noConformidades: {
        topNC: Array<{
            categoria: string;
            item: string;
            frecuencia: number;
            tipo: 'equipo' | 'tracto';
        }>;
        totalNC: number;
    };
    tendencia: Array<{
        fecha: string;
        completados: number;
    }>;
}

type ActividadTipo = ActividadRow['tipo'];
type EstadoDisplay = 'en_plazo' | 'fuera_plazo' | 'atrasada' | 'proxima';

interface ProgramadaDetail {
    id: number;
    descripcion: string;
    usuario: string;
    fechaProgramada: string | null;
    fechaLimite: string | null;
    estadoDisplay: EstadoDisplay;
    urlDetalle: string | null;
}

interface NoProgramadaDetail {
    id: number;
    descripcion: string;
    usuario: string;
    fecha: string;
    estado: string;
    urlDetalle: string;
}

interface DetalleTipo {
    programadas: ProgramadaDetail[];
    noProgramadas: NoProgramadaDetail[];
}

interface HistorialData {
    rows: ActividadRow[];
    detallePorTipo: {
        caminata: DetalleTipo;
        reporte_peligro: DetalleTipo;
        tarjeta_stop: DetalleTipo;
        control_art: DetalleTipo;
    };
}

interface UnifiedDetailFields {
    detalleTipoRegistro: string;
    detalleEstadoRegistro: string;
    detalleFechaCreacion: string;
    detalleFechaCierre: string;
    detalleFechaVerificacion: string;
    detalleZona: string;
    detalleFaena: string;
    detalleActividad: string;
    detalleTarea: string;
    detalleUbicacion: string;
    detalleTipoPeligro: string;
    detalleTipoRiesgo: string;
    detalleNivelHallazgo: string;
    detalleDescripcionPeligro: string;
    detalleConsecuenciaPotencial: string;
    detalleMedidasSugeridas: string;
    detalleMotivoAplicacion: string;
    detalleCausa: string;
    detalleDescripcionDetallada: string;
    detalleCausalDetencion: string;
    detalleMedidaCorrectiva: string;
    detalleSolucionImplementada: string;
    detalleArea: string;
    detalleTareaActividad: string;
    detalleObservacionesART: string;
    detalleItemsControlTotal: number | string;
    detalleItemsControlCumpleSI: number | string;
    detalleItemsControlCumpleNO: number | string;
    detalleItemsControlCumplimientoPct: number | string;
    detalleResponsableCierre: string;
    detalleResponsableVerificacion: string;
    detalleComentarioCierre: string;
    detalleComentarioVerificacion: string;
}

const EMPTY_DETAIL_FIELDS: UnifiedDetailFields = {
    detalleTipoRegistro: '',
    detalleEstadoRegistro: '',
    detalleFechaCreacion: '',
    detalleFechaCierre: '',
    detalleFechaVerificacion: '',
    detalleZona: '',
    detalleFaena: '',
    detalleActividad: '',
    detalleTarea: '',
    detalleUbicacion: '',
    detalleTipoPeligro: '',
    detalleTipoRiesgo: '',
    detalleNivelHallazgo: '',
    detalleDescripcionPeligro: '',
    detalleConsecuenciaPotencial: '',
    detalleMedidasSugeridas: '',
    detalleMotivoAplicacion: '',
    detalleCausa: '',
    detalleDescripcionDetallada: '',
    detalleCausalDetencion: '',
    detalleMedidaCorrectiva: '',
    detalleSolucionImplementada: '',
    detalleArea: '',
    detalleTareaActividad: '',
    detalleObservacionesART: '',
    detalleItemsControlTotal: '',
    detalleItemsControlCumpleSI: '',
    detalleItemsControlCumpleNO: '',
    detalleItemsControlCumplimientoPct: '',
    detalleResponsableCierre: '',
    detalleResponsableVerificacion: '',
    detalleComentarioCierre: '',
    detalleComentarioVerificacion: '',
};

const TIPO_LABEL: Record<ActividadTipo, string> = {
    caminata: 'Caminata de Seguridad',
    reporte_peligro: 'Reporte de Peligro',
    tarjeta_stop: 'Tarjeta Alto/Stop',
    control_art: 'Control de Calidad ART',
};

const ESTADO_DISPLAY_LABEL: Record<EstadoDisplay, string> = {
    en_plazo: 'Cumplida en plazo',
    fuera_plazo: 'Cumplida fuera de plazo',
    atrasada: 'Atrasada',
    proxima: 'Proxima',
};

const TIPOS_ACTIVIDAD: ActividadTipo[] = [
    'caminata',
    'reporte_peligro',
    'tarjeta_stop',
    'control_art',
];

const UNIFIED_EXPORT_ACTIVITY_COLUMNS = [
    'tipoActividad',
    'tipoActividadCodigo',
    'categoriaActividad',
    'idActividad',
    'descripcionActividad',
    'usuarioActividad',
    'estadoActividad',
    'fechaProgramada',
    'fechaLimite',
    'fechaRegistro',
] as const;

const UNIFIED_EXPORT_METRIC_COLUMNS = [
    'totalProgramadasTipo',
    'totalNoProgramadasTipo',
    'totalActividadesTipo',
    'cumplimientoProgramadasPct',
    'cumplimientoTotalPct',
] as const;

const UNIFIED_EXPORT_DETAIL_COLUMNS = [
    'detalleTipoRegistro',
    'detalleEstadoRegistro',
    'detalleFechaCreacion',
    'detalleFechaCierre',
    'detalleFechaVerificacion',
    'detalleZona',
    'detalleFaena',
    'detalleActividad',
    'detalleTarea',
    'detalleUbicacion',
    'detalleTipoPeligro',
    'detalleTipoRiesgo',
    'detalleNivelHallazgo',
    'detalleDescripcionPeligro',
    'detalleConsecuenciaPotencial',
    'detalleMedidasSugeridas',
    'detalleMotivoAplicacion',
    'detalleCausa',
    'detalleDescripcionDetallada',
    'detalleCausalDetencion',
    'detalleMedidaCorrectiva',
    'detalleSolucionImplementada',
    'detalleArea',
    'detalleTareaActividad',
    'detalleObservacionesART',
    'detalleItemsControlTotal',
    'detalleItemsControlCumpleSI',
    'detalleItemsControlCumpleNO',
    'detalleItemsControlCumplimientoPct',
    'detalleResponsableCierre',
    'detalleResponsableVerificacion',
    'detalleComentarioCierre',
    'detalleComentarioVerificacion',
] as const;

const UNIFIED_EXPORT_COLUMNS = [
    ...UNIFIED_EXPORT_ACTIVITY_COLUMNS,
    ...UNIFIED_EXPORT_METRIC_COLUMNS,
    ...UNIFIED_EXPORT_DETAIL_COLUMNS,
] as const;

function formatDateCell(value: string | Date | null | undefined) {
    if (!value) return '';
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'America/Santiago',
    });
}

function formatScheduledDateCell(value: string | Date | null | undefined) {
    if (!value) return '';
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'UTC',
    });
}

function normalizeFileNamePart(value: string) {
    return (
        value
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 50) || 'sin-dato'
    );
}

function toApiAlertaPathFromDashboardUrl(url: string | null | undefined) {
    if (!url || !url.startsWith('/dashboard/alertas/')) return null;
    const parts = url.split('/').filter(Boolean);
    if (parts.length !== 4) return null;
    const tipo = parts[2];
    const id = parts[3];
    if (!tipo || !id) return null;
    return `/api/alertas/${tipo}/${id}`;
}

function asText(value: unknown) {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
}

function buildColumnWidths(rows: Record<string, unknown>[]) {
    if (rows.length === 0) return [];
    const headers = Object.keys(rows[0]);

    return headers.map((header) => {
        let maxLen = header.length;
        for (const row of rows) {
            const value = row[header];
            const valueLen = String(value ?? '').length;
            if (valueLen > maxLen) maxLen = valueLen;
        }
        return { wch: Math.min(Math.max(maxLen + 2, 12), 64) };
    });
}

function orderUnifiedExportRow(row: Record<string, unknown>) {
    const ordered: Record<string, unknown> = {};
    for (const col of UNIFIED_EXPORT_COLUMNS) {
        ordered[col] = row[col] ?? '';
    }
    return ordered;
}

function mapAlertaToDetailFields(payload: any): UnifiedDetailFields {
    const alerta = payload?.alerta;
    const tipoRegistro = asText(payload?.tipo);
    if (!alerta || typeof alerta !== 'object') {
        return { ...EMPTY_DETAIL_FIELDS, detalleTipoRegistro: tipoRegistro };
    }

    const datos = alerta.datos && typeof alerta.datos === 'object' ? alerta.datos : {};
    const itemsControl = Array.isArray(datos.itemsControl) ? datos.itemsControl : [];
    const itemsCumpleSI = itemsControl.filter((item: any) => item?.cumple === 'SI').length;
    const itemsCumpleNO = itemsControl.filter((item: any) => item?.cumple === 'NO').length;
    const itemsTotal = itemsControl.length;
    const itemsCumplimiento =
        itemsTotal > 0 ? Math.round((itemsCumpleSI / itemsTotal) * 100) : '';

    const responsableCierre = alerta.responsableCierre
        ? asText(alerta.responsableCierre.name) || asText(alerta.responsableCierre.username)
        : '';
    const responsableVerificacion = alerta.responsableVerificacion
        ? asText(alerta.responsableVerificacion.name) || asText(alerta.responsableVerificacion.username)
        : '';

    return {
        detalleTipoRegistro: tipoRegistro,
        detalleEstadoRegistro: asText(alerta.estado),
        detalleFechaCreacion: formatDateCell(alerta.createdAt),
        detalleFechaCierre: formatDateCell(alerta.fechaCierre),
        detalleFechaVerificacion: formatDateCell(alerta.fechaVerificacion),
        detalleZona: asText(alerta?.caminata?.zona) || asText(datos.zonas) || asText(datos.zona),
        detalleFaena: asText(alerta?.caminata?.faena) || asText(datos.faenas) || asText(datos.faena),
        detalleActividad: asText(datos.actividad),
        detalleTarea: asText(datos.tarea),
        detalleUbicacion: asText(datos.ubicacion),
        detalleTipoPeligro: asText(datos.tipoPeligro),
        detalleTipoRiesgo: asText(datos.tipoRiesgo),
        detalleNivelHallazgo: asText(datos.nivelHallazgo),
        detalleDescripcionPeligro: asText(datos.descripcionPeligro),
        detalleConsecuenciaPotencial: asText(datos.consecuenciaPotencial),
        detalleMedidasSugeridas: asText(datos.medidasSugeridas),
        detalleMotivoAplicacion: asText(datos.motivoAplicacionFinal) || asText(datos.motivoAplicacion),
        detalleCausa: asText(datos.causa),
        detalleDescripcionDetallada: asText(datos.descripcionDetallada),
        detalleCausalDetencion: asText(datos.causalDetencion),
        detalleMedidaCorrectiva: asText(datos.medidaCorrectiva),
        detalleSolucionImplementada: asText(datos.solucionImplementada),
        detalleArea: asText(datos.area),
        detalleTareaActividad: asText(datos.tareaActividad),
        detalleObservacionesART: asText(datos.observaciones),
        detalleItemsControlTotal: itemsTotal || '',
        detalleItemsControlCumpleSI: itemsCumpleSI || '',
        detalleItemsControlCumpleNO: itemsCumpleNO || '',
        detalleItemsControlCumplimientoPct: itemsCumplimiento,
        detalleResponsableCierre: responsableCierre,
        detalleResponsableVerificacion: responsableVerificacion,
        detalleComentarioCierre: asText(alerta.comentarioCierre),
        detalleComentarioVerificacion: asText(alerta.comentarioVerificacion),
    };
}

interface FlatProgramada {
    tipo: ActividadTipo;
    categoria: 'PROGRAMADA';
    item: ProgramadaDetail;
}

interface FlatNoProgramada {
    tipo: ActividadTipo;
    categoria: 'NO_PROGRAMADA';
    item: NoProgramadaDetail;
}

type FlatItem = FlatProgramada | FlatNoProgramada;

export default function DashboardPage() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [exportingUnifiedExcel, setExportingUnifiedExcel] = useState(false);
    const [sharedFilters, setSharedFilters] = useState<TablaFilters>({
        fechaInicio: '',
        fechaFin: '',
        userId: '',
    });

    const fetchMetrics = useCallback(async () => {
        try {
            const url = '/api/dashboard/metrics';
            const response = await fetch(url);
            if (!response.ok) throw new Error('Error al cargar métricas');
            const data = await response.json();
            setMetrics(data);
            setError(null);
        } catch (err) {
            setError('Error al cargar el dashboard');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMetrics();
        // Actualizar cada 30 segundos
        const interval = setInterval(fetchMetrics, 120000); // 2 minutos
        return () => clearInterval(interval);
    }, [fetchMetrics]);

    const handleExportUnifiedExcel = useCallback(async () => {
        setExportingUnifiedExcel(true);
        try {
            const params = new URLSearchParams();
            if (sharedFilters.fechaInicio) params.set('fechaInicio', sharedFilters.fechaInicio);
            if (sharedFilters.fechaFin) params.set('fechaFin', sharedFilters.fechaFin);
            if (sharedFilters.userId) params.set('userId', sharedFilters.userId);

            const historialRes = await fetch(`/api/dashboard/tabla-actividades?${params.toString()}`);
            const historialData: HistorialData = await historialRes.json();

            if (!historialRes.ok) {
                throw new Error((historialData as any)?.error || 'No se pudo cargar el historial');
            }

            const detailByTipo = historialData.detallePorTipo;
            const flatItems: FlatItem[] = [];

            for (const tipo of TIPOS_ACTIVIDAD) {
                const detalle = detailByTipo?.[tipo];
                if (!detalle) continue;

                for (const programada of detalle.programadas ?? []) {
                    flatItems.push({ tipo, categoria: 'PROGRAMADA', item: programada });
                }

                for (const noProgramada of detalle.noProgramadas ?? []) {
                    flatItems.push({ tipo, categoria: 'NO_PROGRAMADA', item: noProgramada });
                }
            }

            if (flatItems.length === 0) {
                window.alert('No hay actividades para exportar con los filtros seleccionados.');
                return;
            }

            const rowByTipo = new Map<ActividadTipo, ActividadRow>();
            for (const row of historialData.rows ?? []) {
                rowByTipo.set(row.tipo, row);
            }

            const alertDetailUrls = [
                ...new Set(
                    flatItems
                        .map((entry) => entry.item.urlDetalle)
                        .filter((url): url is string => Boolean(toApiAlertaPathFromDashboardUrl(url))),
                ),
            ];

            const detailByUrl = new Map<string, UnifiedDetailFields>();

            await Promise.all(
                alertDetailUrls.map(async (url) => {
                    const apiPath = toApiAlertaPathFromDashboardUrl(url);
                    if (!apiPath) return;

                    try {
                        const detailRes = await fetch(apiPath);
                        if (!detailRes.ok) {
                            detailByUrl.set(url, { ...EMPTY_DETAIL_FIELDS });
                            return;
                        }

                        const detailJson = await detailRes.json();
                        detailByUrl.set(url, mapAlertaToDetailFields(detailJson));
                    } catch {
                        detailByUrl.set(url, { ...EMPTY_DETAIL_FIELDS });
                    }
                }),
            );

            const exportedRows = flatItems.map((entry) => {
                const rowAgg = rowByTipo.get(entry.tipo);
                const isProgramada = entry.categoria === 'PROGRAMADA';
                const idActividad = entry.item.id;
                const descripcion = entry.item.descripcion;
                const usuario = entry.item.usuario;
                const urlDetalle = entry.item.urlDetalle || '';
                const detailFields = detailByUrl.get(urlDetalle) || { ...EMPTY_DETAIL_FIELDS };

                let estadoActividad = '';
                let fechaProgramada = '';
                let fechaLimite = '';
                let fechaRegistro = '';

                if (isProgramada) {
                    const item = entry.item as ProgramadaDetail;
                    estadoActividad = ESTADO_DISPLAY_LABEL[item.estadoDisplay] || item.estadoDisplay;
                    fechaProgramada = formatScheduledDateCell(item.fechaProgramada);
                    fechaLimite = formatScheduledDateCell(item.fechaLimite);
                } else {
                    const item = entry.item as NoProgramadaDetail;
                    estadoActividad = item.estado;
                    fechaRegistro = formatDateCell(item.fecha);
                }

                return {
                    tipoActividad: TIPO_LABEL[entry.tipo],
                    tipoActividadCodigo: entry.tipo,
                    categoriaActividad: isProgramada ? 'Programada' : 'No Programada',
                    idActividad,
                    descripcionActividad: descripcion,
                    usuarioActividad: usuario,
                    estadoActividad,
                    fechaProgramada,
                    fechaLimite,
                    fechaRegistro,
                    totalProgramadasTipo: rowAgg?.totalProgramadas ?? '',
                    totalNoProgramadasTipo: rowAgg?.actividadesCumplidas ?? '',
                    totalActividadesTipo: rowAgg?.totalActividades ?? '',
                    cumplimientoProgramadasPct: rowAgg?.cumplimiento ?? '',
                    cumplimientoTotalPct: rowAgg?.estadoCumplimientoTotal ?? '',
                    ...detailFields,
                };
            });

            const orderedRows = exportedRows.map(orderUnifiedExportRow);

            const XLSX = await import('xlsx');
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(orderedRows);

            if (worksheet['!ref']) {
                worksheet['!autofilter'] = { ref: worksheet['!ref'] };
            }

            worksheet['!cols'] = buildColumnWidths(orderedRows);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Planilla de actividades');

            const hoy = getSantiagoDateKey(new Date());
            const desde = sharedFilters.fechaInicio || 'sin-inicio';
            const hasta = sharedFilters.fechaFin || 'sin-fin';
            const usuario = normalizeFileNamePart(sharedFilters.userId || 'todos');
            const filename = `historial-unificado-${desde}_a_${hasta}-${usuario}-${hoy}.xlsx`;

            XLSX.writeFile(workbook, filename);
        } catch (err) {
            console.error('Error exportando historial unificado:', err);
            window.alert('No se pudo exportar el Excel unificado. Intenta nuevamente.');
        } finally {
            setExportingUnifiedExcel(false);
        }
    }, [sharedFilters]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando dashboard...</p>
                </div>
            </div>
        );
    }

    if (error || !metrics) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={fetchMetrics}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <DashboardHeader />

                {/* Botones de navegación a módulos */}
                <div className="mb-6 flex flex-wrap justify-end gap-3">
                    <button
                        onClick={handleExportUnifiedExcel}
                        disabled={exportingUnifiedExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M4 17v1a2 2 0 002 2h12a2 2 0 002-2v-1" />
                        </svg>
                        {exportingUnifiedExcel ? 'Exportando unificado...' : 'Excel Unificado (1 hoja)'}
                    </button>
                    <Link
                        href="/dashboard/gestion-desempeno"
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm font-medium"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Ir a Dashboard módulo de seguridad
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>

                {/* Filtros compartidos entre Tabla e Historial */}
                <div className="mb-4 bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Filtros (aplican al Historial de Actividades)</p>
                    <FiltrosTabla
                        filters={sharedFilters}
                        onChange={setSharedFilters}
                        canFilterByUser={true}
                    />
                </div>

                {/* Historial de Actividades */}
                <div className="mb-8">
                    <HistorialActividadesTabla
                        canFilterByUser={true}
                        filters={sharedFilters}
                    />
                </div>


            </div>
        </div>
    );
}
