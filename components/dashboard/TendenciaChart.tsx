interface TendenciaData {
    fecha: string;
    completados: number;
}

interface TendenciaChartProps {
    tendencia: TendenciaData[];
}

export default function TendenciaChart({ tendencia }: TendenciaChartProps) {
    const maxTendencia = Math.max(...tendencia.map(d => d.completados), 1);

    return (
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Servicios Completados (Últimos 7 días)</h3>
            <div className="flex items-end justify-between h-48 space-x-2">
                {tendencia.map((dia, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                        <div
                            className="w-full bg-blue-100 rounded-t relative"
                            style={{
                                height: `${(dia.completados / maxTendencia) * 100}%`,
                                minHeight: dia.completados > 0 ? '20px' : '2px'
                            }}
                        >
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-700">
                                {dia.completados}
                            </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-2 text-center">{dia.fecha}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
