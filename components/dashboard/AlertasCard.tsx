interface AlertasData {
    equiposConProblemas: number;
    tractosConProblemas: number;
    serviciosRechazados: number;
    serviciosConAtencion: number;
}

interface AlertasCardProps {
    alertas: AlertasData;
    conductoresNoAptos: number;
}

export default function AlertasCard({ alertas, conductoresNoAptos }: AlertasCardProps) {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertas y Atención Requerida</h3>
            <div className="space-y-3">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <svg className="h-6 w-6 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div>
                                <p className="text-sm font-semibold text-red-900">Servicios con Atención</p>
                                <p className="text-xs text-red-600">Requieren revisión inmediata</p>
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-red-600">{alertas.serviciosConAtencion}</p>
                    </div>
                </div>

                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <svg className="h-6 w-6 text-orange-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <div>
                                <p className="text-sm font-semibold text-orange-900">Equipos con NC</p>
                                <p className="text-xs text-orange-600">No conformidades detectadas</p>
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-orange-600">{alertas.equiposConProblemas + alertas.tractosConProblemas}</p>
                    </div>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <svg className="h-6 w-6 text-yellow-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <div>
                                <p className="text-sm font-semibold text-yellow-900">Servicios Rechazados</p>
                                <p className="text-xs text-yellow-600">Por operarios</p>
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-yellow-600">{alertas.serviciosRechazados}</p>
                    </div>
                </div>

                {conductoresNoAptos > 0 && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <svg className="h-6 w-6 text-purple-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <p className="text-sm font-semibold text-purple-900">Conductores No Aptos</p>
                                    <p className="text-xs text-purple-600">Por fatiga o somnolencia</p>
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-purple-600">{conductoresNoAptos}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
