import InfoDot from './InfoDot';
import type {
    ActivityDetail,
    GestionDesempenoMetrics,
} from '../types';

interface ResumenDesempenoProps {
    metrics: GestionDesempenoMetrics;
    detalleActivo: 'cumplidas' | 'vencidas' | null;
    detalles: {
        cumplidas: ActivityDetail[];
        vencidas: ActivityDetail[];
    };
    onToggleDetalle: (tipo: 'cumplidas' | 'vencidas') => void;
}

const TIPO_LABEL: Record<string, string> = {
    caminata: 'Caminata',
    reporte_peligro: 'Reporte',
    tarjeta_stop: 'Tarjeta Stop',
    control_art: 'Control ART',
};

export default function ResumenDesempeno({
    metrics,
    detalleActivo,
    detalles,
    onToggleDetalle,
}: ResumenDesempenoProps) {
    return (
        <div className="flex flex-col lg:flex-row gap-5 lg:gap-6">
            <div className="w-full lg:w-64 grid grid-cols-2 lg:grid-cols-1 gap-3 shrink-0">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm text-gray-500 leading-tight inline-flex items-center gap-1.5">
                        Cantidad de Actividades Programadas
                        <InfoDot tip="Suma de totalProgramadas de la API /api/dashboard/tabla-actividades (las 4 filas de la tabla de actividades del dashboard)." />
                    </p>
                    <p className="text-5xl font-black text-gray-900 mt-2 leading-none">
                        {metrics.totalProgramadas}
                    </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm text-gray-500 inline-flex items-center gap-1.5">
                        Cumplimiento
                        <InfoDot tip="Formula: (realizadas + realizadasFueraPlazo) / totalProgramadas x 100. Fuente: /api/dashboard/tabla-actividades." />
                    </p>
                    <p className="text-5xl font-black text-emerald-600 mt-2 leading-none">
                        {metrics.cumplimiento.toFixed(1)}%
                    </p>
                </div>
            </div>

            <div className="flex-1 rounded-2xl border border-gray-200 p-4 sm:p-5">
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                        <p className="text-gray-500 inline-flex items-center gap-1.5">
                            Cerradas
                            <InfoDot tip="Suma de realizadas + realizadasFueraPlazo de las 4 filas de la tabla de actividades." />
                        </p>
                        <button
                            type="button"
                            onClick={() => onToggleDetalle('cumplidas')}
                            className="text-2xl font-black text-cyan-700 hover:text-cyan-900 transition-colors"
                        >
                            {metrics.totalCumplidas}
                        </button>
                    </div>
                    <div>
                        <p className="text-gray-500 inline-flex items-center gap-1.5">
                            Abiertas
                            <InfoDot tip="Suma de próximas + atrasadas de las 4 filas de la tabla de actividades. Corresponde a tareas pendientes (con fecha límite futura/sin vencer y con fecha límite vencida)." />
                        </p>
                        <button
                            type="button"
                            onClick={() => onToggleDetalle('vencidas')}
                            className="text-2xl font-black text-emerald-700 hover:text-emerald-900 transition-colors"
                        >
                            {metrics.totalAtrasadas}
                        </button>
                    </div>
                </div>

                {metrics.universoGrafico === 0 ? (
                    <div className="h-24 flex items-center justify-center text-gray-400 text-sm">
                        Sin actividades cerradas o abiertas para graficar
                    </div>
                ) : (
                    <>
                        <div className="h-28 flex items-stretch gap-2">
                            {metrics.totalCumplidas > 0 && (
                                <button
                                    type="button"
                                    onClick={() => onToggleDetalle('cumplidas')}
                                    className="text-white flex items-center justify-center cursor-pointer"
                                    style={{
                                        flex: Math.max(metrics.pctCumplidasGrafico, 8),
                                        background:
                                            'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                                        clipPath:
                                            'polygon(0 0, calc(100% - 24px) 0, 100% 50%, calc(100% - 24px) 100%, 0 100%)',
                                    }}
                                >
                                    <div className="text-center px-2 pr-5">
                                        <p className="text-xs font-semibold opacity-95">
                                            Cerradas
                                        </p>
                                        <p className="text-3xl font-black leading-none mt-1">
                                            {metrics.totalCumplidas}
                                        </p>
                                    </div>
                                </button>
                            )}

                            {metrics.totalAtrasadas > 0 && (
                                <button
                                    type="button"
                                    onClick={() => onToggleDetalle('vencidas')}
                                    className="text-white flex items-center justify-center cursor-pointer"
                                    style={{
                                        flex: Math.max(metrics.pctAtrasadasGrafico, 8),
                                        background:
                                            'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                                        clipPath:
                                            'polygon(0 0, calc(100% - 24px) 0, 100% 50%, calc(100% - 24px) 100%, 0 100%)',
                                    }}
                                >
                                    <div className="text-center px-2 pr-5">
                                        <p className="text-xs font-semibold opacity-95">
                                            Abiertas
                                        </p>
                                        <p className="text-3xl font-black leading-none mt-1">
                                            {metrics.totalAtrasadas}
                                        </p>
                                    </div>
                                </button>
                            )}
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-4 text-xs font-semibold text-gray-500">
                            <p>{metrics.pctCumplidasGrafico.toFixed(2)}%</p>
                            <p className="text-right">{metrics.pctAtrasadasGrafico.toFixed(2)}%</p>
                        </div>
                    </>
                )}

                {detalleActivo && (
                    <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm sm:text-base font-bold text-gray-800">
                                {detalleActivo === 'cumplidas'
                                    ? 'Tareas cerradas'
                                    : 'Tareas abiertas / vencidas'}
                            </h3>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-600">
                                {detalles[detalleActivo].length} tareas
                            </span>
                        </div>

                        {detalles[detalleActivo].length === 0 ? (
                            <p className="text-sm text-gray-500">
                                No hay tareas para mostrar en este grupo.
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                                {detalles[detalleActivo].map((item) => (
                                    <article
                                        key={item.id}
                                        className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
                                    >
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <span className="text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-100">
                                                {TIPO_LABEL[item.tipo] || item.tipo}
                                            </span>
                                            <span
                                                className={`text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border ${item.estado === 'cumplida'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                                    }`}
                                            >
                                                {detalleActivo === 'vencidas'
                                                    ? item.estado === 'vencida'
                                                        ? 'abierta vencida'
                                                        : 'abierta próxima'
                                                    : 'cerrada'}
                                            </span>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900 leading-tight">
                                            {item.tarea}
                                        </p>
                                        <p className="text-xs text-gray-600 mt-2">
                                            Responsable: <span className="font-semibold">{item.usuario}</span>
                                        </p>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
