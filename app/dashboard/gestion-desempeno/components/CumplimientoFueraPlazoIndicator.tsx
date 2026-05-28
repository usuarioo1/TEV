import type { TablaActividadRow } from '../types';

interface CumplimientoFueraPlazoIndicatorProps {
    rows: TablaActividadRow[];
}

const LABEL_BY_TYPE: Record<TablaActividadRow['tipo'], string> = {
    caminata: 'Caminatas de Seguridad',
    reporte_peligro: 'Reportes de Peligro',
    tarjeta_stop: 'Tarjetas Alto Stop',
    control_art: 'Controles de Calidad ART',
};

export default function CumplimientoFueraPlazoIndicator({
    rows,
}: CumplimientoFueraPlazoIndicatorProps) {
    const chartData = rows
        .map((row) => {
            const totalProgramadas = Math.max(0, row.totalProgramadas);
            const fueraPlazo = Math.max(0, row.realizadasFueraPlazo);
            const porcentaje = totalProgramadas > 0
                ? (fueraPlazo / totalProgramadas) * 100
                : 0;

            return {
                tipo: row.tipo,
                label: LABEL_BY_TYPE[row.tipo] || row.nombre,
                totalProgramadas,
                fueraPlazo,
                porcentaje,
            };
        })
        .sort((a, b) => b.porcentaje - a.porcentaje);

    const totalProgramadas = chartData.reduce((acc, item) => acc + item.totalProgramadas, 0);
    const realizadasFueraPlazo = chartData.reduce((acc, item) => acc + item.fueraPlazo, 0);

    const cumplimientoFueraPlazo =
        totalProgramadas > 0
            ? (realizadasFueraPlazo / totalProgramadas) * 100
            : 0;

    return (
        <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                    <h2 className="text-base font-bold text-amber-900 mb-1">
                        Cumplimiento Fuera de Plazo por Tipo de Actividad
                    </h2>
                    <p className="text-xs text-amber-800/80">
                        Formula: realizadas fuera de plazo / total programadas * 100
                    </p>
                </div>

                <div className="text-left sm:text-right">
                    <p className="text-4xl sm:text-5xl font-black leading-none text-amber-700">
                        {cumplimientoFueraPlazo.toFixed(1)}%
                    </p>
                    <p className="mt-1 text-xs font-semibold text-amber-900/80">
                        {realizadasFueraPlazo} fuera de plazo / {totalProgramadas} programadas
                    </p>
                </div>
            </div>

            {chartData.length === 0 ? (
                <p className="mt-4 text-sm text-amber-900/70">
                    Sin datos para graficar en el rango seleccionado.
                </p>
            ) : (
                <div className="mt-4 space-y-2.5">
                    {chartData.map((item) => (
                        <div
                            key={item.tipo}
                            className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_3rem] sm:grid-cols-[minmax(0,1fr)_minmax(0,3fr)_3.5rem] items-center gap-2 sm:gap-3"
                        >
                            <div className="min-w-0">
                                <p className="text-xs sm:text-sm text-amber-900 leading-snug truncate">
                                    {item.label}
                                </p>
                                <p className="text-[11px] text-amber-900/70">
                                    {item.fueraPlazo}/{item.totalProgramadas}
                                </p>
                            </div>

                            <div className="relative h-6 rounded-md bg-amber-100 border border-amber-200 overflow-hidden min-w-0">
                                <div
                                    className="h-full bg-amber-500"
                                    style={{ width: `${Math.min(item.porcentaje, 100)}%` }}
                                    title={`${item.label}: ${item.porcentaje.toFixed(1)}% (${item.fueraPlazo}/${item.totalProgramadas})`}
                                />
                            </div>

                            <span className="text-xs sm:text-sm font-semibold text-amber-900 text-right whitespace-nowrap">
                                {item.porcentaje.toFixed(1)}%
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}