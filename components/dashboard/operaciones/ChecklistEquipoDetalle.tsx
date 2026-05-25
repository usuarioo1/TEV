import { ChecklistEquipo } from './types';

export default function ChecklistEquipoDetalle({ checklist }: { checklist: ChecklistEquipo }) {
    if (!checklist) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <p className="text-gray-500">No hay datos del checklist de equipo disponibles</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Checklist de Equipo - Semirremolque</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${checklist.equipoEnCondiciones ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {checklist.equipoEnCondiciones ? '✓ Aprobado' : '⚠ Con Fallas'}
                </span>
            </div>

            {/* Información del Equipo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-500">Marca/Modelo</p>
                    <p className="text-sm text-gray-900 mt-1">{checklist.marcaModelo}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-500">Patente</p>
                    <p className="text-sm text-gray-900 mt-1">{checklist.patente}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-500">Año</p>
                    <p className="text-sm text-gray-900 mt-1">{checklist.anio}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-500">Conductor</p>
                    <p className="text-sm text-gray-900 mt-1">{checklist.conductor}</p>
                </div>
            </div>

            {checklist.horometro && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-500">Horómetro</p>
                        <p className="text-sm text-gray-900 mt-1">{checklist.horometro}</p>
                    </div>
                    {checklist.kilometraje && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs font-medium text-gray-500">Kilometraje</p>
                            <p className="text-sm text-gray-900 mt-1">{checklist.kilometraje}</p>
                        </div>
                    )}
                </div>
            )}

            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Inspección técnica completada</p>
                <p className="text-xs text-blue-700 mt-1">
                    Fecha: {new Date(checklist.fecha).toLocaleDateString('es-CL')} - Hora: {checklist.hora}
                </p>
            </div>

            {/* Matriz de Inspección */}
            {checklist.items && typeof checklist.items === 'object' && (
                <div className="mb-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Matriz de Inspección Técnica</h4>
                    <div className="space-y-4">
                        {Object.entries((checklist.items as any) || {}).map(([categoria, items]: [string, any]) => (
                            <div key={categoria} className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="bg-gray-100 px-4 py-2">
                                    <h5 className="font-semibold text-gray-900">{categoria}</h5>
                                </div>
                                <div className="divide-y divide-gray-200">
                                    {Object.entries(items as any).map(([itemName, itemData]: [string, any]) => {
                                        // Manejar tanto el formato nuevo (objeto) como el antiguo (string)
                                        const valor = typeof itemData === 'object' && itemData !== null ? itemData.valor : itemData;
                                        const tieneObservacion = typeof itemData === 'object' && itemData !== null ? itemData.tieneObservacion : false;
                                        const observacion = typeof itemData === 'object' && itemData !== null ? itemData.observacion : '';
                                        const imagenes = typeof itemData === 'object' && itemData !== null && itemData.imagenes ? itemData.imagenes : [];

                                        return (
                                            <div key={itemName} className="px-4 py-2 hover:bg-gray-50">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-700">{itemName}</span>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${valor === 'SI' || valor === 'OK' ? 'bg-green-100 text-green-800' :
                                                        valor === 'NO' || valor === 'NC' ? 'bg-red-100 text-red-800' :
                                                            valor === 'OB' ? 'bg-yellow-100 text-yellow-800' :
                                                                valor === 'N/A' ? 'bg-gray-100 text-gray-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {String(valor)}
                                                    </span>
                                                </div>
                                                {tieneObservacion && observacion && (
                                                    <div className="mt-2 ml-4 p-2 bg-blue-50 border-l-2 border-blue-300 rounded">
                                                        <p className="text-xs font-medium text-blue-700">Observación específica:</p>
                                                        <p className="text-xs text-blue-900 mt-1">{observacion}</p>
                                                    </div>
                                                )}
                                                {imagenes && imagenes.length > 0 && (
                                                    <div className="mt-2 ml-4">
                                                        <p className="text-xs font-medium text-gray-700 mb-2">Fotografías:</p>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                                            {imagenes.map((img: any, idx: number) => (
                                                                <a
                                                                    key={idx}
                                                                    href={img.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="block relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 transition-colors"
                                                                >
                                                                    <img
                                                                        src={img.url}
                                                                        alt={`Foto ${idx + 1} de ${itemName}`}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {checklist.observaciones && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-1">Observaciones:</p>
                    <p className="text-sm text-gray-600">{checklist.observaciones}</p>
                </div>
            )}
        </div>
    );
}
