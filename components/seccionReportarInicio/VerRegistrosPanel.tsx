'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import FiltersBar from './FiltersBar';
import GroupedSection from './GroupedSection';
import StatusBadge from './StatusBadge';
import { exportRecordPdf } from './pdfExport';
import type { AlertasSeguridadResponse, CaminataItem } from './types';

interface VerRegistrosPanelProps {
    open: boolean;
    onClose: () => void;
}

interface DetailState {
    tipo: 'reporte' | 'art';
    item: any;
}

function EmptyRow({ text }: { text: string }) {
    return <div className="px-4 py-6 text-sm text-gray-400 text-center">{text}</div>;
}

export default function VerRegistrosPanel({ open, onClose }: VerRegistrosPanelProps) {
    const [loading, setLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState<string | null>(null);
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [alertas, setAlertas] = useState<AlertasSeguridadResponse | null>(null);
    const [caminatas, setCaminatas] = useState<CaminataItem[]>([]);
    const [detail, setDetail] = useState<DetailState | null>(null);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        Promise.all([
            fetch('/api/dashboard/alertas-seguridad').then((r) => (r.ok ? r.json() : null)),
            fetch('/api/caminatas').then((r) => (r.ok ? r.json() : [])),
        ])
            .then(([alertasData, caminatasData]) => {
                if (alertasData) setAlertas(alertasData);
                setCaminatas(Array.isArray(caminatasData) ? caminatasData : []);
            })
            .finally(() => setLoading(false));
    }, [open]);

    const dateMatch = useCallback(
        (rawDate?: string) => {
            if (!rawDate) return true;
            const value = new Date(rawDate);
            if (fechaDesde && value < new Date(fechaDesde)) return false;
            if (fechaHasta && value > new Date(new Date(fechaHasta).setHours(23, 59, 59, 999))) return false;
            return true;
        },
        [fechaDesde, fechaHasta]
    );

    const reportes = useMemo(
        () =>
            [
                ...(alertas?.reportesPendientes || []),
                ...(alertas?.reportesEnRevision || []),
                ...(alertas?.reportesPendientesVerificacion || []),
                ...(alertas?.reportesCerrados || []),
            ].filter((item) => dateMatch(item.fecha)),
        [alertas, dateMatch]
    );

    const tarjetas = useMemo(() => (alertas?.tarjetasStop || []).filter((item) => dateMatch(item.fecha)), [alertas, dateMatch]);
    const arts = useMemo(() => (alertas?.controlesART || []).filter((item) => dateMatch(item.fecha)), [alertas, dateMatch]);
    const caminatasFiltered = useMemo(() => caminatas.filter((item) => dateMatch(item.fechaCreacion)), [caminatas, dateMatch]);

    const handleExport = useCallback(async (tipo: 'reporte' | 'tarjeta' | 'art' | 'caminata', record: any) => {
        const key = `${tipo}-${record.id}`;
        setPdfLoading(key);
        try {
            await exportRecordPdf(record, tipo);
        } finally {
            setPdfLoading(null);
        }
    }, []);

    const renderPdfButton = (key: string, onClick: () => void) => (
        <button
            onClick={onClick}
            disabled={pdfLoading === key}
            className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-200 disabled:opacity-50"
        >
            {pdfLoading === key ? 'Generando...' : 'PDF'}
        </button>
    );

    const formatDateTime = (value?: string) => {
        if (!value) return 'N/A';
        return new Date(value).toLocaleString('es-CL', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}>
            <div
                onClick={onClose}
                className={`absolute inset-0 bg-black/50 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
            />

            <aside
                className={`absolute top-0 right-0 h-full w-full max-w-5xl bg-gray-50 shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'
                    } flex flex-col`}
            >
                <div className="px-6 py-4 border-b bg-white flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Vista General por Secciones</h3>
                        <p className="text-xs text-gray-500">Reportes, Tarjetas, ART y Caminatas con exportacion PDF individual</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <FiltersBar
                    fechaDesde={fechaDesde}
                    fechaHasta={fechaHasta}
                    onChangeDesde={setFechaDesde}
                    onChangeHasta={setFechaHasta}
                    onReset={() => {
                        setFechaDesde('');
                        setFechaHasta('');
                    }}
                />

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <div className="h-8 w-8 rounded-full border-b-2 border-cyan-600 animate-spin" />
                        </div>
                    ) : (
                        <>
                            <GroupedSection title="Reportes de Peligro (todos los estados)" icon="⚠️" count={reportes.length}>
                                {reportes.length === 0 ? (
                                    <EmptyRow text="Sin reportes" />
                                ) : (
                                    reportes.map((item) => (
                                        <div key={`reporte-${item.id}`} className="px-4 py-3 flex items-center gap-3 hover:bg-orange-50/30">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <StatusBadge estado={item.estado} />
                                                    <span className="text-xs text-gray-400">#{item.id}</span>
                                                </div>
                                                <p className="text-sm font-medium text-gray-900 truncate">{item.datos?.tipoPeligro || 'Reporte de Peligro'}</p>
                                                <p className="text-xs text-gray-500 truncate">{item.caminata?.zona || item.datos?.zonas || 'Sin zona'} · {item.creadoPor}</p>
                                            </div>
                                            <button
                                                onClick={() => setDetail({ tipo: 'reporte', item })}
                                                className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                                            >
                                                Ver detalle
                                            </button>
                                            {renderPdfButton(`reporte-${item.id}`, () => handleExport('reporte', item))}
                                        </div>
                                    ))
                                )}
                            </GroupedSection>

                            <GroupedSection title="Tarjetas Alto/Stop" icon="🛑" count={tarjetas.length}>
                                {tarjetas.length === 0 ? (
                                    <EmptyRow text="Sin tarjetas" />
                                ) : (
                                    tarjetas.map((item) => (
                                        <div key={`tarjeta-${item.id}`} className="px-4 py-3 flex items-center gap-3 hover:bg-red-50/30">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <StatusBadge estado={item.estado} />
                                                    <span className="text-xs text-gray-400">#{item.id}</span>
                                                </div>
                                                <p className="text-sm font-medium text-gray-900 truncate">{item.datos?.causa || 'Tarjeta Alto/Stop'}</p>
                                                <p className="text-xs text-gray-500 truncate">{item.caminata?.zona || item.datos?.zonas || 'Sin zona'} · {item.creadoPor}</p>
                                            </div>
                                            {renderPdfButton(`tarjeta-${item.id}`, () => handleExport('tarjeta', item))}
                                        </div>
                                    ))
                                )}
                            </GroupedSection>

                            <GroupedSection title="Controles ART" icon="📋" count={arts.length}>
                                {arts.length === 0 ? (
                                    <EmptyRow text="Sin controles ART" />
                                ) : (
                                    arts.map((item) => (
                                        <div key={`art-${item.id}`} className="px-4 py-3 flex items-center gap-3 hover:bg-cyan-50/30">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">Control ART #{item.id}</p>
                                                <p className="text-xs text-gray-500 truncate">{item.caminata?.zona || item.datos?.zonas || 'Sin zona'} · {item.creadoPor}</p>
                                            </div>
                                            <button
                                                onClick={() => setDetail({ tipo: 'art', item })}
                                                className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                                            >
                                                Ver detalle
                                            </button>
                                            {renderPdfButton(`art-${item.id}`, () => handleExport('art', item))}
                                        </div>
                                    ))
                                )}
                            </GroupedSection>

                            <GroupedSection title="Caminatas de Seguridad" icon="🚶" count={caminatasFiltered.length}>
                                {caminatasFiltered.length === 0 ? (
                                    <EmptyRow text="Sin caminatas" />
                                ) : (
                                    caminatasFiltered.map((item) => (
                                        <div key={`caminata-${item.id}`} className="px-4 py-3 flex items-center gap-3 hover:bg-teal-50/30">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <StatusBadge estado={item.estado} />
                                                    <span className="text-xs text-gray-400">#{item.id}</span>
                                                </div>
                                                <p className="text-sm font-medium text-gray-900 truncate">{item.codigo} - {item.zona}</p>
                                                <p className="text-xs text-gray-500 truncate">{item.faena} · {item._count?.reportesPeligro || 0} reportes · {item._count?.tarjetasStop || 0} tarjetas</p>
                                            </div>
                                            {renderPdfButton(`caminata-${item.id}`, () => handleExport('caminata', item))}
                                        </div>
                                    ))
                                )}
                            </GroupedSection>
                        </>
                    )}
                </div>
            </aside>

            {detail && (
                <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    {detail.tipo === 'reporte' ? 'Detalle Completo: Reporte de Peligro' : 'Detalle Completo: Control ART'}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">ID #{detail.item.id}</p>
                            </div>
                            <button onClick={() => setDetail(null)} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {detail.tipo === 'reporte' ? (
                            <div className="p-6 space-y-5">
                                <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-orange-900 mb-3">Informacion General</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                        <div><p className="text-gray-500">Tipo de Peligro</p><p className="font-semibold text-gray-900">{detail.item.datos?.tipoPeligro || 'N/A'}</p></div>
                                        <div><p className="text-gray-500">Zona</p><p className="font-semibold text-gray-900">{detail.item.datos?.zonas || detail.item.caminata?.zona || 'N/A'}</p></div>
                                        <div><p className="text-gray-500">Faena</p><p className="font-semibold text-gray-900">{detail.item.datos?.faena || detail.item.caminata?.faena || 'N/A'}</p></div>
                                        <div><p className="text-gray-500">Ubicacion</p><p className="font-semibold text-gray-900">{detail.item.datos?.ubicacion || 'N/A'}</p></div>
                                        <div><p className="text-gray-500">Actividad</p><p className="font-semibold text-gray-900">{detail.item.datos?.actividad || 'N/A'}</p></div>
                                        <div><p className="text-gray-500">Tarea</p><p className="font-semibold text-gray-900">{detail.item.datos?.tarea || 'N/A'}</p></div>
                                        <div><p className="text-gray-500">Estado</p><p className="font-semibold text-gray-900">{detail.item.estado || 'N/A'}</p></div>
                                        <div><p className="text-gray-500">Creado por</p><p className="font-semibold text-gray-900">{detail.item.creadoPor || 'N/A'}</p></div>
                                        <div><p className="text-gray-500">Fecha</p><p className="font-semibold text-gray-900">{formatDateTime(detail.item.fecha)}</p></div>
                                    </div>
                                </div>

                                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-red-900 mb-3">Clasificacion del Riesgo</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                        <div><p className="text-gray-500">Tipo de Riesgo</p><p className="font-semibold text-gray-900">{detail.item.datos?.tipoRiesgo || 'N/A'}</p></div>
                                        <div><p className="text-gray-500">Nivel Hallazgo</p><p className="font-semibold text-gray-900">{detail.item.datos?.nivelHallazgo || 'N/A'}</p></div>
                                        <div><p className="text-gray-500">Plazo Cierre</p><p className="font-semibold text-gray-900">{detail.item.datos?.plazoCierre || 'N/A'}</p></div>
                                    </div>
                                </div>

                                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-blue-900 mb-3">Descripciones</h4>
                                    <div className="space-y-2 text-xs">
                                        <div><p className="text-gray-500">Descripcion del Peligro</p><p className="bg-white border rounded p-2 text-gray-900">{detail.item.datos?.descripcionPeligro || detail.item.datos?.descripcion || 'N/A'}</p></div>
                                        <div><p className="text-gray-500">Consecuencia Potencial</p><p className="bg-white border rounded p-2 text-gray-900">{detail.item.datos?.consecuenciaPotencial || 'N/A'}</p></div>
                                        <div><p className="text-gray-500">Medidas Sugeridas</p><p className="bg-white border rounded p-2 text-gray-900">{detail.item.datos?.medidasSugeridas || 'N/A'}</p></div>
                                    </div>
                                </div>

                                <div className="border-t pt-5">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Timeline</h4>
                                    <div className="relative pl-6 space-y-3">
                                        <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-300" />

                                        <div className="relative">
                                            <div className="absolute -left-2 w-5 h-5 bg-blue-500 rounded-full ring-2 ring-white" />
                                            <div className="bg-blue-50 border-l-2 border-blue-500 rounded p-2 text-xs">
                                                <p className="font-semibold text-blue-900">Creado</p>
                                                <p className="text-gray-700">Por: {detail.item.creadoPor || 'N/A'}</p>
                                                <p className="text-gray-500">{formatDateTime(detail.item.fecha)}</p>
                                            </div>
                                        </div>

                                        {detail.item.datos?._completadoPorId && (
                                            <div className="relative">
                                                <div className="absolute -left-2 w-5 h-5 bg-purple-500 rounded-full ring-2 ring-white" />
                                                <div className="bg-purple-50 border-l-2 border-purple-500 rounded p-2 text-xs">
                                                    <p className="font-semibold text-purple-900">Completado desde tarea</p>
                                                    <p className="text-gray-700">Por: {detail.item.datos?._completadoPorNombre || 'N/A'}</p>
                                                </div>
                                            </div>
                                        )}

                                        {detail.item.responsableCierre && (
                                            <div className="relative">
                                                <div className="absolute -left-2 w-5 h-5 bg-orange-500 rounded-full ring-2 ring-white" />
                                                <div className="bg-orange-50 border-l-2 border-orange-500 rounded p-2 text-xs">
                                                    <p className="font-semibold text-orange-900">Asignado para cierre</p>
                                                    <p className="text-gray-700">Responsable: {detail.item.responsableCierre}</p>
                                                </div>
                                            </div>
                                        )}

                                        {detail.item.fechaCierre && (
                                            <div className="relative">
                                                <div className="absolute -left-2 w-5 h-5 bg-green-500 rounded-full ring-2 ring-white" />
                                                <div className="bg-green-50 border-l-2 border-green-500 rounded p-2 text-xs">
                                                    <p className="font-semibold text-green-900">Cierre realizado</p>
                                                    <p className="text-gray-700">{detail.item.comentarioCierre || 'Sin comentario'}</p>
                                                    <p className="text-gray-500">{formatDateTime(detail.item.fechaCierre)}</p>
                                                </div>
                                            </div>
                                        )}

                                        {detail.item.fechaVerificacion && (
                                            <div className="relative">
                                                <div className="absolute -left-2 w-5 h-5 bg-emerald-600 rounded-full ring-2 ring-white" />
                                                <div className="bg-emerald-50 border-l-2 border-emerald-600 rounded p-2 text-xs">
                                                    <p className="font-semibold text-emerald-900">Verificado y cerrado</p>
                                                    <p className="text-gray-700">Responsable: {detail.item.responsableVerificacion || 'N/A'}</p>
                                                    <p className="text-gray-700">{detail.item.comentarioVerificacion || 'Sin comentario'}</p>
                                                    <p className="text-gray-500">{formatDateTime(detail.item.fechaVerificacion)}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 space-y-4">
                                <div className="bg-cyan-50 border-l-4 border-cyan-500 rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-cyan-900 mb-3">Informacion General del Control ART</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                        <div><p className="text-gray-500">ID</p><p className="font-semibold text-gray-900">#{detail.item.id}</p></div>
                                        <div><p className="text-gray-500">Fecha</p><p className="font-semibold text-gray-900">{formatDateTime(detail.item.fecha)}</p></div>
                                        <div><p className="text-gray-500">Creado por</p><p className="font-semibold text-gray-900">{detail.item.creadoPor || 'N/A'}</p></div>
                                        <div><p className="text-gray-500">Zona</p><p className="font-semibold text-gray-900">{detail.item.caminata?.zona || detail.item.datos?.zonas || 'N/A'}</p></div>
                                        <div><p className="text-gray-500">Faena</p><p className="font-semibold text-gray-900">{detail.item.caminata?.faena || detail.item.datos?.faena || 'N/A'}</p></div>
                                        <div><p className="text-gray-500">Caminata</p><p className="font-semibold text-gray-900">{detail.item.caminata?.codigo || 'Sin caminata asociada'}</p></div>
                                    </div>
                                </div>

                                <div className="bg-white border rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Campos del formulario ART</h4>
                                    {detail.item.datos && typeof detail.item.datos === 'object' ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                            {Object.entries(detail.item.datos).map(([key, value]) => (
                                                <div key={key} className="border rounded p-2 bg-gray-50">
                                                    <p className="text-gray-500 mb-1">{key}</p>
                                                    <p className="text-gray-900 break-words">
                                                        {typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
                                                            ? String(value)
                                                            : JSON.stringify(value)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400">Sin datos detallados</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
