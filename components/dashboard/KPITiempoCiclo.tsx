import { Info } from 'lucide-react';
import { useState } from 'react';

interface KPITiempoCicloProps {
    horasPromedio: number;
    totalServicios: number;
}

export default function KPITiempoCiclo({ horasPromedio, totalServicios }: KPITiempoCicloProps) {
    const [showInfo, setShowInfo] = useState(false);

    // Convertir a días y horas para mejor legibilidad
    const dias = Math.floor(horasPromedio / 24);
    const horas = Math.round(horasPromedio % 24);

    return (
        <div className="bg-white rounded-lg shadow p-6 relative">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-gray-600">Tiempo de Ciclo</h3>
                    <button
                        onMouseEnter={() => setShowInfo(true)}
                        onMouseLeave={() => setShowInfo(false)}
                        className="text-gray-400 hover:text-amber-500 transition-colors"
                    >
                        <Info className="w-4 h-4" />
                    </button>
                </div>
                <svg className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            {showInfo && (
                <div className="absolute z-10 left-0 right-0 top-full mt-2 mx-2 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                    <p className="font-semibold mb-1">¿Qué mide este indicador?</p>
                    <p className="mb-2">Tiempo promedio desde que un servicio es asignado al operario hasta su finalización completa. Incluye todas las etapas: aceptación, checklists, aprobación y ejecución.</p>
                    <p className="font-semibold mb-1">Origen de los datos:</p>
                    <p>Se calculan los servicios <span className="font-mono bg-gray-800 px-1 rounded">COMPLETADOS</span>, tomando la diferencia entre <span className="font-mono bg-gray-800 px-1 rounded">fechaFinalizacion</span> y <span className="font-mono bg-gray-800 px-1 rounded">fechaAsignacion</span>. Meta: &lt;48 horas para operaciones eficientes.</p>
                </div>
            )}
            <div className="mb-3">
                <div className="flex items-baseline gap-2">
                    {dias > 0 && (
                        <>
                            <p className="text-3xl font-bold text-gray-900">{dias}</p>
                            <p className="text-sm text-gray-600">día{dias !== 1 ? 's' : ''}</p>
                        </>
                    )}
                    {horas > 0 && (
                        <>
                            <p className="text-2xl font-bold text-gray-900">{horas}</p>
                            <p className="text-sm text-gray-600">h</p>
                        </>
                    )}
                    {dias === 0 && horas === 0 && (
                        <>
                            <p className="text-3xl font-bold text-gray-900">0</p>
                            <p className="text-sm text-gray-600">horas</p>
                        </>
                    )}
                </div>
                <p className="text-xs text-gray-500">Promedio por servicio</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                    className={`h-2 rounded-full ${horasPromedio <= 48 ? 'bg-amber-500' :
                            horasPromedio <= 72 ? 'bg-yellow-500' :
                                'bg-red-500'
                        }`}
                    style={{ width: `${Math.min((48 / horasPromedio) * 100, 100)}%` }}
                ></div>
            </div>
            <p className="text-xs text-gray-500">
                {totalServicios} servicios analizados
            </p>
        </div>
    );
}
