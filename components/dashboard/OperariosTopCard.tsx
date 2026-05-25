interface Operario {
    id: number;
    nombre: string;
    serviciosCompletados: number;
}

interface OperariosTopCardProps {
    operarios: Operario[];
}

export default function OperariosTopCard({ operarios }: OperariosTopCardProps) {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Operarios Más Productivos</h3>
            {operarios.length > 0 ? (
                <div className="space-y-3">
                    {operarios.map((operario, idx) => (
                        <div key={operario.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3 ${idx === 0 ? 'bg-yellow-500' :
                                        idx === 1 ? 'bg-gray-400' :
                                            idx === 2 ? 'bg-orange-600' :
                                                'bg-blue-500'
                                    }`}>
                                    {idx + 1}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{operario.nombre}</p>
                                    <p className="text-xs text-gray-500">Servicios completados</p>
                                </div>
                            </div>
                            <p className="text-xl font-bold text-blue-600">{operario.serviciosCompletados}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-gray-500 text-center py-8">No hay datos disponibles</p>
            )}
        </div>
    );
}
