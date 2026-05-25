'use client';

import { useEffect, useState } from 'react';

interface AlertaItem {
    id: number;
    tipo: string;
    estado?: string;
    fecha: string;
    creadoPor: string;
    rol: string;
    caminata: { codigo: string | null; zona: string | null; faena: string | null } | null;
}

interface GestionDesempenoData {
    estadisticas: {
        totalGeneral: number;
        totalAlertasCerradas: number;
        totalTarjetasStop: number;
        totalTarjetasStopCerradas: number;
        totalReportesPeligro: number;
        totalReportesPendientes: number;
        totalReportesEnRevision: number;
        totalReportesPendientesVerificacion: number;
        totalReportesCerrados: number;
        totalControlesART: number;
        totalCaminatas: number;
        totalCaminatasAbiertas: number;
        totalCaminatasCerradas: number;
    };
    tarjetasStop: AlertaItem[];
    reportesPendientes: AlertaItem[];
    reportesEnRevision: AlertaItem[];
    reportesPendientesVerificacion: AlertaItem[];
    reportesCerrados: AlertaItem[];
    controlesART: AlertaItem[];
    caminatasAbiertas: AlertaItem[];
    caminatasCerradas: AlertaItem[];
}

const TIPO_LABEL: Record<string, { label: string; color: string; bg: string }> = {
    TARJETA_STOP: { label: 'Tarjeta Stop', color: 'text-red-700', bg: 'bg-red-100' },
    REPORTE_PENDIENTE: { label: 'Reporte Peligro', color: 'text-orange-700', bg: 'bg-orange-100' },
    REPORTE_EN_REVISION: { label: 'Reporte – En Revisión', color: 'text-yellow-700', bg: 'bg-yellow-100' },
    REPORTE_PENDIENTE_VERIFICACION: { label: 'Reporte – Verif. Pend.', color: 'text-amber-700', bg: 'bg-amber-100' },
    REPORTE_CERRADO: { label: 'Reporte Peligro', color: 'text-teal-700', bg: 'bg-teal-100' },
    CONTROL_ART: { label: 'Control ART', color: 'text-cyan-700', bg: 'bg-cyan-100' },
    CAMINATA_ABIERTA: { label: 'Caminata', color: 'text-violet-700', bg: 'bg-violet-100' },
    CAMINATA_CERRADA: { label: 'Caminata', color: 'text-purple-700', bg: 'bg-purple-100' },
};

