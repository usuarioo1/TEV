import { Servicio } from './types';
import ChecklistEquipoDetalle from './ChecklistEquipoDetalle';
import ChecklistFatigaDetalle from './ChecklistFatigaDetalle';
import AnalisisRiesgoDetalle from './AnalisisRiesgoDetalle';
import AprobacionDetalle from './AprobacionDetalle';

export default function DetalleServicioModal({ servicio, onClose }: { servicio: Servicio; onClose: () => void }) {
    // Debug: Log para ver qué datos están llegando
    console.log('DetalleServicioModal - Servicio:', servicio);
    console.log('ChecklistEquipo:', servicio.checklistEquipo);
    console.log('ChecklistFatiga:', servicio.checklistFatiga);
    console.log('AnalisisRiesgo:', servicio.analisisRiesgo);
    console.log('Aprobacion:', servicio.aprobacion);

    const getEstadoBadgeColor = (estado: string) => {
        const colores: Record<string, string> = {
            'ASIGNADO': 'bg-blue-100 text-blue-800',
            'ACEPTADO': 'bg-cyan-100 text-cyan-800',
            'RECHAZADO': 'bg-red-100 text-red-800',
            'PENDIENTE_APROBACION': 'bg-yellow-100 text-yellow-800',
            'APROBADO': 'bg-green-100 text-green-800',
            'EN_EJECUCION': 'bg-purple-100 text-purple-800',
            'COMPLETADO': 'bg-gray-100 text-gray-800',
        };
        return colores[estado] || 'bg-gray-100 text-gray-800';
    };

    const getEstadoTexto = (estado: string) => {
        const textos: Record<string, string> = {
            'ASIGNADO': 'Asignado',
            'ACEPTADO': 'Aceptado',
            'RECHAZADO': 'Rechazado',
            'PENDIENTE_APROBACION': 'Pendiente Aprobación',
            'APROBADO': 'Aprobado',
            'EN_EJECUCION': 'En Ejecución',
            'COMPLETADO': 'Completado',
        };
        return textos[estado] || estado;
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
                    {/* Header */}
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Detalle del Servicio - {servicio.codigo}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">{servicio.descripcion}</p>
                            </div>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Contenido */}
                    <div className="px-6 py-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                        {/* Información del Servicio */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalles del Servicio</h3>
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Código</dt>
                                            <dd className="mt-1 text-sm text-gray-900 font-mono">{servicio.codigo}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Descripción</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{servicio.descripcion}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Ruta</dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                {servicio.origen} → {servicio.destino}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Estado</dt>
                                            <dd className="mt-1">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoBadgeColor(servicio.estado)}`}>
                                                    {getEstadoTexto(servicio.estado)}
                                                </span>
                                            </dd>
                                        </div>
                                        {servicio.observaciones && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Observaciones</dt>
                                                <dd className="mt-1 text-sm text-gray-900">{servicio.observaciones}</dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Participantes</h3>
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Operario Asignado</dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                {servicio.operario?.name || servicio.operario?.username}
                                                {servicio.operario?.email && (
                                                    <span className="text-gray-500 ml-2">({servicio.operario.email})</span>
                                                )}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Coordinador</dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                {servicio.coordinador?.name || servicio.coordinador?.username}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Fecha de Asignación</dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                {new Date(servicio.fechaAsignacion).toLocaleDateString('es-ES', {
                                                    day: '2-digit',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </dd>
                                        </div>
                                        {servicio.fechaAceptacion && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Fecha de Aceptación</dt>
                                                <dd className="mt-1 text-sm text-gray-900">
                                                    {new Date(servicio.fechaAceptacion).toLocaleDateString('es-ES', {
                                                        day: '2-digit',
                                                        month: 'long',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>
                            </div>
                        </div>

                        {/* Checklist de Equipo */}
                        {servicio.checklistEquipo && (
                            <ChecklistEquipoDetalle checklist={servicio.checklistEquipo} />
                        )}

                        {/* Checklist de Fatiga */}
                        {servicio.checklistFatiga && (
                            <ChecklistFatigaDetalle checklist={servicio.checklistFatiga} />
                        )}

                        {/* Análisis de Riesgo */}
                        {servicio.analisisRiesgo && (
                            <AnalisisRiesgoDetalle analisis={servicio.analisisRiesgo} />
                        )}

                        {/* Información de Aprobación */}
                        {servicio.aprobacion && (
                            <AprobacionDetalle aprobacion={servicio.aprobacion} />
                        )}

                        {/* Mensaje si no hay checklists completados */}
                        {!servicio.checklistEquipo && !servicio.checklistFatiga && !servicio.analisisRiesgo && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                                <div className="flex items-center">
                                    <svg className="h-6 w-6 text-yellow-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <div>
                                        <h3 className="text-md font-semibold text-yellow-900">Sin formularios completados</h3>
                                        <p className="text-sm text-yellow-700 mt-1">
                                            El operario aún no ha completado ningún checklist o formulario para este servicio.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            className="w-full sm:w-auto px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
