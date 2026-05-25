'use client';

import { useCallback, useEffect, useState } from 'react';
import EstadosServiciosGrid from '@/components/dashboard/EstadosServiciosGrid';
import OperacionesServiciosCard from '@/components/dashboard/OperacionesServiciosCard';
import ServiciosPorEstadoPieChart from '@/components/dashboard/ServiciosPorEstadoPieChart';
import KPIEquiposCondiciones from '@/components/dashboard/KPIEquiposCondiciones';
import KPIConductoresAptos from '@/components/dashboard/KPIConductoresAptos';
import KPITasaAprobacion from '@/components/dashboard/KPITasaAprobacion';
import KPIAceptacionOperarios from '@/components/dashboard/KPIAceptacionOperarios';
import KPINoConformidades from '@/components/dashboard/KPINoConformidades';
import KPIHallazgos from '@/components/dashboard/KPIHallazgos';
import ModalConductoresAptos from '@/components/dashboard/ModalConductoresAptos';
import OperacionesHeader from '@/components/dashboard/operaciones/OperacionesHeader';
import OperacionesFechaFiltro from '@/components/dashboard/operaciones/OperacionesFechaFiltro';
import NoConformidadesModal from '@/components/dashboard/operaciones/modals/NoConformidadesModal';
import ServiciosPorEstadoModal from '@/components/dashboard/operaciones/modals/ServiciosPorEstadoModal';
import AprobacionesModal from '@/components/dashboard/operaciones/modals/AprobacionesModal';
import RechazosOperarioModal from '@/components/dashboard/operaciones/modals/RechazosOperarioModal';
import {
    buildOperacionesExcelFilename,
    buildOperacionesExportRows,
    OPERACIONES_EXCEL_COLS,
} from '@/components/dashboard/operaciones/dashboard-utils';
import type {
    ChecklistFatigaResumen,
    ConductoresAptosDetalleResponse,
    ModalAprobacionesResumen,
    OperacionesExportResponse,
    OperacionesMetrics,
    ServicioAprobacionResumen,
    ServicioCompletado,
    ServicioConNoConformidad,
    ServicioRechazoOperarioResumen,
    ServiciosAprobacionResponse,
    ServiciosCompletadosResponse,
    ServiciosNoConformidadResponse,
    ServiciosRechazoOperarioResponse,
    TipoNoConformidad,
} from '@/components/dashboard/operaciones/dashboard-types';

export const dynamic = 'force-dynamic';