export default function GestionDesempenoCard() {
    const [data, setData] = useState<GestionDesempenoData | null>(null);
    const [loading, setLoading] = useState(true);
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [filtro, setFiltro] = useState({ desde: '', hasta: '' });
    const [modal, setModal] = useState<'cerradas' | 'abiertas' | 'caminatas-cerradas' | 'caminatas-abiertas' | null>(null);
    const [showInfo, setShowInfo] = useState(false);

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (filtro.desde) params.set('fechaInicio', filtro.desde);
        if (filtro.hasta) params.set('fechaFin', filtro.hasta);
        const url = params.toString() ? `/api/dashboard/alertas-seguridad?${params}` : '/api/dashboard/alertas-seguridad';
        fetch(url)
            .then(r => r.json())
            .then(d => setData(d))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [filtro]);

    const aplicar = () => setFiltro({ desde: fechaDesde, hasta: fechaHasta });
    const limpiar = () => { setFechaDesde(''); setFechaHasta(''); setFiltro({ desde: '', hasta: '' }); };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-md p-6">
                <div className="animate-pulse h-24 bg-gray-100 rounded-lg" />
            </div>
        );
    }

    if (!data) return null;

    const {
        totalTarjetasStop,
        totalTarjetasStopCerradas,
        totalReportesPeligro,
        totalReportesPendientes,
        totalReportesEnRevision,
        totalReportesPendientesVerificacion,
        totalReportesCerrados,
        totalControlesART,
        totalAlertasCerradas,
        totalCaminatas,
        totalCaminatasAbiertas,
        totalCaminatasCerradas,
    } = data.estadisticas;

    const cerradas = totalAlertasCerradas;
    const abiertas = (totalTarjetasStop - totalTarjetasStopCerradas)
        + totalReportesPendientes
        + totalReportesEnRevision
        + totalReportesPendientesVerificacion;
    const total = cerradas + abiertas;
    const cumplimientoPct = total > 0 ? (cerradas / total * 100) : 0;
    const pctAbiertas = total > 0 ? (abiertas / total * 100) : 0;

    const totalCaminatasGrafico = (totalCaminatasAbiertas ?? 0) + (totalCaminatasCerradas ?? 0);
    const pctCaminatasCerradas = totalCaminatasGrafico > 0 ? (totalCaminatasCerradas / totalCaminatasGrafico * 100) : 0;
    const pctCaminatasAbiertas = totalCaminatasGrafico > 0 ? (totalCaminatasAbiertas / totalCaminatasGrafico * 100) : 0;

    // Listas para el modal
    const listaCerradas: AlertaItem[] = [
        ...(data.tarjetasStop ?? []).filter(t => t.estado === 'CERRADO'),
        ...(data.reportesCerrados ?? []),
        ...(data.controlesART ?? []),
    ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    const listaAbiertas: AlertaItem[] = [
        ...(data.tarjetasStop ?? []).filter(t => t.estado !== 'CERRADO'),
        ...(data.reportesPendientes ?? []),
        ...(data.reportesEnRevision ?? []),
        ...(data.reportesPendientesVerificacion ?? []),
    ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    const listaCaminatasCerradas = [...(data.caminatasCerradas ?? [])]
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    const listaCaminatasAbiertas = [...(data.caminatasAbiertas ?? [])]
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    const modalItems =
        modal === 'cerradas' ? listaCerradas
            : modal === 'abiertas' ? listaAbiertas
                : modal === 'caminatas-cerradas' ? listaCaminatasCerradas
                    : listaCaminatasAbiertas;
    const modalTitle =
        modal === 'cerradas' ? `Actividades Cerradas (${listaCerradas.length})`
            : modal === 'abiertas' ? `Actividades Abiertas (${listaAbiertas.length})`
                : modal === 'caminatas-cerradas' ? `Caminatas Cerradas (${listaCaminatasCerradas.length})`
                    : `Caminatas Abiertas (${listaCaminatasAbiertas.length})`;
    const modalColor =
        modal === 'cerradas' ? '#0891b2'
            : modal === 'abiertas' ? '#0f766e'
                : modal === 'caminatas-cerradas' ? '#7e22ce'
                    : '#7c3aed';

    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
                        Gestión de Desempeño
                    </h3>
                    {/* Info button */}
                    <div className="relative">
                        <button
                            onClick={() => setShowInfo(v => !v)}
                            className="w-5 h-5 rounded-full bg-gray-100 hover:bg-cyan-100 text-gray-400 hover:text-cyan-600 flex items-center justify-center transition-colors text-xs font-bold"
                            title="¿Qué significan Cerradas y Abiertas?"
                        >?</button>
                        {showInfo && (
                            <div className="absolute left-0 top-7 z-30 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-4 text-xs text-gray-600 space-y-2">
                                <button onClick={() => setShowInfo(false)} className="absolute top-2 right-2 text-gray-300 hover:text-gray-500">✕</button>
                                <p className="font-semibold text-gray-800 mb-1">¿Qué se mide aquí?</p>
                                <div className="flex gap-2 items-start">
                                    <span className="mt-0.5 w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0 inline-block" />
                                    <div><span className="font-semibold text-cyan-700">Cerradas:</span> Tarjetas Stop con estado CERRADO + Reportes de Peligro en estado CERRADO + todos los Controles ART registrados (se crean al completarse).</div>
                                </div>
                                <div className="flex gap-2 items-start">
                                    <span className="mt-0.5 w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0 inline-block" />
                                    <div><span className="font-semibold text-teal-700">Abiertas:</span> Tarjetas Stop aún pendientes + Reportes de Peligro en estado PENDIENTE, EN REVISIÓN o PENDIENTE DE VERIFICACIÓN.</div>
                                </div>
                                <p className="text-gray-400 italic pt-1">El % de cumplimiento = Cerradas / Total.</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <input
                        type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <span className="text-xs text-gray-400">—</span>
                    <input
                        type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <button
                        onClick={aplicar}
                        disabled={!fechaDesde && !fechaHasta}
                        className="px-3 py-1 bg-cyan-600 text-white text-xs rounded-lg hover:bg-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Aplicar
                    </button>
                    {(filtro.desde || filtro.hasta) && (
                        <button onClick={limpiar} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200 transition-colors">
                            Limpiar
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-center">
                {/* KPI Boxes */}
                <div className="flex flex-row lg:flex-col gap-4 shrink-0">
                    <div className="bg-gray-50 rounded-xl border border-gray-100 px-6 py-4 min-w-50">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                            Cantidad de Actividades
                        </p>
                        <p className="text-5xl font-black text-gray-900 mt-2 leading-none">{total}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl border border-gray-100 px-6 py-4 min-w-50">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                            Cumplimiento
                        </p>
                        <p className="text-4xl font-black text-emerald-600 mt-2 leading-none">
                            {cumplimientoPct.toFixed(1)} %
                        </p>
                    </div>
                </div>

                {/* Chevron Chart */}
                <div className="flex-1 min-w-0 w-full">
                    {total === 0 ? (
                        <p className="text-sm text-gray-400 italic">Sin actividades registradas</p>
                    ) : (
                        <>
                            <div className="flex items-stretch h-20" style={{ gap: '3px' }}>
                                {cerradas > 0 && (
                                    <div
                                        onClick={() => setModal('cerradas')}
                                        className="flex items-center justify-center text-white cursor-pointer hover:brightness-110 transition-all"
                                        style={{
                                            flex: Math.max(cumplimientoPct, 8),
                                            background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                                            clipPath: 'polygon(0 0, calc(100% - 22px) 0, 100% 50%, calc(100% - 22px) 100%, 0 100%)',
                                        }}
                                    >
                                        <div className="text-center px-3 pl-4">
                                            <p className="text-xs font-semibold opacity-90 leading-none mb-0.5">Cerrada</p>
                                            <p className="text-2xl font-black leading-none">{cerradas}</p>
                                        </div>
                                    </div>
                                )}
                                {abiertas > 0 && (
                                    <div
                                        onClick={() => setModal('abiertas')}
                                        className="flex items-center justify-center text-white cursor-pointer hover:brightness-110 transition-all"
                                        style={{
                                            flex: Math.max(pctAbiertas, 6),
                                            background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                                            clipPath: 'polygon(0 0, calc(100% - 22px) 0, 100% 50%, calc(100% - 22px) 100%, 0 100%)',
                                        }}
                                    >
                                        <div className="text-center px-3 pl-4">
                                            <p className="text-xs font-semibold opacity-90 leading-none mb-0.5">Abierta</p>
                                            <p className="text-2xl font-black leading-none">{abiertas}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Porcentajes */}
                            <div className="flex mt-2" style={{ gap: '3px' }}>
                                {cerradas > 0 && (
                                    <div style={{ flex: Math.max(cumplimientoPct, 8) }}>
                                        <p className="text-xs font-bold text-cyan-700">{cumplimientoPct.toFixed(2)}%</p>
                                    </div>
                                )}
                                {abiertas > 0 && (
                                    <div style={{ flex: Math.max(pctAbiertas, 6) }}>
                                        <p className="text-xs font-bold text-teal-700">{pctAbiertas.toFixed(2)}%</p>
                                    </div>
                                )}
                            </div>

                            {/* Desglose */}
                            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
                                <span>
                                    <span className="font-semibold text-gray-700">{totalTarjetasStop}</span> Tarjetas Stop
                                    {' '}(<span className="text-cyan-700 font-semibold">{totalTarjetasStopCerradas}</span> cerradas)
                                </span>
                                <span>
                                    <span className="font-semibold text-gray-700">{totalReportesPeligro}</span> Reportes de Peligro
                                    {' '}(<span className="text-cyan-700 font-semibold">{totalReportesCerrados}</span> cerrados)
                                </span>
                                <span>
                                    <span className="font-semibold text-gray-700">{totalControlesART}</span> Controles ART
                                    {' '}(<span className="text-cyan-700 font-semibold">{totalControlesART}</span> completados)
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── Caminatas de Seguridad — sección separada ── */}
            {totalCaminatasGrafico > 0 && (
                <div className="mt-10 pt-8 border-t-2 border-dashed border-violet-200">
                    <div className="flex flex-col lg:flex-row gap-8 items-center">
                        {/* KPI Caminatas */}
                        <div className="shrink-0">
                            <div className="bg-violet-50 rounded-xl border border-violet-200 px-6 py-4 min-w-50">
                                <p className="text-xs font-semibold text-violet-500 uppercase tracking-wide">Caminatas de Seguridad</p>
                                <p className="text-5xl font-black text-violet-900 mt-2 leading-none">{totalCaminatas}</p>
                            </div>
                        </div>
                        {/* Gráfico chevron caminatas */}
                        <div className="flex-1 min-w-0 w-full">
                            <p className="text-xs text-gray-500 mb-3">
                                Completadas/Canceladas: <span className="font-semibold text-purple-700">{totalCaminatasCerradas}</span>
                                {' · '}
                                Pendientes/En proceso: <span className="font-semibold text-violet-700">{totalCaminatasAbiertas}</span>
                            </p>
                            <div className="flex items-stretch h-20" style={{ gap: '3px' }}>
                                {totalCaminatasCerradas > 0 && (
                                    <div
                                        onClick={() => setModal('caminatas-cerradas')}
                                        className="flex items-center justify-center text-white cursor-pointer hover:brightness-110 transition-all"
                                        style={{
                                            flex: Math.max(pctCaminatasCerradas, 8),
                                            background: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',
                                            clipPath: 'polygon(0 0, calc(100% - 22px) 0, 100% 50%, calc(100% - 22px) 100%, 0 100%)',
                                        }}
                                    >
                                        <div className="text-center px-3 pl-4">
                                            <p className="text-xs font-semibold opacity-90 leading-none mb-0.5">Cerrada</p>
                                            <p className="text-2xl font-black leading-none">{totalCaminatasCerradas}</p>
                                        </div>
                                    </div>
                                )}
                                {totalCaminatasAbiertas > 0 && (
                                    <div
                                        onClick={() => setModal('caminatas-abiertas')}
                                        className="flex items-center justify-center text-white cursor-pointer hover:brightness-110 transition-all"
                                        style={{
                                            flex: Math.max(pctCaminatasAbiertas, 6),
                                            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                            clipPath: 'polygon(0 0, calc(100% - 22px) 0, 100% 50%, calc(100% - 22px) 100%, 0 100%)',
                                        }}
                                    >
                                        <div className="text-center px-3 pl-4">
                                            <p className="text-xs font-semibold opacity-90 leading-none mb-0.5">Abierta</p>
                                            <p className="text-2xl font-black leading-none">{totalCaminatasAbiertas}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex mt-2" style={{ gap: '3px' }}>
                                {totalCaminatasCerradas > 0 && (
                                    <div style={{ flex: Math.max(pctCaminatasCerradas, 8) }}>
                                        <p className="text-xs font-bold text-purple-700">{pctCaminatasCerradas.toFixed(2)}%</p>
                                    </div>
                                )}
                                {totalCaminatasAbiertas > 0 && (
                                    <div style={{ flex: Math.max(pctCaminatasAbiertas, 6) }}>
                                        <p className="text-xs font-bold text-violet-700">{pctCaminatasAbiertas.toFixed(2)}%</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            {modal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0" style={{ borderLeftWidth: 4, borderLeftColor: modalColor }}>
                            <div>
                                <h2 className="text-base font-bold text-gray-900">{modalTitle}</h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {modal === 'cerradas'
                                        ? 'Tarjetas Stop cerradas · Reportes cerrados · Controles ART'
                                        : modal === 'abiertas'
                                            ? 'Tarjetas Stop pendientes · Reportes en curso'
                                            : modal === 'caminatas-cerradas'
                                                ? 'Caminatas completadas o canceladas'
                                                : 'Caminatas pendientes o en proceso'}
                                </p>
                            </div>
                            <button onClick={() => setModal(null)} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* List */}
                        <div className="overflow-y-auto p-4 space-y-2">
                            {modalItems.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 text-sm">Sin registros</div>
                            ) : modalItems.map((item, i) => {
                                const t = TIPO_LABEL[item.tipo] ?? { label: item.tipo, color: 'text-gray-700', bg: 'bg-gray-100' };
                                return (
                                    <div key={`${item.tipo}-${item.id}-${i}`} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                                        <span className={`mt-0.5 text-xs px-2 py-0.5 rounded font-semibold shrink-0 ${t.bg} ${t.color}`}>{t.label}</span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-medium text-gray-700 truncate">
                                                {item.caminata?.codigo
                                                    ? `Caminata ${item.caminata.codigo}${item.caminata.zona ? ` · ${item.caminata.zona}` : ''}`
                                                    : 'Sin caminata asociada'}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">Por: {item.creadoPor}</p>
                                        </div>
                                        <p className="text-xs text-gray-400 shrink-0 whitespace-nowrap">{new Date(item.fecha).toLocaleDateString('es-CL')}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
