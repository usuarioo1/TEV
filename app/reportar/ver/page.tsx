'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '@/app/context/SessionContext';
import StatusBadge from '@/components/seccionReportarInicio/StatusBadge';
import { exportDetailPdf } from '@/components/seccionReportarInicio/pdfExport';
import type { AlertasSeguridadResponse, AlertaItem } from '@/components/seccionReportarInicio/types';



export default function VerReportesPage() {
    const router = useRouter();
    const { session, loading: sessionLoading } = useSession();

    const [loading, setLoading] = useState(true);
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'reporte' | 'tarjeta' | 'art'>('todos');
    const [data, setData] = useState<AlertasSeguridadResponse | null>(null);
    const [pdfLoading, setPdfLoading] = useState<string | null>(null);

    useEffect(() => {
        if (sessionLoading) return;
        if (!session) {
            router.push('/login');
            return;
        }
        if (session.rol !== 'jefaturas' && session.rol !== 'prevencionista') {
            router.push('/unauthorized');
            return;
        }
    }, [session, sessionLoading, router]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (fechaDesde) params.set('fechaInicio', fechaDesde);
            if (fechaHasta) params.set('fechaFin', fechaHasta);
            const query = params.toString();
            const response = await fetch(`/api/dashboard/alertas-seguridad${query ? `?${query}` : ''}`);
            if (response.ok) {
                const payload = await response.json();
                setData(payload);
            }
        } catch (error) {
            console.error('Error cargando vista de reportes:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!session || (session.rol !== 'jefaturas' && session.rol !== 'prevencionista')) return;
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, fechaDesde, fechaHasta]);

    const reportesCompletadosOCerrados = useMemo(
        () => [
            ...(data?.reportesPendientesVerificacion || []),
            ...(data?.reportesCerrados || []),
        ],
        [data]
    );

    const controlesArt = useMemo(() => data?.controlesART || [], [data]);
    const tarjetasCerradas = useMemo(
        () => (data?.tarjetasStop || []).filter((item) => item.estado === 'CERRADO'),
        [data]
    );

    const formatDateTime = (value?: string | null) => {
        if (!value) return 'N/A';
        return new Date(value).toLocaleString('es-CL', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const onExport = async (tipo: 'reporte' | 'tarjeta' | 'art', item: AlertaItem) => {
        const key = `${tipo}-${item.id}`;
        setPdfLoading(key);
        try {
            const tipoMap = { reporte: 'reporte-peligro', tarjeta: 'tarjeta-stop', art: 'control-art' } as const;
            await exportDetailPdf(tipoMap[tipo], item.id);
        } finally {
            setPdfLoading(null);
        }
    };

    if (sessionLoading || !session) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="h-10 w-10 rounded-full border-b-2 border-cyan-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <Link href="/" className="inline-flex items-center text-cyan-600 hover:text-cyan-700 mb-3 text-sm font-medium">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Volver al inicio
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Vista de Reportes Completados/Cerrados</h1>
                    <p className="text-sm text-gray-600 mt-1">Incluye timeline completo como en Alertas de Seguridad y detalle de Controles ART.</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 flex flex-wrap gap-3 items-center">
                    <span className="text-xs font-semibold text-gray-500">Filtrar por fecha:</span>
                    <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="border rounded-lg px-2 py-1 text-xs" />
                    <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="border rounded-lg px-2 py-1 text-xs" />
                    <select
                        value={tipoFiltro}
                        onChange={(e) => setTipoFiltro(e.target.value as 'todos' | 'reporte' | 'tarjeta' | 'art')}
                        className="border rounded-lg px-2 py-1 text-xs bg-white"
                    >
                        <option value="todos">Todos</option>
                        <option value="reporte">Reportes de Peligro</option>
                        <option value="tarjeta">Tarjetas Alto/Stop</option>
                        <option value="art">Controles ART</option>
                    </select>
                    {(fechaDesde || fechaHasta) && (
                        <button onClick={() => { setFechaDesde(''); setFechaHasta(''); }} className="text-xs text-gray-500 underline">
                            Limpiar
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-8 flex justify-center">
                        <div className="h-8 w-8 rounded-full border-b-2 border-cyan-600 animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {(tipoFiltro === 'todos' || tipoFiltro === 'reporte') && (
                            <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                                <div className="px-4 py-3 border-b bg-orange-50 flex items-center justify-between">
                                    <h2 className="text-sm font-semibold text-orange-900">Reportes de Peligro (Completados / Cerrados)</h2>
                                    <span className="text-xs font-bold text-orange-700">{reportesCompletadosOCerrados.length}</span>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {reportesCompletadosOCerrados.length === 0 ? (
                                        <div className="px-4 py-8 text-sm text-gray-400 text-center">Sin reportes en este rango de fechas</div>
                                    ) : (
                                        reportesCompletadosOCerrados.map((item) => (
                                            <div key={`reporte-${item.id}`} className="px-4 py-3 flex items-center gap-3 hover:bg-orange-50/30">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <StatusBadge estado={item.estado} />
                                                        <span className="text-xs text-gray-400">#{item.id}</span>
                                                    </div>
                                                    <p className="text-sm font-semibold text-gray-900 truncate">{item.datos?.tipoPeligro || 'Reporte de Peligro'}</p>
                                                    <p className="text-xs text-gray-500 truncate">{item.datos?.empresaNombre ? `${item.datos.empresaNombre} · ` : ''}{item.caminata?.zona || item.datos?.zonas || 'Sin zona'} · {item.creadoPor}</p>
                                                </div>
                                                <Link
                                                    href={`/dashboard/alertas/reporte-peligro/${item.id}`}
                                                    className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                                                >
                                                    Ver detalle
                                                </Link>
                                                <button
                                                    onClick={() => onExport('reporte', item)}
                                                    disabled={pdfLoading === `reporte-${item.id}`}
                                                    className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-200 disabled:opacity-50"
                                                >
                                                    {pdfLoading === `reporte-${item.id}` ? 'Generando...' : 'PDF'}
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        )}

                        {(tipoFiltro === 'todos' || tipoFiltro === 'tarjeta') && (
                            <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                                <div className="px-4 py-3 border-b bg-red-50 flex items-center justify-between">
                                    <h2 className="text-sm font-semibold text-red-900">Tarjetas Alto/Stop (Cerradas)</h2>
                                    <span className="text-xs font-bold text-red-700">{tarjetasCerradas.length}</span>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {tarjetasCerradas.length === 0 ? (
                                        <div className="px-4 py-8 text-sm text-gray-400 text-center">Sin tarjetas cerradas en este rango</div>
                                    ) : (
                                        tarjetasCerradas.map((item) => (
                                            <div key={`tarjeta-${item.id}`} className="px-4 py-3 flex items-center gap-3 hover:bg-red-50/30">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <StatusBadge estado={item.estado} />
                                                        <span className="text-xs text-gray-400">#{item.id}</span>
                                                    </div>
                                                    <p className="text-sm font-semibold text-gray-900 truncate">{item.datos?.causa || 'Tarjeta Alto/Stop'}</p>
                                                    <p className="text-xs text-gray-500 truncate">{item.datos?.empresaNombre ? `${item.datos.empresaNombre} · ` : ''}{item.caminata?.zona || item.datos?.zonas || 'Sin zona'} · {item.creadoPor}</p>
                                                </div>
                                                <Link
                                                    href={`/dashboard/alertas/tarjeta-stop/${item.id}`}
                                                    className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                                                >
                                                    Ver detalle
                                                </Link>
                                                <button
                                                    onClick={() => onExport('tarjeta', item)}
                                                    disabled={pdfLoading === `tarjeta-${item.id}`}
                                                    className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-200 disabled:opacity-50"
                                                >
                                                    {pdfLoading === `tarjeta-${item.id}` ? 'Generando...' : 'PDF'}
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        )}

                        {(tipoFiltro === 'todos' || tipoFiltro === 'art') && (
                            <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                                <div className="px-4 py-3 border-b bg-cyan-50 flex items-center justify-between">
                                    <h2 className="text-sm font-semibold text-cyan-900">Controles ART</h2>
                                    <span className="text-xs font-bold text-cyan-700">{controlesArt.length}</span>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {controlesArt.length === 0 ? (
                                        <div className="px-4 py-8 text-sm text-gray-400 text-center">Sin controles ART en este rango</div>
                                    ) : (
                                        controlesArt.map((item) => (
                                            <div key={`art-${item.id}`} className="px-4 py-3 flex items-center gap-3 hover:bg-cyan-50/30">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 truncate">Control ART #{item.id}</p>
                                                    <p className="text-xs text-gray-500 truncate">{item.datos?.empresaNombre ? `${item.datos.empresaNombre} · ` : ''}{item.caminata?.zona || item.datos?.zonas || 'Sin zona'} · {item.creadoPor}</p>
                                                </div>
                                                <Link
                                                    href={`/dashboard/alertas/control-art/${item.id}`}
                                                    className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                                                >
                                                    Ver detalle
                                                </Link>
                                                <button
                                                    onClick={() => onExport('art', item)}
                                                    disabled={pdfLoading === `art-${item.id}`}
                                                    className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-200 disabled:opacity-50"
                                                >
                                                    {pdfLoading === `art-${item.id}` ? 'Generando...' : 'PDF'}
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
