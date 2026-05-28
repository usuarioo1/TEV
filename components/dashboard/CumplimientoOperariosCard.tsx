'use client';

interface OperarioCumplimiento {
    id: number;
    nombre: string;
    servicioId: number;
    estadoServicio: string;
    enCumplimiento: boolean;
    checklistsCompletados: {
        equipo: boolean;
        fatiga: boolean;
        riesgos: boolean;
    };
    problemas: string[];
    ultimaActualizacion: Date;
}

interface CumplimientoOperariosCardProps {
    cumplimiento: {
        enCumplimiento: OperarioCumplimiento[];
        enIncumplimiento: OperarioCumplimiento[];
        total: number;
        porcentajeCumplimiento: number;
    };
}

export default function CumplimientoOperariosCard({ cumplimiento }: CumplimientoOperariosCardProps) {
    const todosOperarios = [...cumplimiento.enCumplimiento, ...cumplimiento.enIncumplimiento];

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Estado de Operarios y Cumplimiento</h2>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700">
                        Cumplimiento: {Math.round(cumplimiento.porcentajeCumplimiento)}%
                    </span>
                    <span className="text-sm text-gray-500">
                        {cumplimiento.total} operario{cumplimiento.total !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {todosOperarios.length === 0 ? (
                <div className="text-center py-12">
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">No hay operarios con servicios asignados</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Operario
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Servicio
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Equipo
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fatiga
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Riesgos
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cumplimiento
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {todosOperarios.map((operario) => (
                                <tr key={`${operario.id}-${operario.servicioId}`} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {operario.nombre}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            #{operario.servicioId}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${operario.estadoServicio === 'COMPLETADO' ? 'bg-green-100 text-green-800' :
                                                operario.estadoServicio === 'EN_EJECUCION' ? 'bg-blue-100 text-blue-800' :
                                                    operario.estadoServicio === 'ACEPTADO' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                            }`}>
                                            {operario.estadoServicio.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${operario.checklistsCompletados.equipo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {operario.checklistsCompletados.equipo ? '✓' : '✗'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${operario.checklistsCompletados.fatiga ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {operario.checklistsCompletados.fatiga ? '✓' : '✗'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${operario.checklistsCompletados.riesgos ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {operario.checklistsCompletados.riesgos ? '✓' : '✗'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${operario.enCumplimiento ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {operario.enCumplimiento ? '✓ OK' : '✗ Faltante'}
                                            </span>
                                            {operario.problemas.length > 0 && (
                                                <span className="text-xs text-gray-500" title={operario.problemas.join(', ')}>
                                                    ({operario.problemas.length})
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
