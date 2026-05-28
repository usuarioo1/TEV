import EstadoServicioCard from './EstadoServicioCard';

interface EstadosServiciosGridProps {
    serviciosPorEstado: Record<string, number>;
}

export default function EstadosServiciosGrid({ serviciosPorEstado }: EstadosServiciosGridProps) {
    const estados = [
        { key: 'ASIGNADO', label: 'Servicios asignados a operarios', color: 'bg-blue-100 text-blue-800', icon: '📋' },
        { key: 'ACEPTADO', label: 'Servicios aceptados por operarios', color: 'bg-green-100 text-green-800', icon: '✅' },
        { key: 'EN_CHECKLIST', label: ' Operario en Checklist', color: 'bg-yellow-100 text-yellow-800', icon: '📝' },
        { key: 'PENDIENTE_APROBACION', label: 'Pend. Aprobación por supervisor', color: 'bg-purple-100 text-purple-800', icon: '⏳' },
        { key: 'APROBADO', label: 'Aprobados por supervisor', color: 'bg-teal-100 text-teal-800', icon: '✓' },
        { key: 'EN_EJECUCION', label: 'En Ejecución por operarios', color: 'bg-orange-100 text-orange-800', icon: '⚡' },
        { key: 'COMPLETADO', label: 'Completados por operarios', color: 'bg-emerald-100 text-emerald-800', icon: '🏁' },
        { key: 'RECHAZADO', label: 'Rechazados total', color: 'bg-red-100 text-red-800', icon: '❌' },
    ];

    const total = Object.values(serviciosPorEstado).reduce((sum, n) => sum + n, 0);

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Estado de Todos los Servicios</h2>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                    Total: {total}
                </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-3">
                {estados.map(estado => (
                    <EstadoServicioCard
                        key={estado.key}
                        estado={estado}
                        count={serviciosPorEstado[estado.key] || 0}
                    />
                ))}
            </div>
        </div>
    );
}
