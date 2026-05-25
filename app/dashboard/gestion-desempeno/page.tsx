'use client';

import Link from 'next/link';
import BarrasTiposActividades from './components/BarrasTiposActividades';
import ActividadesPorRolChart from './components/ActividadesPorRolChart';
import ComparativoProgramadasNoProgramadasChart from './components/ComparativoProgramadasNoProgramadasChart';
import CumplimientoPorTipoActividadChart from './components/CumplimientoPorTipoActividadChart';
import CumplimientoFueraPlazoIndicator from './components/CumplimientoFueraPlazoIndicator';
import DistribucionEstatusUsuarios from './components/DistribucionEstatusUsuarios';
import FiltrosDesempeno from './components/FiltrosDesempeno';
import ProgramadasPorTipoPieChart from './components/ProgramadasPorTipoPieChart';
import ResumenDesempeno from './components/ResumenDesempeno';
import { useGestionDesempenoData } from './useGestionDesempenoData';

export const dynamic = 'force-dynamic';

export default function GestionDesempenoPage() {
    const {
        rows,
        detalles,
        users,
        canFilterByUser,
        loading,
        error,
        fechaDesde,
        fechaHasta,
        selectedUserId,
        filtro,
        detalleActivo,
        metrics,
        setFechaDesde,
        setFechaHasta,
        setSelectedUserId,
        aplicarFiltro,
        limpiarFiltro,
        toggleDetalle,
    } = useGestionDesempenoData();

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <div className="flex items-center justify-between gap-3">
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard Modulo Seguridad</h1>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm font-medium"
                        >
                            Ir a Estados de cumplimiento
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>

                <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
                    <FiltrosDesempeno
                        fechaDesde={fechaDesde}
                        fechaHasta={fechaHasta}
                        selectedUserId={selectedUserId}
                        canFilterByUser={canFilterByUser}
                        users={users}
                        hasFiltroActivo={Boolean(filtro.desde || filtro.hasta)}
                        onFechaDesdeChange={setFechaDesde}
                        onFechaHastaChange={setFechaHasta}
                        onSelectedUserIdChange={setSelectedUserId}
                        onAplicar={aplicarFiltro}
                        onLimpiar={limpiarFiltro}
                    />

                    {loading ? (
                        <div className="py-16 flex items-center justify-center gap-3 text-gray-500">
                            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-cyan-600" />
                            Cargando datos...
                        </div>
                    ) : error ? (
                        <div className="py-10 text-center text-red-600">{error}</div>
                    ) : (
                        <>
                            <ResumenDesempeno
                                metrics={metrics}
                                detalleActivo={detalleActivo}
                                detalles={detalles}
                                onToggleDetalle={toggleDetalle}
                            />
                            <BarrasTiposActividades rows={rows} />
                            <DistribucionEstatusUsuarios
                                fechaDesde={filtro.desde}
                                fechaHasta={filtro.hasta}
                            />
                            <ProgramadasPorTipoPieChart rows={rows} />
                            <ComparativoProgramadasNoProgramadasChart rows={rows} />
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                <ActividadesPorRolChart
                                    fechaDesde={filtro.desde}
                                    fechaHasta={filtro.hasta}
                                />
                                <CumplimientoPorTipoActividadChart rows={rows} />
                            </div>
                            <CumplimientoFueraPlazoIndicator rows={rows} />
                        </>
                    )}
                </section>
            </div>
        </div>
    );
}
