'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import ReportePeligroForm from '@/components/caminatas/ReportePeligroForm';
import TarjetaStopForm from '@/components/caminatas/TarjetaStopForm';
import ControlCalidadARTForm from '@/components/caminatas/ControlCalidadARTForm';
import ImageGallery from '@/components/caminatas/ImageGallery';
import AlertTimeline from '@/components/caminatas/AlertTimeline';
import { exportDetailPdf } from '@/components/seccionReportarInicio/pdfExport';

interface Reporte {
    id: number;
    estado?: string;
    datos: any;
    createdAt: string;
    updatedAt?: string;
    fechaCierre?: string | null;
    comentarioCierre?: string | null;
    imagenCierre?: string | null;
    fechaVerificacion?: string | null;
    comentarioVerificacion?: string | null;
    imagenVerificacion?: string | null;
    creadoPor: {
        id: number;
        name: string | null;
        username: string;
        rol: string;
    };
    responsableCierre?: {
        id: number;
        name: string | null;
        username: string;
        rol: string;
    } | null;
    responsableVerificacion?: {
        id: number;
        name: string | null;
        username: string;
        rol: string;
    } | null;
}

interface Session {
    id: number;
    rol: string;
    name: string | null;
}

type DashboardActivityTipo = 'caminata' | 'reporte_peligro' | 'tarjeta_stop' | 'control_art';

interface DashboardActivityRow {
    tipo: DashboardActivityTipo;
    nombre: string;
    totalProgramadas: number;
    actividadesCumplidas: number;
    totalActividades: number;
}

interface DashboardActivityResponse {
    rows?: DashboardActivityRow[];
    error?: string;
}

const DASHBOARD_TIPO_ORDER: DashboardActivityTipo[] = [
    'caminata',
    'reporte_peligro',
    'tarjeta_stop',
    'control_art',
];