export default function OperacionesPage() {
    const [metrics, setMetrics] = useState<OperacionesMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [filtroFecha, setFiltroFecha] = useState({ desde: '', hasta: '' });
    const [estadoFiltroOperaciones, setEstadoFiltroOperaciones] = useState('TODOS');
    const [exportandoExcelOperaciones, setExportandoExcelOperaciones] = useState(false);

    const [modalNCAbierto, setModalNCAbierto] = useState(false);
    const [modalNCTipo, setModalNCTipo] = useState<TipoNoConformidad | null>(null);
    const [modalNCCargando, setModalNCCargando] = useState(false);
    const [modalNCError, setModalNCError] = useState<string | null>(null);
    const [modalNCServicios, setModalNCServicios] = useState<ServicioConNoConformidad[]>([]);

    const [modalCompletadosAbierto, setModalCompletadosAbierto] = useState(false);
    const [modalCompletadosCargando, setModalCompletadosCargando] = useState(false);
    const [modalCompletadosError, setModalCompletadosError] = useState<string | null>(null);
    const [modalCompletadosServicios, setModalCompletadosServicios] = useState<ServicioCompletado[]>([]);

    const [modalAprobacionesAbierto, setModalAprobacionesAbierto] = useState(false);
    const [modalAprobacionesCargando, setModalAprobacionesCargando] = useState(false);
    const [modalAprobacionesError, setModalAprobacionesError] = useState<string | null>(null);
    const [modalAprobacionesServicios, setModalAprobacionesServicios] = useState<ServicioAprobacionResumen[]>([]);
    const [modalAprobacionesResumen, setModalAprobacionesResumen] = useState<ModalAprobacionesResumen>({ total: 0, aprobadas: 0, rechazadas: 0 });

    const [modalRechazosOperarioAbierto, setModalRechazosOperarioAbierto] = useState(false);
    const [modalRechazosOperarioCargando, setModalRechazosOperarioCargando] = useState(false);
    const [modalRechazosOperarioError, setModalRechazosOperarioError] = useState<string | null>(null);
    const [modalRechazosOperarioServicios, setModalRechazosOperarioServicios] = useState<ServicioRechazoOperarioResumen[]>([]);
    const [modalRechazosOperarioTotal, setModalRechazosOperarioTotal] = useState(0);

    const [modalConductoresAptosAbierto, setModalConductoresAptosAbierto] = useState(false);
    const [modalConductoresAptosCargando, setModalConductoresAptosCargando] = useState(false);
    const [modalConductoresAptosError, setModalConductoresAptosError] = useState<string | null>(null);
    const [modalConductoresAptosChecklists, setModalConductoresAptosChecklists] = useState<ChecklistFatigaResumen[]>([]);
    const [modalConductoresAptosResumen, setModalConductoresAptosResumen] = useState({ total: 0, aptos: 0, noAptos: 0, conReemplazo: 0 });

    const fetchMetrics = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (filtroFecha.desde) params.set('fechaInicio', filtroFecha.desde);
            if (filtroFecha.hasta) params.set('fechaFin', filtroFecha.hasta);

            const url = params.toString()
                ? `/api/dashboard/metrics?${params}`
                : '/api/dashboard/metrics';

            const response = await fetch(url);
            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                const msg = body?.error || `Error ${response.status}`;
                throw new Error(msg);
            }

            const data = await response.json();
            setMetrics(data);
            setError(null);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error al cargar los datos de operaciones';
            setError(msg);
            console.error('Error cargando métricas de operaciones:', err);
        } finally {
            setLoading(false);
        }
    }, [filtroFecha]);

    useEffect(() => {
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 120000);
        return () => clearInterval(interval);
    }, [fetchMetrics]);

    const handleAplicarFiltro = () => {
        setLoading(true);
        setFiltroFecha({ desde: fechaDesde, hasta: fechaHasta });
    };

    const handleLimpiarFiltro = () => {
        setFechaDesde('');
        setFechaHasta('');
        setLoading(true);
        setFiltroFecha({ desde: '', hasta: '' });
    };

    const handleExportarOperacionesExcel = useCallback(async () => {
        setExportandoExcelOperaciones(true);

        try {
            const params = new URLSearchParams();
            if (filtroFecha.desde) params.set('fechaDesde', filtroFecha.desde);
            if (filtroFecha.hasta) params.set('fechaHasta', filtroFecha.hasta);
            if (estadoFiltroOperaciones) params.set('estado', estadoFiltroOperaciones);

            const url = params.toString()
                ? `/api/servicios/todos?${params.toString()}`
                : '/api/servicios/todos';

            const response = await fetch(url);
            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                const msg = (payload as { error?: string })?.error || `Error ${response.status}`;
                throw new Error(msg);
            }

            const servicios = Array.isArray((payload as OperacionesExportResponse).servicios)
                ? (payload as OperacionesExportResponse).servicios
                : [];

            if (servicios.length === 0) {
                window.alert('No hay operaciones para exportar con los filtros actuales.');
                return;
            }

            const rows = buildOperacionesExportRows(servicios);
            const XLSX = await import('xlsx');
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(rows);

            if (worksheet['!ref']) {
                worksheet['!autofilter'] = { ref: worksheet['!ref'] };
            }

            worksheet['!cols'] = OPERACIONES_EXCEL_COLS;
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Operaciones');

            const filename = buildOperacionesExcelFilename({
                fechaDesde: filtroFecha.desde,
                fechaHasta: filtroFecha.hasta,
                estadoFiltro: estadoFiltroOperaciones,
            });

            XLSX.writeFile(workbook, filename);
        } catch (err) {
            console.error('Error exportando operaciones:', err);
            window.alert('No se pudo exportar el Excel de operaciones. Intenta nuevamente.');
        } finally {
            setExportandoExcelOperaciones(false);
        }
    }, [filtroFecha.desde, filtroFecha.hasta, estadoFiltroOperaciones]);

    const abrirModalNoConformidades = async (tipo: TipoNoConformidad) => {
        setModalNCAbierto(true);
        setModalCompletadosAbierto(false);
        setModalAprobacionesAbierto(false);
        setModalRechazosOperarioAbierto(false);
        setModalConductoresAptosAbierto(false);

        setModalNCTipo(tipo);
        setModalNCCargando(true);
        setModalNCError(null);
        setModalNCServicios([]);

        try {
            const params = new URLSearchParams();
            params.set('tipo', tipo);
            if (filtroFecha.desde) params.set('fechaInicio', filtroFecha.desde);
            if (filtroFecha.hasta) params.set('fechaFin', filtroFecha.hasta);

            const response = await fetch(`/api/dashboard/no-conformidades/servicios?${params.toString()}`);
            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                const msg = body?.error || `Error ${response.status}`;
                throw new Error(msg);
            }

            const payload: ServiciosNoConformidadResponse = await response.json();
            setModalNCServicios(Array.isArray(payload.servicios) ? payload.servicios : []);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'No se pudo cargar el detalle de no conformidades';
            setModalNCError(msg);
        } finally {
            setModalNCCargando(false);
        }
    };

    const abrirModalServiciosCompletados = async () => {
        setModalCompletadosAbierto(true);
        setModalNCAbierto(false);
        setModalAprobacionesAbierto(false);
        setModalRechazosOperarioAbierto(false);
        setModalConductoresAptosAbierto(false);

        setModalCompletadosCargando(true);
        setModalCompletadosError(null);
        setModalCompletadosServicios([]);

        try {
            const params = new URLSearchParams();
            if (filtroFecha.desde) params.set('fechaDesde', filtroFecha.desde);
            if (filtroFecha.hasta) params.set('fechaHasta', filtroFecha.hasta);

            const response = await fetch(`/api/servicios/todos?${params.toString()}`);
            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                const msg = body?.error || `Error ${response.status}`;
                throw new Error(msg);
            }

            const payload: ServiciosCompletadosResponse = await response.json();
            setModalCompletadosServicios(Array.isArray(payload.servicios) ? payload.servicios : []);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'No se pudo cargar el detalle de servicios';
            setModalCompletadosError(msg);
        } finally {
            setModalCompletadosCargando(false);
        }
    };

    const abrirModalAprobaciones = async () => {
        setModalAprobacionesAbierto(true);
        setModalNCAbierto(false);
        setModalCompletadosAbierto(false);
        setModalRechazosOperarioAbierto(false);
        setModalConductoresAptosAbierto(false);

        setModalAprobacionesCargando(true);
        setModalAprobacionesError(null);
        setModalAprobacionesServicios([]);
        setModalAprobacionesResumen({ total: 0, aprobadas: 0, rechazadas: 0 });

        try {
            const params = new URLSearchParams();
            if (filtroFecha.desde) params.set('fechaInicio', filtroFecha.desde);
            if (filtroFecha.hasta) params.set('fechaFin', filtroFecha.hasta);

            const url = params.toString()
                ? `/api/dashboard/aprobaciones/servicios?${params.toString()}`
                : '/api/dashboard/aprobaciones/servicios';

            const response = await fetch(url);
            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                const msg = body?.error || `Error ${response.status}`;
                throw new Error(msg);
            }

            const payload: ServiciosAprobacionResponse = await response.json();
            setModalAprobacionesServicios(Array.isArray(payload.servicios) ? payload.servicios : []);
            setModalAprobacionesResumen({
                total: payload.total || 0,
                aprobadas: payload.aprobadas || 0,
                rechazadas: payload.rechazadas || 0,
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'No se pudo cargar el detalle de aprobaciones';
            setModalAprobacionesError(msg);
        } finally {
            setModalAprobacionesCargando(false);
        }
    };

    const abrirModalRechazosOperario = async () => {
        setModalRechazosOperarioAbierto(true);
        setModalNCAbierto(false);
        setModalCompletadosAbierto(false);
        setModalAprobacionesAbierto(false);
        setModalConductoresAptosAbierto(false);

        setModalRechazosOperarioCargando(true);
        setModalRechazosOperarioError(null);
        setModalRechazosOperarioServicios([]);
        setModalRechazosOperarioTotal(0);

        try {
            const params = new URLSearchParams();
            if (filtroFecha.desde) params.set('fechaInicio', filtroFecha.desde);
            if (filtroFecha.hasta) params.set('fechaFin', filtroFecha.hasta);

            const url = params.toString()
                ? `/api/dashboard/operarios/rechazos/servicios?${params.toString()}`
                : '/api/dashboard/operarios/rechazos/servicios';

            const response = await fetch(url);
            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                const msg = body?.error || `Error ${response.status}`;
                throw new Error(msg);
            }

            const payload: ServiciosRechazoOperarioResponse = await response.json();
            setModalRechazosOperarioServicios(Array.isArray(payload.servicios) ? payload.servicios : []);
            setModalRechazosOperarioTotal(payload.total || 0);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'No se pudo cargar el detalle de rechazos de operario';
            setModalRechazosOperarioError(msg);
        } finally {
            setModalRechazosOperarioCargando(false);
        }
    };

    const abrirModalConductoresAptos = async () => {
        setModalConductoresAptosAbierto(true);
        setModalNCAbierto(false);
        setModalCompletadosAbierto(false);
        setModalAprobacionesAbierto(false);
        setModalRechazosOperarioAbierto(false);

        setModalConductoresAptosCargando(true);
        setModalConductoresAptosError(null);
        setModalConductoresAptosChecklists([]);
        setModalConductoresAptosResumen({ total: 0, aptos: 0, noAptos: 0, conReemplazo: 0 });

        try {
            const params = new URLSearchParams();
            if (filtroFecha.desde) params.set('fechaInicio', filtroFecha.desde);
            if (filtroFecha.hasta) params.set('fechaFin', filtroFecha.hasta);

            const url = params.toString()
                ? `/api/dashboard/conductores-aptos/checklists?${params.toString()}`
                : '/api/dashboard/conductores-aptos/checklists';

            const response = await fetch(url);
            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                const msg = body?.error || `Error ${response.status}`;
                throw new Error(msg);
            }

            const payload: ConductoresAptosDetalleResponse = await response.json();
            setModalConductoresAptosChecklists(Array.isArray(payload.checklists) ? payload.checklists : []);
            setModalConductoresAptosResumen({
                total: payload.total || 0,
                aptos: payload.aptos || 0,
                noAptos: payload.noAptos || 0,
                conReemplazo: payload.conReemplazo || 0,
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'No se pudo cargar el detalle de conductores aptos';
            setModalConductoresAptosError(msg);
        } finally {
            setModalConductoresAptosCargando(false);
        }
    };

    const modalTituloNoConformidades = modalNCTipo === 'tracto'
        ? 'Servicios con no conformidades de tractocamión'
        : 'Servicios con no conformidades de semirremolque';

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <OperacionesHeader
                    onExportarExcel={handleExportarOperacionesExcel}
                    exportandoExcel={exportandoExcelOperaciones}
                />

                <OperacionesFechaFiltro
                    fechaDesde={fechaDesde}
                    fechaHasta={fechaHasta}
                    filtroFecha={filtroFecha}
                    onFechaDesdeChange={setFechaDesde}
                    onFechaHastaChange={setFechaHasta}
                    onAplicarFiltro={handleAplicarFiltro}
                    onLimpiarFiltro={handleLimpiarFiltro}
                />

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">Cargando operaciones...</p>
                        </div>
                    </div>
                ) : error || !metrics ? (
                    <div className="flex items-center justify-center py-16">
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
                ) : (
                    <>
                        <EstadosServiciosGrid serviciosPorEstado={metrics.serviciosPorEstado} />

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            <ServiciosPorEstadoPieChart
                                serviciosPorEstado={metrics.serviciosPorEstado}
                                onChartClick={abrirModalServiciosCompletados}
                            />
                            <KPIEquiposCondiciones
                                titulo="Semi-remolques en Condiciones"
                                porcentaje={
                                    metrics.seguridad.totalChecklistEquipo > 0
                                        ? Math.round(
                                            ((metrics.seguridad.totalChecklistEquipo - metrics.alertas.equiposConProblemas) /
                                                metrics.seguridad.totalChecklistEquipo) * 100,
                                        )
                                        : 0
                                }
                                equiposConProblemas={metrics.alertas.equiposConProblemas}
                                totalChecklists={metrics.seguridad.totalChecklistEquipo}
                                descripcion="Porcentaje de semirremolques que aprobaron ChecklistEquipo sin no conformidades críticas (servicios desde pendiente de aprobacion en adelante, incluyendo rechazados)."
                                onChartClick={() => abrirModalNoConformidades('equipo')}
                            />
                            <KPIEquiposCondiciones
                                titulo="Tracto Camiones en Condiciones"
                                porcentaje={
                                    metrics.seguridad.totalChecklistTracto > 0
                                        ? Math.round(
                                            ((metrics.seguridad.totalChecklistTracto - metrics.alertas.tractosConProblemas) /
                                                metrics.seguridad.totalChecklistTracto) * 100,
                                        )
                                        : 0
                                }
                                equiposConProblemas={metrics.alertas.tractosConProblemas}
                                totalChecklists={metrics.seguridad.totalChecklistTracto}
                                descripcion="Porcentaje de tracto camiones que aprobaron ChecklistTractoCamion sin no conformidades críticas (servicios desde pendiente de aprobacion en adelante, incluyendo rechazados)."
                                onChartClick={() => abrirModalNoConformidades('tracto')}
                            />
                            <KPIConductoresAptos
                                porcentaje={metrics.seguridad.porcentajeConductoresAptos}
                                noAptos={metrics.seguridad.conductoresNoAptos}
                                reemplazo={metrics.seguridad.conductoresReemplazo}
                                total={metrics.seguridad.totalChecklistFatiga}
                                onChartClick={abrirModalConductoresAptos}
                            />
                        </div>

                        <div className="mb-8">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Indicadores de Eficiencia Operativa</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <KPITasaAprobacion
                                    porcentaje={metrics.aprobaciones.tasaAprobacion}
                                    totalAprobaciones={metrics.aprobaciones.totalAprobaciones}
                                    aprobados={metrics.aprobaciones.aprobadas}
                                    rechazados={metrics.aprobaciones.rechazadas}
                                    onChartClick={abrirModalAprobaciones}
                                />
                                <KPIAceptacionOperarios
                                    porcentaje={metrics.aceptacionOperarios.porcentaje}
                                    totalAsignados={metrics.aceptacionOperarios.totalAsignados}
                                    aceptados={metrics.aceptacionOperarios.aceptados}
                                    rechazados={metrics.aceptacionOperarios.rechazados}
                                    sinRespuesta={metrics.aceptacionOperarios.sinRespuesta}
                                    onChartClick={abrirModalRechazosOperario}
                                />
                                <KPINoConformidades fechaDesde={filtroFecha.desde} fechaHasta={filtroFecha.hasta} />
                                <KPIHallazgos fechaDesde={filtroFecha.desde} fechaHasta={filtroFecha.hasta} />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="flex-1 border-t border-gray-200" />
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">Análisis y Operaciones</span>
                            <div className="flex-1 border-t border-gray-200" />
                        </div>

                        <div className="mb-8">
                            <OperacionesServiciosCard
                                fechaDesde={filtroFecha.desde}
                                fechaHasta={filtroFecha.hasta}
                                estadoFiltro={estadoFiltroOperaciones}
                                onEstadoFiltroChange={setEstadoFiltroOperaciones}
                            />
                        </div>
                    </>
                )}

                <ModalConductoresAptos
                    open={modalConductoresAptosAbierto}
                    onClose={() => setModalConductoresAptosAbierto(false)}
                    loading={modalConductoresAptosCargando}
                    error={modalConductoresAptosError}
                    checklists={modalConductoresAptosChecklists}
                    resumen={modalConductoresAptosResumen}
                />

                <NoConformidadesModal
                    open={modalNCAbierto}
                    titulo={modalTituloNoConformidades}
                    loading={modalNCCargando}
                    error={modalNCError}
                    servicios={modalNCServicios}
                    onClose={() => {
                        setModalNCAbierto(false);
                        setModalNCTipo(null);
                    }}
                />

                <ServiciosPorEstadoModal
                    open={modalCompletadosAbierto}
                    loading={modalCompletadosCargando}
                    error={modalCompletadosError}
                    servicios={modalCompletadosServicios}
                    onClose={() => setModalCompletadosAbierto(false)}
                />

                <AprobacionesModal
                    open={modalAprobacionesAbierto}
                    loading={modalAprobacionesCargando}
                    error={modalAprobacionesError}
                    resumen={modalAprobacionesResumen}
                    servicios={modalAprobacionesServicios}
                    onClose={() => setModalAprobacionesAbierto(false)}
                />

                <RechazosOperarioModal
                    open={modalRechazosOperarioAbierto}
                    loading={modalRechazosOperarioCargando}
                    error={modalRechazosOperarioError}
                    total={modalRechazosOperarioTotal}
                    servicios={modalRechazosOperarioServicios}
                    onClose={() => setModalRechazosOperarioAbierto(false)}
                />
            </div>
        </div>
    );
}
