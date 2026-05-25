'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

interface Alerta {
    id: number;
    tipo: 'TARJETA_STOP' | 'REPORTE_PENDIENTE' | 'REPORTE_PENDIENTE_VERIFICACION' | 'REPORTE_CERRADO' | 'CONTROL_ART' | 'CAMINATA_ABIERTA' | 'CAMINATA_CERRADA';
    estado?: string;
    fecha: string;
    fechaCierre?: string;
    fechaVerificacion?: string;
    creadoPor: string;
    rol: string;
    responsableCierre?: string | null;
    responsableVerificacion?: string | null;
    caminata: {
        codigo: string;
        zona: string;
        faena: string;
    } | null;
    datos: any;
    comentarioCierre?: string;
    comentarioVerificacion?: string;
    esIndependiente?: boolean;
    asignadoNombre?: string;
}

interface AlertasSeguridadData {
    tarjetasStop: Alerta[];
    reportesPendientes: Alerta[];
    reportesPendientesVerificacion: Alerta[];
    reportesCerrados: Alerta[];
    controlesART: Alerta[];
    caminatasAbiertas: Alerta[];
    caminatasCerradas: Alerta[];
    todasLasAlertas: Alerta[];
    estadisticas: {
        totalTarjetasStop: number;
        totalTarjetasStopCerradas: number;
        totalReportesPeligro: number;
        totalReportesPendientes: number;
        totalReportesPendientesVerificacion: number;
        totalReportesCerrados: number;
        totalControlesART: number;
        total: number;
        totalCaminatas: number;
        totalCaminatasAbiertas: number;
        totalCaminatasCerradas: number;
        totalProgramadas: number;
        totalNoProgramadas: number;
    };
}

interface AlertasSeguridadCardProps {
    fechaInicio?: string;
    fechaFin?: string;
    /** Total de actividades calculado por la TablaActividades (programadas + no programadas) */
    totalActividadesTabla?: number | null;
}

