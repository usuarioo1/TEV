import { Aprobacion } from './types';

export default function AprobacionDetalle({ aprobacion }: { aprobacion: Aprobacion }) {
    if (!aprobacion) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <p className="text-gray-500">No hay datos de aprobación disponibles</p>
            </div>
        );
    }

    return (
        <div className={`border rounded-lg p-6 ${aprobacion.aprobado ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Estado</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${aprobacion.aprobado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {aprobacion.aprobado ? '✓ Aprobado' : '✗ Rechazado'}
                </span>
            </div>

            <dl className="space-y-3">
                <div>
                    <dt className="text-sm font-medium text-gray-600">Supervisor</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                        {aprobacion.supervisor.name || aprobacion.supervisor.username}
                    </dd>
                </div>
                <div>
                    <dt className="text-sm font-medium text-gray-600">Fecha de Decisión</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                        {new Date(aprobacion.fechaDecision).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </dd>
                </div>
                {aprobacion.observaciones && (
                    <div>
                        <dt className="text-sm font-medium text-gray-600">Observaciones</dt>
                        <dd className="mt-1 text-sm text-gray-900">{aprobacion.observaciones}</dd>
                    </div>
                )}
            </dl>
        </div>
    );
}
