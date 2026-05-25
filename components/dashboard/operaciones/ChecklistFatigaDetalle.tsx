import { ChecklistFatiga } from './types';

export default function ChecklistFatigaDetalle({ checklist }: { checklist: ChecklistFatiga }) {
    if (!checklist) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <p className="text-gray-500">No hay datos del checklist de fatiga disponibles</p>
            </div>
        );
    }

    // Cast explícito a any para acceder a las propiedades del JSON
    const seccionI = (checklist.items as any)?.SECCION_I || {};
    const seccionII = (checklist.items as any)?.SECCION_II || {};

    // Preguntas en el orden exacto del formulario del supervisor
    const preguntasSeccionI = [
        "¿Durmió tiempo necesario y está apto?",
        "¿Medicamentos con somnolencia?",
        "¿Actividades físicas exigentes?",
        "¿Alcohol en últimas 48 horas?",
        "¿Síntomas de resfriado?",
        "¿Comidas abundantes en última hora?",
        "¿Más de 12 horas manejadas en 24h?"
    ];

    // Síntomas en el orden exacto del formulario del supervisor
    const sintomasSeccionII = [
        "Dificultad concentrarse/alerta",
        "Movimientos lentos/torpes",
        "Visión borrosa",
        "Dificultad recordar ubicación",
        "Dificultad trayectoria recta",
        "Bostezos frecuentes",
        "Pesadez párpados",
        "Cabeceos",
        "Dolor de cabeza",
        "Mareos",
        "Dolores nuca/espalda",
        "Cambios postura frecuentes"
    ];

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Checklist de Fatiga y Somnolencia</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${checklist.aptoParaTrabajar ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {checklist.aptoParaTrabajar ? '✓ Apto' : '⚠ No Apto'}
                    {checklist.requiereReemplazo && ' - Requiere Reemplazo'}
                </span>
            </div>

            {/* Información General */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                    <p className="text-xs font-medium text-gray-600">Fecha y Hora</p>
                    <p className="text-sm text-gray-900 mt-1">
                        {new Date(checklist.fecha).toLocaleDateString('es-ES')} - {checklist.hora}
                    </p>
                </div>
                <div>
                    <p className="text-xs font-medium text-gray-600">Lugar de Control</p>
                    <p className="text-sm text-gray-900 mt-1">{checklist.lugarControl}</p>
                </div>
                <div>
                    <p className="text-xs font-medium text-gray-600">Conductor</p>
                    <p className="text-sm text-gray-900 mt-1">{checklist.nombreConductor}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                    <p className="text-xs font-medium text-gray-600">RUT</p>
                    <p className="text-sm text-gray-900 mt-1">{checklist.rut}</p>
                </div>
                <div>
                    <p className="text-xs font-medium text-gray-600">Licencia de Conducir</p>
                    <p className="text-sm text-gray-900 mt-1">{checklist.licenciaConducir}</p>
                </div>
            </div>

            {/* Sección I */}
            <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Sección I: Cuestionario de Autoevaluación</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="divide-y divide-gray-200">
                        {Object.keys(seccionI).length > 0 ? (
                            Object.entries(seccionI).map(([index, value]: [string, any]) => {
                                const idx = parseInt(index);
                                const pregunta = preguntasSeccionI[idx] || `Pregunta ${idx + 1}`;
                                const respuesta = String(value);
                                // Primera pregunta: SI=bueno(verde), NO=malo(rojo). Resto al revés
                                const esPositivo = idx === 0 ? respuesta === 'SI' : respuesta === 'NO';
                                return (
                                    <div key={index} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                                        <span className="text-sm text-gray-700 flex-1">{pregunta}</span>
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ml-4 ${idx === 0 ?
                                                (respuesta === 'SI' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800') :
                                                (respuesta === 'SI' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800')
                                            }`}>
                                            {respuesta}
                                        </span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="px-4 py-3 text-sm text-gray-500">No hay datos de la Sección I</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sección II */}
            <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Sección II: Síntomas en la Última Media Hora</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="divide-y divide-gray-200">
                        {Object.keys(seccionII).length > 0 ? (
                            Object.entries(seccionII).map(([index, value]: [string, any]) => {
                                const idx = parseInt(index);
                                const sintoma = sintomasSeccionII[idx] || `Síntoma ${idx + 1}`;
                                const respuesta = String(value);
                                const tienePresente = respuesta === 'SI';
                                return (
                                    <div key={index} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                                        <span className="text-sm text-gray-700 flex-1">{sintoma}</span>
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ml-4 ${tienePresente ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                            }`}>
                                            {respuesta}
                                        </span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="px-4 py-3 text-sm text-gray-500">No hay datos de la Sección II</div>
                        )}
                    </div>
                </div>
            </div>

            {checklist.observaciones && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-1">Observaciones:</p>
                    <p className="text-sm text-gray-600">{checklist.observaciones}</p>
                </div>
            )}
        </div>
    );
}