const DASHBOARD_TIPO_META: Record<DashboardActivityTipo, { label: string; badgeClass: string }> = {
    caminata: {
        label: 'Caminatas de Seguridad',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    reporte_peligro: {
        label: 'Reporte de Peligro',
        badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
    },
    tarjeta_stop: {
        label: 'Tarjeta Alto/Stop',
        badgeClass: 'bg-red-100 text-red-800 border-red-200',
    },
    control_art: {
        label: 'Control de Calidad ART',
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    },
};

export default function AlertasPage() {
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<Session | null>(null);
    const [reportes, setReportes] = useState<Reporte[]>([]);
    const [tarjetas, setTarjetas] = useState<Reporte[]>([]);
    const [controlesART, setControlesART] = useState<Reporte[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [tipoFormulario, setTipoFormulario] = useState<'seleccion' | 'peligro' | 'stop' | 'art'>('seleccion');
    const [selectedItem, setSelectedItem] = useState<{ tipo: 'reporte' | 'tarjeta' | 'control', item: Reporte } | null>(null);
    const [pdfLoading, setPdfLoading] = useState<string | null>(null);
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [dashboardRows, setDashboardRows] = useState<DashboardActivityRow[]>([]);
    const [dashboardLoading, setDashboardLoading] = useState(true);
    const [dashboardError, setDashboardError] = useState<string | null>(null);

    const onExport = async (tipo: 'reporte' | 'tarjeta' | 'control', id: number) => {
        const key = `${tipo}-${id}`;
        setPdfLoading(key);
        try {
            const tipoMap = { reporte: 'reporte-peligro', tarjeta: 'tarjeta-stop', control: 'control-art' } as const;
            await exportDetailPdf(tipoMap[tipo], id);
        } finally {
            setPdfLoading(null);
        }
    };

    useEffect(() => {
        fetchSession();
        fetchReportes();
        fetchTarjetas();
        fetchControlesART();
    }, []);

    useEffect(() => {
        fetchResumenDashboard();
    }, [fechaDesde, fechaHasta]);

    const fetchSession = async () => {
        try {
            const response = await fetch('/api/auth/session');
            if (response.ok) {
                const data = await response.json();
                setSession(data);
            }
        } catch (err) {
            console.error('Error al cargar sesión:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchReportes = async () => {
        try {
            const response = await fetch('/api/reportes-peligro?includeCaminata=1');
            if (response.ok) {
                const data = await response.json();
                setReportes(data);
            }
        } catch (err) {
            console.error('Error al cargar reportes:', err);
        }
    };

    const fetchTarjetas = async () => {
        try {
            const response = await fetch('/api/tarjetas-stop?includeCaminata=1');
            if (response.ok) {
                const data = await response.json();
                setTarjetas(data);
            }
        } catch (err) {
            console.error('Error al cargar tarjetas:', err);
        }
    };

    const fetchControlesART = async () => {
        try {
            const response = await fetch('/api/control-calidad-art?includeCaminata=1');
            if (response.ok) {
                const data = await response.json();
                setControlesART(data);
            }
        } catch (err) {
            console.error('Error al cargar controles ART:', err);
        }
    };

    const fetchResumenDashboard = async () => {
        setDashboardLoading(true);
        setDashboardError(null);

        try {
            const params = new URLSearchParams();
            if (fechaDesde) params.set('fechaInicio', fechaDesde);
            if (fechaHasta) params.set('fechaFin', fechaHasta);

            const url = params.toString()
                ? `/api/dashboard/tabla-actividades?${params.toString()}`
                : '/api/dashboard/tabla-actividades';

            const response = await fetch(url);
            const data = (await response.json()) as DashboardActivityResponse;

            if (!response.ok) {
                throw new Error(data.error || 'No se pudo cargar el resumen de actividades');
            }

            setDashboardRows(Array.isArray(data.rows) ? data.rows : []);
        } catch (err) {
            setDashboardError(err instanceof Error ? err.message : 'Error al cargar el resumen de actividades');
            setDashboardRows([]);
        } finally {
            setDashboardLoading(false);
        }
    };

    const handleSuccess = () => {
        setShowModal(false);
        setTipoFormulario('seleccion');
        fetchReportes();
        fetchTarjetas();
        fetchControlesART();
        fetchResumenDashboard();
    };

    const buildTimelineEvents = (item: Reporte, tipo: 'reporte' | 'tarjeta') => {
        const events: any[] = [];

        // Evento de creación
        events.push({
            timestamp: new Date(item.createdAt),
            title: tipo === 'reporte' ? 'Reporte de Peligro Creado' : 'Tarjeta Alto/Stop Emitida',
            description: 'Se ha registrado una nueva alerta de seguridad',
            user: item.creadoPor,
            status: 'PENDIENTE',
            type: 'creation'
        });

        // Evento de asignación (si hay responsable de cierre)
        if (item.responsableCierre) {
            events.push({
                timestamp: new Date(item.createdAt), // Usamos createdAt ya que se asigna al crear
                title: 'Responsable de Cierre Asignado',
                description: `Se asignó ${item.responsableCierre.name || item.responsableCierre.username} como responsable del cierre`,
                user: item.responsableCierre,
                type: 'assignment'
            });
        }

        // Para reportes de peligro - verificación
        if (tipo === 'reporte') {
            if (item.estado === 'EN_REVISION') {
                events.push({
                    timestamp: new Date(item.updatedAt || item.createdAt),
                    title: 'Estado Cambiado: En Revisión',
                    description: 'El reporte está siendo revisado por el responsable',
                    status: 'EN_REVISION',
                    type: 'status_change'
                });
            }

            // Evento de pendiente verificación - siempre antes de la verificación realizada
            if (item.estado === 'PENDIENTE_VERIFICACION' || item.fechaVerificacion) {
                // Calcular timestamp: si hay fechaVerificacion, usar un momento antes
                const timestamp = item.fechaVerificacion
                    ? new Date(new Date(item.fechaVerificacion).getTime() - 60000) // 1 minuto antes
                    : new Date(item.updatedAt || item.createdAt);

                events.push({
                    timestamp: timestamp,
                    title: 'Estado Cambiado: Pendiente Verificación',
                    description: 'Las acciones correctivas están pendientes de verificación',
                    status: 'PENDIENTE_VERIFICACION',
                    type: 'status_change'
                });
            }

            // Evento de verificación realizada (si existe)
            if (item.fechaVerificacion && item.responsableVerificacion) {
                events.push({
                    timestamp: new Date(item.fechaVerificacion),
                    title: 'Verificación Realizada',
                    description: 'Las acciones correctivas han sido verificadas exitosamente',
                    user: item.responsableVerificacion,
                    comment: item.comentarioVerificacion,
                    image: item.imagenVerificacion,
                    type: 'verification'
                });
            }
        }

        // Evento de cierre (si está cerrado)
        if (item.estado === 'CERRADO' && item.fechaCierre) {
            events.push({
                timestamp: new Date(item.fechaCierre),
                title: 'Alerta Cerrada',
                description: 'La alerta ha sido resuelta y cerrada exitosamente',
                user: item.responsableCierre,
                comment: item.comentarioCierre,
                image: item.imagenCierre,
                status: 'CERRADO',
                type: 'closure'
            });
        }

        return events;
    };

    function toChileDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
    }

    const reportesFiltrados = reportes.filter((r) => {
        const fecha = toChileDate(r.createdAt);
        if (fechaDesde && fecha < fechaDesde) return false;
        if (fechaHasta && fecha > fechaHasta) return false;
        return true;
    });

    const tarjetasFiltradas = tarjetas.filter((t) => {
        const fecha = toChileDate(t.createdAt);
        if (fechaDesde && fecha < fechaDesde) return false;
        if (fechaHasta && fecha > fechaHasta) return false;
        return true;
    });

    const controlesFiltrados = controlesART.filter((c) => {
        const fecha = toChileDate(c.createdAt);
        if (fechaDesde && fecha < fechaDesde) return false;
        if (fechaHasta && fecha > fechaHasta) return false;
        return true;
    });

    const dashboardRowsByTipo = useMemo(() => {
        const map = new Map<DashboardActivityTipo, DashboardActivityRow>();
        for (const row of dashboardRows) {
            map.set(row.tipo, row);
        }
        return map;
    }, [dashboardRows]);

    const dashboardTotalActividades = useMemo(
        () => dashboardRows.reduce((acumulado, row) => acumulado + row.totalActividades, 0),
        [dashboardRows],
    );

    const hayFiltro = fechaDesde !== '' || fechaHasta !== '';

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Alertas de Seguridad</h1>
                            <p className="mt-1 text-sm sm:text-base text-gray-600">
                                Reportes y controles de seguridad, incluyendo los registros creados desde caminatas
                            </p>
                        </div>

                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex items-center justify-between mb-4 gap-3">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Conteo por tipo (Historial /dashboard)</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Mismo criterio de /dashboard en historial de actividades, incluyendo registros desde caminatas.
                            </p>
                        </div>
                        <button
                            onClick={fetchResumenDashboard}
                            className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                            Actualizar
                        </button>
                    </div>

                    {dashboardLoading ? (
                        <div className="py-8 flex items-center justify-center gap-3 text-gray-500 text-sm">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                            Cargando resumen por tipo...
                        </div>
                    ) : dashboardError ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                            {dashboardError}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                                {DASHBOARD_TIPO_ORDER.map((tipo) => {
                                    const row = dashboardRowsByTipo.get(tipo);
                                    const meta = DASHBOARD_TIPO_META[tipo];

                                    return (
                                        <div key={tipo} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-sm font-semibold text-gray-900">{meta.label}</p>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${meta.badgeClass}`}>
                                                    Total: {row?.totalActividades ?? 0}
                                                </span>
                                            </div>
                                            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                                <div className="bg-white rounded border border-gray-200 px-2 py-1.5">
                                                    <p className="text-xs text-gray-500">Programadas</p>
                                                    <p className="font-semibold text-gray-800">{row?.totalProgramadas ?? 0}</p>
                                                </div>
                                                <div className="bg-white rounded border border-gray-200 px-2 py-1.5">
                                                    <p className="text-xs text-gray-500">No programadas</p>
                                                    <p className="font-semibold text-purple-700">{row?.actividadesCumplidas ?? 0}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                                <p className="text-sm text-gray-600">Total general de actividades</p>
                                <p className="text-xl font-bold text-gray-900">{dashboardTotalActividades}</p>
                            </div>
                        </>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="shrink-0 bg-orange-100 rounded-full p-3">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Reportes de Peligro</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {hayFiltro ? `${reportesFiltrados.length} / ${reportes.length}` : reportes.length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="shrink-0 bg-red-100 rounded-full p-3">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Tarjetas Alto/Stop</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {hayFiltro ? `${tarjetasFiltradas.length} / ${tarjetas.length}` : tarjetas.length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="shrink-0 bg-blue-100 rounded-full p-3">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">Controles ART</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {hayFiltro ? `${controlesFiltrados.length} / ${controlesART.length}` : controlesART.length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filtro por fecha de registro */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex flex-wrap items-end gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha de inicio desde</label>
                            <input
                                type="date"
                                value={fechaDesde}
                                onChange={(e) => setFechaDesde(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha de inicio hasta</label>
                            <input
                                type="date"
                                value={fechaHasta}
                                onChange={(e) => setFechaHasta(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        {hayFiltro && (
                            <button
                                onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium transition-colors"
                            >
                                Limpiar filtro
                            </button>
                        )}
                        {hayFiltro && (
                            <p className="text-sm text-gray-500">
                                Mostrando {reportesFiltrados.length + tarjetasFiltradas.length + controlesFiltrados.length} de {reportes.length + tarjetas.length + controlesART.length} registros
                            </p>
                        )}
                    </div>
                </div>

                {/* Reportes de Peligro */}
                <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                            <svg className="w-6 h-6 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Reportes de Peligro ({hayFiltro ? `${reportesFiltrados.length} / ${reportes.length}` : reportes.length})
                        </h2>
                    </div>
                    {reportesFiltrados.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo Peligro</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zona/Faena</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Riesgo</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reportado por</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsable Cierre</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reportesFiltrados.map((reporte) => {
                                        const datos = reporte.datos || {};
                                        return (
                                            <tr key={reporte.id} className="hover:bg-orange-50 transition-colors cursor-pointer" onClick={() => setSelectedItem({ tipo: 'reporte', item: reporte })}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    #{reporte.id}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${reporte.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                                                        reporte.estado === 'EN_REVISION' ? 'bg-orange-100 text-orange-800' :
                                                            reporte.estado === 'PENDIENTE_VERIFICACION' ? 'bg-purple-100 text-purple-800' :
                                                                reporte.estado === 'CERRADO' ? 'bg-green-100 text-green-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {reporte.estado === 'PENDIENTE' ? 'Pendiente' :
                                                            reporte.estado === 'EN_REVISION' ? 'En Revisión' :
                                                                reporte.estado === 'PENDIENTE_VERIFICACION' ? 'Pend. Verificación' :
                                                                    reporte.estado === 'CERRADO' ? 'Cerrado' :
                                                                        reporte.estado || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 max-w-48">
                                                    <span
                                                        className="block truncate"
                                                        title={datos.tipoPeligro || 'N/A'}
                                                    >
                                                        {datos.tipoPeligro || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {datos.zonas || 'N/A'} • {datos.faena || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {datos.tipoRiesgo && (
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${datos.tipoRiesgo === 'Alto' ? 'bg-red-100 text-red-800' :
                                                            datos.tipoRiesgo === 'Medio' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-green-100 text-green-800'
                                                            }`}>
                                                            {datos.tipoRiesgo}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {reporte.creadoPor.name || reporte.creadoPor.username}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {reporte.responsableCierre ?
                                                        (reporte.responsableCierre.name || reporte.responsableCierre.username) :
                                                        <span className="text-gray-400 italic">Sin asignar</span>
                                                    }
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(reporte.createdAt).toLocaleDateString('es-CL')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedItem({ tipo: 'reporte', item: reporte });
                                                            }}
                                                            className="text-orange-600 hover:text-orange-800 font-medium"
                                                        >
                                                            Ver detalles
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onExport('reporte', reporte.id);
                                                            }}
                                                            disabled={pdfLoading === `reporte-${reporte.id}`}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-800 text-white text-xs font-medium disabled:opacity-50 transition-colors"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                                            </svg>
                                                            {pdfLoading === `reporte-${reporte.id}` ? 'Generando...' : 'Exportar'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-6">
                            <p className="text-gray-500 italic">
                                {hayFiltro ? 'No hay reportes de peligro en el rango de fechas seleccionado' : 'No hay reportes de peligro para mostrar'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Tarjetas Stop */}
                <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                            <svg className="w-6 h-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 75.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            Tarjetas Alto/Stop ({hayFiltro ? `${tarjetasFiltradas.length} / ${tarjetas.length}` : tarjetas.length})
                        </h2>
                    </div>
                    {tarjetasFiltradas.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Causa</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Causal Detención</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zona/Faena</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reportado por</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsable Cierre</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {tarjetasFiltradas.map((tarjeta) => {
                                        const datos = tarjeta.datos || {};
                                        return (
                                            <tr key={tarjeta.id} className="hover:bg-red-50 transition-colors cursor-pointer" onClick={() => setSelectedItem({ tipo: 'tarjeta', item: tarjeta })}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    #{tarjeta.id}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${tarjeta.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                                                        tarjeta.estado === 'CERRADO' ? 'bg-green-100 text-green-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {tarjeta.estado === 'PENDIENTE' ? 'Pendiente' :
                                                            tarjeta.estado === 'CERRADO' ? 'Cerrado' :
                                                                tarjeta.estado || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    {datos.causa || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {datos.causalDetencion || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {datos.zonas || 'N/A'} • {datos.faenas || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {tarjeta.creadoPor.name || tarjeta.creadoPor.username}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {tarjeta.responsableCierre ?
                                                        (tarjeta.responsableCierre.name || tarjeta.responsableCierre.username) :
                                                        <span className="text-gray-400 italic">Sin asignar</span>
                                                    }
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(tarjeta.createdAt).toLocaleDateString('es-CL')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedItem({ tipo: 'tarjeta', item: tarjeta });
                                                            }}
                                                            className="text-red-600 hover:text-red-800 font-medium"
                                                        >
                                                            Ver detalles
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onExport('tarjeta', tarjeta.id);
                                                            }}
                                                            disabled={pdfLoading === `tarjeta-${tarjeta.id}`}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-800 text-white text-xs font-medium disabled:opacity-50 transition-colors"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                                            </svg>
                                                            {pdfLoading === `tarjeta-${tarjeta.id}` ? 'Generando...' : 'Exportar'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-6">
                            <p className="text-gray-500 italic">
                                {hayFiltro ? 'No hay tarjetas alto/stop en el rango de fechas seleccionado' : 'No hay tarjetas alto/stop para mostrar'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Controles de Calidad ART */}
                <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                            <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Control de Calidad de ART ({hayFiltro ? `${controlesFiltrados.length} / ${controlesART.length}` : controlesART.length})
                        </h2>
                    </div>
                    {controlesFiltrados.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Área</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarea/Actividad</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zona/Faena</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cumplimiento</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reportado por</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {controlesFiltrados.map((control) => {
                                        const datos = control.datos || {};
                                        const itemsCumplidos = datos.itemsControl ? datos.itemsControl.filter((item: any) => item.cumple === 'SI').length : 0;
                                        const totalItems = datos.itemsControl ? datos.itemsControl.length : 0;
                                        const porcentaje = totalItems > 0 ? Math.round((itemsCumplidos / totalItems) * 100) : 0;
                                        return (
                                            <tr key={control.id} className="hover:bg-blue-50 transition-colors cursor-pointer" onClick={() => setSelectedItem({ tipo: 'control', item: control })}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    #{control.id}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                                        Completado
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    {datos.area || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {datos.tareaActividad || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {datos.zonas || 'N/A'} • {datos.faenas || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${porcentaje >= 80 ? 'bg-green-100 text-green-800' :
                                                        porcentaje >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                        {itemsCumplidos}/{totalItems} ({porcentaje}%)
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {control.creadoPor.name || control.creadoPor.username}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(control.createdAt).toLocaleDateString('es-CL')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedItem({ tipo: 'control', item: control });
                                                            }}
                                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                                        >
                                                            Ver detalles
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onExport('control', control.id);
                                                            }}
                                                            disabled={pdfLoading === `control-${control.id}`}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-800 text-white text-xs font-medium disabled:opacity-50 transition-colors"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                                            </svg>
                                                            {pdfLoading === `control-${control.id}` ? 'Generando...' : 'Exportar'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-6">
                            <p className="text-gray-500 italic">
                                {hayFiltro ? 'No hay controles ART en el rango de fechas seleccionado' : 'No hay controles de calidad ART para mostrar'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de detalles */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedItem(null)}>
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {selectedItem.tipo === 'reporte' && '🔶 Reporte de Peligro'}
                                {selectedItem.tipo === 'tarjeta' && '🛑 Tarjeta Alto/Stop'}
                                {selectedItem.tipo === 'control' && '📋 Control de Calidad ART'}
                            </h2>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6">
                            {selectedItem.tipo === 'reporte' && (() => {
                                const reporte = selectedItem.item as any;
                                const datos = reporte.datos || {};
                                return (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-orange-50 p-4 rounded-lg">
                                                <p className="text-sm text-orange-600 font-medium">ID Reporte</p>
                                                <p className="text-2xl font-bold text-orange-900">#{reporte.id}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <p className="text-sm text-gray-600 font-medium">Estado</p>
                                                <p className="text-lg font-semibold text-gray-900">{reporte.estado}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-600 font-medium mb-1">Tipo de Peligro</p>
                                                <p className="text-gray-900">{datos.tipoPeligro || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600 font-medium mb-1">Nivel de Riesgo</p>
                                                <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${datos.tipoRiesgo === 'Alto' ? 'bg-red-100 text-red-800' :
                                                    datos.tipoRiesgo === 'Medio' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                    {datos.tipoRiesgo || 'N/A'}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600 font-medium mb-1">Zona</p>
                                                <p className="text-gray-900">{datos.zonas || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600 font-medium mb-1">Faena</p>
                                                <p className="text-gray-900">{datos.faena || 'N/A'}</p>
                                            </div>
                                        </div>

                                        {datos.descripcionPeligro && (
                                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                                <p className="text-sm text-orange-800 font-medium mb-2">Descripción del Peligro</p>
                                                <p className="text-gray-900">{datos.descripcionPeligro}</p>
                                            </div>
                                        )}

                                        {datos.imagenes && datos.imagenes.length > 0 && (
                                            <div>
                                                <p className="text-sm text-gray-600 font-medium mb-3">Evidencia Fotográfica</p>
                                                <ImageGallery images={datos.imagenes} title="" />
                                            </div>
                                        )}

                                        <div className="border-t pt-4">
                                            <p className="text-sm text-gray-600 font-medium mb-2">Información del Reporte</p>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <span className="text-gray-500">Reportado por:</span>
                                                    <span className="ml-2 text-gray-900">{reporte.creadoPor.name || reporte.creadoPor.username}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Fecha:</span>
                                                    <span className="ml-2 text-gray-900">{new Date(reporte.createdAt).toLocaleString('es-CL')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Timeline de Trazabilidad */}
                                        <div className="border-t pt-6 mt-6">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                                <svg className="w-5 h-5 text-orange-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                </svg>
                                                Historial de Trazabilidad
                                            </h3>
                                            <AlertTimeline events={buildTimelineEvents(reporte, 'reporte')} />
                                        </div>
                                    </div>
                                );
                            })()}

                            {selectedItem.tipo === 'tarjeta' && (() => {
                                const tarjeta = selectedItem.item as any;
                                const datos = tarjeta.datos || {};
                                return (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-red-50 p-4 rounded-lg">
                                                <p className="text-sm text-red-600 font-medium">ID Tarjeta</p>
                                                <p className="text-2xl font-bold text-red-900">#{tarjeta.id}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <p className="text-sm text-gray-600 font-medium">Estado</p>
                                                <p className="text-lg font-semibold text-gray-900">{tarjeta.estado}</p>
                                            </div>
                                        </div>

                                        <div className="bg-red-100 border-2 border-red-300 p-4 rounded-lg">
                                            <p className="text-sm text-red-800 font-bold mb-2">CAUSAL DE DETENCIÓN</p>
                                            <p className="text-gray-900 font-medium">{datos.causa || 'N/A'}</p>
                                            {datos.causalDetencion && (
                                                <p className="text-gray-800 mt-2">{datos.causalDetencion}</p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-600 font-medium mb-1">Zona</p>
                                                <p className="text-gray-900">{datos.zonas || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600 font-medium mb-1">Faena</p>
                                                <p className="text-gray-900">{datos.faenas || 'N/A'}</p>
                                            </div>
                                        </div>

                                        {datos.descripcionDetallada && (
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <p className="text-sm text-gray-600 font-medium mb-2">Descripción Detallada</p>
                                                <p className="text-gray-900">{datos.descripcionDetallada}</p>
                                            </div>
                                        )}

                                        {datos.imagenes && datos.imagenes.length > 0 && (
                                            <div>
                                                <p className="text-sm text-gray-600 font-medium mb-3">Evidencia Fotográfica</p>
                                                <ImageGallery images={datos.imagenes} title="" />
                                            </div>
                                        )}

                                        <div className="border-t pt-4">
                                            <p className="text-sm text-gray-600 font-medium mb-2">Información de la Tarjeta</p>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <span className="text-gray-500">Emitida por:</span>
                                                    <span className="ml-2 text-gray-900">{tarjeta.creadoPor.name || tarjeta.creadoPor.username}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Fecha:</span>
                                                    <span className="ml-2 text-gray-900">{new Date(tarjeta.createdAt).toLocaleString('es-CL')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Timeline de Trazabilidad */}
                                        <div className="border-t pt-6 mt-6">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                                <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                </svg>
                                                Historial de Trazabilidad
                                            </h3>
                                            <AlertTimeline events={buildTimelineEvents(tarjeta, 'tarjeta')} />
                                        </div>
                                    </div>
                                );
                            })()}

                            {selectedItem.tipo === 'control' && (() => {
                                const control = selectedItem.item as any;
                                const datos = control.datos || {};
                                const itemsCumplidos = datos.itemsControl ? datos.itemsControl.filter((item: any) => item.cumple === 'SI').length : 0;
                                const totalItems = datos.itemsControl ? datos.itemsControl.length : 0;
                                const porcentaje = totalItems > 0 ? Math.round((itemsCumplidos / totalItems) * 100) : 0;

                                // Labels de preguntas para fallback si no están guardadas
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

                                return (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-blue-50 p-4 rounded-lg">
                                                <p className="text-sm text-blue-600 font-medium">ID Control</p>
                                                <p className="text-2xl font-bold text-blue-900">#{control.id}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <p className="text-sm text-gray-600 font-medium">Cumplimiento</p>
                                                <p className="text-lg font-semibold text-gray-900">{itemsCumplidos}/{totalItems} ({porcentaje}%)</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-600 font-medium mb-1">Área</p>
                                                <p className="text-gray-900">{datos.area || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600 font-medium mb-1">Tarea/Actividad</p>
                                                <p className="text-gray-900">{datos.tareaActividad || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600 font-medium mb-1">Zona</p>
                                                <p className="text-gray-900">{datos.zonas || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600 font-medium mb-1">Faena</p>
                                                <p className="text-gray-900">{datos.faenas || 'N/A'}</p>
                                            </div>
                                        </div>

                                        {datos.itemsControl && datos.itemsControl.length > 0 && (
                                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                                <p className="text-sm text-blue-800 font-medium mb-3">Items de Control</p>
                                                <div className="space-y-2">
                                                    {datos.itemsControl.map((item: any, idx: number) => (
                                                        <div key={idx} className="flex items-center justify-between bg-white p-3 rounded">
                                                            <span className="text-sm text-gray-900">
                                                                {item.descripcion || itemsLabels[idx] || `Item ${idx + 1}`}
                                                            </span>
                                                            <span className={`px-3 py-1 rounded text-xs font-medium ${item.cumple === 'SI' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                {item.cumple}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {datos.observaciones && (
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <p className="text-sm text-gray-600 font-medium mb-2">Observaciones</p>
                                                <p className="text-gray-900">{datos.observaciones}</p>
                                            </div>
                                        )}

                                        {datos.imagenes && datos.imagenes.length > 0 && (
                                            <div>
                                                <p className="text-sm text-gray-600 font-medium mb-3">Evidencia Fotográfica</p>
                                                <ImageGallery images={datos.imagenes} title="" />
                                            </div>
                                        )}

                                        <div className="border-t pt-4">
                                            <p className="text-sm text-gray-600 font-medium mb-2">Información del Control</p>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <span className="text-gray-500">Realizado por:</span>
                                                    <span className="ml-2 text-gray-900">{control.creadoPor.name || control.creadoPor.username}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Fecha:</span>
                                                    <span className="ml-2 text-gray-900">{new Date(control.createdAt).toLocaleString('es-CL')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para formularios */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {tipoFormulario === 'seleccion' && (
                            <div className="p-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">¿Qué deseas reportar?</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setTipoFormulario('peligro')}
                                        className="p-6 border-2 border-orange-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all"
                                    >
                                        <svg className="w-12 h-12 text-orange-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <h3 className="font-semibold text-lg text-gray-900 mb-2">Reporte de Peligro</h3>
                                        <p className="text-sm text-gray-600">Reporta una condición peligrosa identificada</p>
                                    </button>
                                    <button
                                        onClick={() => setTipoFormulario('stop')}
                                        className="p-6 border-2 border-red-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all"
                                    >
                                        <svg className="w-12 h-12 text-red-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 715.636 5.636m12.728 12.728L5.636 5.636" />
                                        </svg>
                                        <h3 className="font-semibold text-lg text-gray-900 mb-2">Tarjeta Alto/Stop</h3>
                                        <p className="text-sm text-gray-600">Detiene una actividad insegura</p>
                                    </button>
                                    {/* <button
                                        onClick={() => setTipoFormulario('art')}
                                        className="p-6 border-2 border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                                    >
                                        <svg className="w-12 h-12 text-blue-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <h3 className="font-semibold text-lg text-gray-900 mb-2">Control Calidad ART</h3>
                                        <p className="text-sm text-gray-600">Verifica análisis de riesgo en el trabajo</p>
                                    </button> */}
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="mt-6 w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        )}
                        {tipoFormulario === 'peligro' && (
                            <ReportePeligroForm
                                caminataId={null as any}
                                onSuccess={handleSuccess}
                                onCancel={() => {
                                    setShowModal(false);
                                    setTipoFormulario('seleccion');
                                }}
                            />
                        )}
                        {tipoFormulario === 'stop' && (
                            <TarjetaStopForm
                                caminataId={null as any}
                                onSuccess={handleSuccess}
                                onCancel={() => {
                                    setShowModal(false);
                                    setTipoFormulario('seleccion');
                                }}
                            />
                        )}
                        {tipoFormulario === 'art' && (
                            <ControlCalidadARTForm
                                caminataId={null as any}
                                onSuccess={handleSuccess}
                                onCancel={() => {
                                    setShowModal(false);
                                    setTipoFormulario('seleccion');
                                }}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
