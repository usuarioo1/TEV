import type { TablaActividadRow } from '../types';

interface CumplimientoPorTipoActividadChartProps {
    rows: TablaActividadRow[];
}

const LABEL_BY_TYPE: Partial<Record<TablaActividadRow['tipo'], string>> = {
    caminata: 'Caminatas de Seguridad',
    reporte_peligro: 'Reportes de Peligro',
    tarjeta_stop: 'Tarjetas Alto Stop',
    control_art: 'Controles de Calidad ART',
};

function clampPercentage(value: number) {
    if (!Number.isFinite(value)) return 0;
    if (value < 0) return 0;
    if (value > 100) return 100;
    return value;
}

export default function CumplimientoPorTipoActividadChart({
    rows,
}: CumplimientoPorTipoActividadChartProps) {
    const chartData = rows
        .map((row) => {
            const realizadas = row.realizadas;
            const cumplimientoRaw = row.totalProgramadas > 0
                ? (realizadas / row.totalProgramadas) * 100
                : 0;

            return {
                tipo: row.tipo,
                label: LABEL_BY_TYPE[row.tipo] || row.nombre,
                realizadas,
                totalProgramadas: row.totalProgramadas,
                cumplimiento: clampPercentage(cumplimientoRaw),
            };
        })
        .sort((a, b) => b.cumplimiento - a.cumplimiento);

    return (
        <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
            <h2 className="text-base font-bold text-gray-900 mb-1">
                Cumplimiento por Tipo de Actividad
            </h2>
            <p className="text-xs text-gray-500 mb-4">
                Porcentaje de actividades realizadas respecto al total programadas por tipo.
            </p>

            {chartData.length === 0 ? (
                <p className="text-sm text-gray-500">Sin datos para graficar en el rango seleccionado.</p>
            ) : (
                <div className="space-y-2.5">
                    {chartData.map((item) => {
                        const porcentajeTexto = `${item.cumplimiento.toFixed(0)} %`;

                        return (
                            <div key={item.tipo} className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_3rem] sm:grid-cols-[minmax(0,1fr)_minmax(0,3fr)_3.5rem] items-center gap-2 sm:gap-3">
                                <p className="text-xs sm:text-sm text-gray-700 leading-snug truncate min-w-0">
                                    {item.label}
                                </p>

                                <div className="relative h-6 rounded-md bg-gray-100 border border-gray-200 overflow-hidden min-w-0">
                                    <div
                                        className="h-full bg-purple-600"
                                        style={{ width: `${item.cumplimiento}%` }}
                                        title={`${item.label}: ${porcentajeTexto} (${item.realizadas}/${item.totalProgramadas})`}
                                    />
                                </div>

                                <span className="text-xs sm:text-sm font-semibold text-gray-800 text-right whitespace-nowrap">
                                    {porcentajeTexto}
                                </span>
                            </div>
                        );
                    })}

                    <p className="pt-1 text-[11px] text-gray-500">
                        Formula: realizadas / programadas * 100
                    </p>
                </div>
            )}
        </section>
    );
}
