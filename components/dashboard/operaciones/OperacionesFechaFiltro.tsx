import type { DateFilter } from './dashboard-types';

interface OperacionesFechaFiltroProps {
    fechaDesde: string;
    fechaHasta: string;
    filtroFecha: DateFilter;
    onFechaDesdeChange: (value: string) => void;
    onFechaHastaChange: (value: string) => void;
    onAplicarFiltro: () => void;
    onLimpiarFiltro: () => void;
}

export default function OperacionesFechaFiltro({
    fechaDesde,
    fechaHasta,
    filtroFecha,
    onFechaDesdeChange,
    onFechaHastaChange,
    onAplicarFiltro,
    onLimpiarFiltro,
}: OperacionesFechaFiltroProps) {
    return (
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-gray-700">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium text-sm">Filtrar por fecha</span>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-500">Desde</label>
                    <input
                        type="date"
                        value={fechaDesde}
                        onChange={(e) => onFechaDesdeChange(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-500">Hasta</label>
                    <input
                        type="date"
                        value={fechaHasta}
                        onChange={(e) => onFechaHastaChange(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    />
                </div>
                <button
                    onClick={onAplicarFiltro}
                    disabled={!fechaDesde && !fechaHasta}
                    className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    Aplicar filtro
                </button>
                {(filtroFecha.desde || filtroFecha.hasta) && (
                    <button
                        onClick={onLimpiarFiltro}
                        className="px-4 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Limpiar
                    </button>
                )}
                {(filtroFecha.desde || filtroFecha.hasta) && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        {filtroFecha.desde && filtroFecha.hasta
                            ? `${filtroFecha.desde} → ${filtroFecha.hasta}`
                            : filtroFecha.desde
                                ? `Desde ${filtroFecha.desde}`
                                : `Hasta ${filtroFecha.hasta}`}
                    </span>
                )}
            </div>
        </div>
    );
}