export default function AlertasSeguridadCard({ fechaInicio = '', fechaFin = '', totalActividadesTabla }: AlertasSeguridadCardProps) {
    const [alertas, setAlertas] = useState<AlertasSeguridadData | null>(null);
    const [loading, setLoading] = useState(true);
    const [filtroTipo, setFiltroTipo] = useState<'TODAS' | 'TARJETA_STOP' | 'TARJETA_STOP_ABIERTA' | 'TARJETA_STOP_CERRADA' | 'REPORTE_PENDIENTE' | 'REPORTE_PENDIENTE_VERIFICACION' | 'REPORTE_CERRADO' | 'CONTROL_ART' | 'CAMINATA_ABIERTA' | 'CAMINATA_CERRADA'>('TODAS');
    const [localFechaInicio, setLocalFechaInicio] = useState(fechaInicio);
    const [localFechaFin, setLocalFechaFin] = useState(fechaFin);

    // Sincronizar fechas desde la Tabla de Actividades cuando cambian
    useEffect(() => {
        setLocalFechaInicio(fechaInicio);
        setLocalFechaFin(fechaFin);
    }, [fechaInicio, fechaFin]);

    const fetchAlertas = useCallback(async (fi: string, ff: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (fi) params.set('fechaInicio', fi);
            if (ff) params.set('fechaFin', ff);
            const response = await fetch(`/api/dashboard/alertas-seguridad?${params}`);
            if (!response.ok) throw new Error('Error al cargar alertas');
            const data = await response.json();
            setAlertas(data);
        } catch (error) {
            console.error('Error al cargar alertas de seguridad:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Re-fetch cada vez que cambian las fechas locales
    useEffect(() => {
        fetchAlertas(localFechaInicio, localFechaFin);
    }, [localFechaInicio, localFechaFin, fetchAlertas]);

    const getAlertasFiltradas = () => {
        if (!alertas) return [];

        let alertasPorTipo: Alerta[] = [];

        switch (filtroTipo) {
            case 'TARJETA_STOP':
                alertasPorTipo = alertas.tarjetasStop;
                break;
            case 'TARJETA_STOP_ABIERTA':
                alertasPorTipo = alertas.tarjetasStop.filter(t => t.estado !== 'CERRADO');
                break;
            case 'TARJETA_STOP_CERRADA':
                alertasPorTipo = alertas.tarjetasStop.filter(t => t.estado === 'CERRADO');
                break;
            case 'REPORTE_PENDIENTE':
                alertasPorTipo = alertas.reportesPendientes;
                break;
            case 'REPORTE_PENDIENTE_VERIFICACION':
                alertasPorTipo = alertas.reportesPendientesVerificacion;
                break;
            case 'REPORTE_CERRADO':
                alertasPorTipo = alertas.reportesCerrados;
                break;
            case 'CONTROL_ART':
                alertasPorTipo = alertas.controlesART;
                break;
            case 'CAMINATA_ABIERTA':
                alertasPorTipo = alertas.caminatasAbiertas || [];
                break;
            case 'CAMINATA_CERRADA':
                alertasPorTipo = alertas.caminatasCerradas || [];
                break;
            default:
                alertasPorTipo = alertas.todasLasAlertas;
        }

        // El filtro de fechas ya se aplica en el servidor al re-fetch;
        // aquí solo devolvemos los items filtrados por tipo.
        return alertasPorTipo;
    };

    const getTipoLabel = (tipo: string) => {
        switch (tipo) {
            case 'TARJETA_STOP':
                return 'Tarjeta Stop';
            case 'REPORTE_PENDIENTE':
                return 'Reporte Pendiente';
            case 'REPORTE_PENDIENTE_VERIFICACION':
                return 'Pendiente Verificación';
            case 'REPORTE_CERRADO':
                return 'Reporte Cerrado';
            case 'CONTROL_ART':
                return 'Control ART';
            case 'CAMINATA_ABIERTA':
                return 'Caminata Activa';
            case 'CAMINATA_CERRADA':
                return 'Caminata Cerrada';
            default:
                return tipo;
        }
    };

    const getTipoBadgeColor = (tipo: string) => {
        switch (tipo) {
            case 'TARJETA_STOP':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'REPORTE_PENDIENTE':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'REPORTE_PENDIENTE_VERIFICACION':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'REPORTE_CERRADO':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'CONTROL_ART':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'CAMINATA_ABIERTA':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'CAMINATA_CERRADA':
                return 'bg-teal-100 text-teal-800 border-teal-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatFecha = (fecha: string) => {
        const date = new Date(fecha);
        return date.toLocaleString('es-CL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTipoUrl = (tipo: string) => {
        switch (tipo) {
            case 'TARJETA_STOP':
                return 'tarjeta-stop';
            case 'REPORTE_PELIGRO':
            case 'REPORTE_PENDIENTE':
            case 'REPORTE_PENDIENTE_VERIFICACION':
            case 'REPORTE_CERRADO':
                return 'reporte-peligro';
            case 'CONTROL_ART':
                return 'control-art';
            default:
                return 'reporte-peligro'; // Default fallback
        }
    };

    const getAlertaUrl = (alerta: Alerta) => {
        if (alerta.tipo === 'CAMINATA_ABIERTA' || alerta.tipo === 'CAMINATA_CERRADA') {
            return `/caminatas/${alerta.id}`;
        }
        return `/dashboard/alertas/${getTipoUrl(alerta.tipo)}/${alerta.id}`;
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Historial de Actividades</h2>
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    if (!alertas) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Historial de Actividades</h2>
                <p className="text-gray-500">Error al cargar las alertas</p>
            </div>
        );
    }

    const totalActividadesHistorial = alertas.estadisticas.total;

    const alertasFiltradas = getAlertasFiltradas();

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Historial de Actividades</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Registro de tarjetas stop, reportes de peligro, controles ART y caminatas de seguridad
                    </p>
                    {totalActividadesTabla != null && (
                        <p className="text-xs text-indigo-600 mt-1">
                            Total en Tabla de Actividades: <strong>{totalActividadesTabla}</strong>
                            {' '}· Total en Historial: <strong>{totalActividadesHistorial}</strong>
                        </p>
                    )}
                </div>
                <button
                    onClick={() => fetchAlertas(localFechaInicio, localFechaFin)}
                    className="px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                    Actualizar
                </button>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Actividades</p>
                            <p className="text-2xl font-bold text-gray-900">{alertas.estadisticas.total}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                <span className="text-indigo-600 font-medium">{alertas.estadisticas.totalProgramadas}</span> prog.
                                {' · '}
                                <span className="text-gray-500 font-medium">{alertas.estadisticas.totalNoProgramadas}</span> no prog.
                            </p>
                        </div>
                        <div className="bg-gray-200 rounded-full p-3">
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-red-50 rounded-lg p-4 border border-red-300">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-red-700 font-medium">T. Stop Abiertas</p>
                            <p className="text-2xl font-bold text-red-900">{alertas.estadisticas.totalTarjetasStop - alertas.estadisticas.totalTarjetasStopCerradas}</p>
                        </div>
                        <div className="bg-red-300 rounded-full p-3">
                            <svg className="w-6 h-6 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-red-600">T. Stop Cerradas</p>
                            <p className="text-2xl font-bold text-red-900">{alertas.estadisticas.totalTarjetasStopCerradas}</p>
                        </div>
                        <div className="bg-red-200 rounded-full p-3">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-yellow-600">Rep. Pendientes</p>
                            <p className="text-2xl font-bold text-yellow-900">{alertas.estadisticas.totalReportesPendientes}</p>
                        </div>
                        <div className="bg-yellow-200 rounded-full p-3">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-purple-600">Rep. Pend. Verif.</p>
                            <p className="text-2xl font-bold text-purple-900">{alertas.estadisticas.totalReportesPendientesVerificacion}</p>
                        </div>
                        <div className="bg-purple-200 rounded-full p-3">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-600">Rep. Cerrados</p>
                            <p className="text-2xl font-bold text-green-900">{alertas.estadisticas.totalReportesCerrados}</p>
                        </div>
                        <div className="bg-green-200 rounded-full p-3">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-600">Controles ART</p>
                            <p className="text-2xl font-bold text-blue-900">{alertas.estadisticas.totalControlesART}</p>
                        </div>
                        <div className="bg-blue-200 rounded-full p-3">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

            </div>

            {/* Filtros */}
            <div className="mb-6">
                {/* Filtros por Tipo */}
                <div className="flex flex-wrap gap-2 mb-4">
                    <button
                        onClick={() => setFiltroTipo('TODAS')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtroTipo === 'TODAS'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Todas ({alertas.estadisticas.total})
                    </button>
                    <button
                        onClick={() => setFiltroTipo('TARJETA_STOP_ABIERTA')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtroTipo === 'TARJETA_STOP_ABIERTA'
                            ? 'bg-red-700 text-white'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                    >
                        T. Stop Abiertas ({alertas.estadisticas.totalTarjetasStop - alertas.estadisticas.totalTarjetasStopCerradas})
                    </button>
                    <button
                        onClick={() => setFiltroTipo('TARJETA_STOP_CERRADA')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtroTipo === 'TARJETA_STOP_CERRADA'
                            ? 'bg-red-600 text-white'
                            : 'bg-red-50 text-red-700 hover:bg-red-100'
                            }`}
                    >
                        T. Stop Cerradas ({alertas.estadisticas.totalTarjetasStopCerradas})
                    </button>
                    <button
                        onClick={() => setFiltroTipo('REPORTE_PENDIENTE')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtroTipo === 'REPORTE_PENDIENTE'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                            }`}
                    >
                        Rep. Pendientes ({alertas.estadisticas.totalReportesPendientes})
                    </button>
                    <button
                        onClick={() => setFiltroTipo('REPORTE_PENDIENTE_VERIFICACION')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtroTipo === 'REPORTE_PENDIENTE_VERIFICACION'
                            ? 'bg-purple-600 text-white'
                            : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                            }`}
                    >
                        Rep. Pend. Verificación ({alertas.estadisticas.totalReportesPendientesVerificacion})
                    </button>
                    <button
                        onClick={() => setFiltroTipo('REPORTE_CERRADO')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtroTipo === 'REPORTE_CERRADO'
                            ? 'bg-green-600 text-white'
                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                            }`}
                    >
                        Rep. Cerrados ({alertas.estadisticas.totalReportesCerrados})
                    </button>
                    <button
                        onClick={() => setFiltroTipo('CONTROL_ART')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtroTipo === 'CONTROL_ART'
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                            }`}
                    >
                        Controles ART ({alertas.estadisticas.totalControlesART})
                    </button>
                    <button
                        onClick={() => setFiltroTipo('CAMINATA_ABIERTA')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtroTipo === 'CAMINATA_ABIERTA'
                            ? 'bg-orange-600 text-white'
                            : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                            }`}
                    >
                        Caminatas Abiertas ({alertas.estadisticas.totalCaminatasAbiertas})
                    </button>
                    <button
                        onClick={() => setFiltroTipo('CAMINATA_CERRADA')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtroTipo === 'CAMINATA_CERRADA'
                            ? 'bg-teal-600 text-white'
                            : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                            }`}
                    >
                        Caminatas Cerradas ({alertas.estadisticas.totalCaminatasCerradas})
                    </button>
                </div>

                {/* Filtros por Fecha */}
                <div className="flex flex-wrap items-end gap-4 pt-4 border-t border-gray-100 mt-2">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Desde</label>
                        <input
                            type="date"
                            value={localFechaInicio}
                            onChange={e => setLocalFechaInicio(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Hasta</label>
                        <input
                            type="date"
                            value={localFechaFin}
                            onChange={e => setLocalFechaFin(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        />
                    </div>
                    <button
                        onClick={() => { setLocalFechaInicio(''); setLocalFechaFin(''); }}
                        className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                    >
                        Limpiar fechas
                    </button>
                    {(fechaInicio || fechaFin) && (localFechaInicio !== fechaInicio || localFechaFin !== fechaFin) && (
                        <button
                            onClick={() => { setLocalFechaInicio(fechaInicio); setLocalFechaFin(fechaFin); }}
                            className="px-3 py-1.5 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
                        >
                            Sincronizar con tabla
                        </button>
                    )}
                    {(localFechaInicio || localFechaFin) && (
                        <span className="text-xs text-gray-500 self-center">
                            Mostrando actividades
                            {localFechaInicio && <> desde <strong>{localFechaInicio}</strong></>}
                            {localFechaFin && <> hasta <strong>{localFechaFin}</strong></>}
                        </span>
                    )}
                </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Fecha
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tipo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Creado por
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Procedencia
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Zona / Faena
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {alertasFiltradas.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    No hay alertas de seguridad registradas
                                </td>
                            </tr>
                        ) : (
                            alertasFiltradas.map((alerta) => (
                                <tr key={`${alerta.tipo}-${alerta.id}`} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatFecha(alerta.fecha)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-1">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getTipoBadgeColor(alerta.tipo)}`}>
                                                {getTipoLabel(alerta.tipo)}
                                            </span>
                                            {(alerta.tipo === 'TARJETA_STOP' || alerta.tipo === 'REPORTE_PENDIENTE' || alerta.tipo === 'REPORTE_PENDIENTE_VERIFICACION' || alerta.tipo === 'REPORTE_CERRADO' || alerta.tipo === 'CONTROL_ART') && (
                                                <span
                                                    title={alerta.esIndependiente ? 'Registrada fuera de una caminata' : 'Originada desde una caminata'}
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full w-fit ${alerta.esIndependiente ? 'bg-gray-100 text-gray-600' : 'bg-indigo-100 text-indigo-700'}`}
                                                >
                                                    {alerta.esIndependiente ? (
                                                        <>
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                            Independiente
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                                                            Caminata
                                                        </>
                                                    )}
                                                </span>
                                            )}
                                            {alerta.tipo === 'TARJETA_STOP' && (
                                                <span className={`px-2 py-0.5 inline-flex text-xs font-medium rounded-full w-fit ${alerta.estado === 'CERRADO'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {alerta.estado === 'CERRADO' ? 'Cerrada' : 'Abierta'}
                                                </span>
                                            )}
                                            {(alerta.tipo === 'CAMINATA_ABIERTA' || alerta.tipo === 'CAMINATA_CERRADA') && (
                                                <span className={`px-2 py-0.5 inline-flex text-xs font-medium rounded-full w-fit ${alerta.esIndependiente
                                                    ? 'bg-gray-100 text-gray-700'
                                                    : 'bg-indigo-100 text-indigo-700'
                                                    }`}>
                                                    {alerta.esIndependiente ? 'No programada' : 'Asignada'}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <div className="text-gray-900 font-medium">{alerta.creadoPor}</div>
                                        <div className="text-gray-500 text-xs">{alerta.rol}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {alerta.esIndependiente === false ? (
                                            <span className="px-2 py-0.5 inline-flex text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">
                                                Programada
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 inline-flex text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                                                No programada
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {(alerta.tipo === 'CAMINATA_ABIERTA' || alerta.tipo === 'CAMINATA_CERRADA') && alerta.asignadoNombre ? (
                                            <div>
                                                <div className="font-medium">{alerta.caminata?.zona || '-'}</div>
                                                <div className="text-gray-500 text-xs">{alerta.caminata?.faena || '-'}</div>
                                                <div className="text-indigo-600 text-xs mt-0.5">Asignado a: {alerta.asignadoNombre}</div>
                                            </div>
                                        ) : alerta.caminata && (alerta.caminata.zona || alerta.caminata.faena) ? (
                                            <div>
                                                <div className="font-medium">{alerta.caminata.zona || '-'}</div>
                                                <div className="text-gray-500 text-xs">{alerta.caminata.faena || '-'}</div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <Link
                                            href={getAlertaUrl(alerta)}
                                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium hover:underline"
                                        >
                                            Ver detalles
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 text-sm text-gray-500 text-center">
                {alertasFiltradas.length === 0
                    ? 'No hay actividades para los filtros seleccionados'
                    : (
                        <>
                            Mostrando <strong>{alertasFiltradas.length}</strong> de <strong>{filtroTipo === 'TODAS' ? alertas.estadisticas.total : alertasFiltradas.length}</strong> actividad{alertasFiltradas.length !== 1 ? 'es' : ''}
                            {(filtroTipo !== 'TODAS' || localFechaInicio || localFechaFin) && ' (con filtros aplicados)'}
                        </>
                    )
                }
            </div>
        </div>
    );
}
