interface TiemposData {
    promedioCicloHoras: number;
    promedioAprobacionMinutos: number;
}

interface AprobacionesData {
    tasaAprobacion: number;
    totalAprobaciones: number;
    aprobadas: number;
}

interface TiemposCardProps {
    tiempos: TiemposData;
    aprobaciones: AprobacionesData;
}

export default function TiemposCard({ tiempos, aprobaciones }: TiemposCardProps) {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tiempos Promedio</h3>
            <div className="space-y-4">
                <div className="border-b border-gray-100 pb-4">
                    <p className="text-xs text-gray-500 mb-1">Ciclo Completo</p>
                    <p className="text-2xl font-bold text-gray-900">{tiempos.promedioCicloHoras}h</p>
                    <p className="text-xs text-gray-500">Desde asignación hasta completado</p>
                </div>
                <div className="border-b border-gray-100 pb-4">
                    <p className="text-xs text-gray-500 mb-1">Aprobación Supervisor</p>
                    <p className="text-2xl font-bold text-gray-900">{tiempos.promedioAprobacionMinutos} min</p>
                    <p className="text-xs text-gray-500">Tiempo de respuesta</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 mb-1">Tasa de Aprobación</p>
                    <p className="text-2xl font-bold text-green-600">{aprobaciones.tasaAprobacion}%</p>
                    <p className="text-xs text-gray-500">
                        {aprobaciones.aprobadas} de {aprobaciones.totalAprobaciones} aprobados
                    </p>
                </div>
            </div>
        </div>
    );
}
