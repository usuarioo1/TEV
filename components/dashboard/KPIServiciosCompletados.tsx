import { Info } from 'lucide-react';
import { useState } from 'react';

interface ServiciosCompletados {
    hoy: number;
    semana: number;
    mes: number;
    mesAnterior: number;
    crecimiento: number;
}

interface KPIServiciosCompletadosProps {
    data: ServiciosCompletados;
}

export default function KPIServiciosCompletados({ data }: KPIServiciosCompletadosProps) {
    const [showInfo, setShowInfo] = useState(false);

    return (
        <div className="bg-white rounded-lg shadow p-6 relative">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-gray-600">Servicios Completados</h3>
                    <button
                        onMouseEnter={() => setShowInfo(true)}
                        onMouseLeave={() => setShowInfo(false)}
                        className="text-gray-400 hover:text-blue-500 transition-colors"
                    >
                        <Info className="w-4 h-4" />
                    </button>
                </div>
                <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            {showInfo && (
                <div className="absolute z-10 left-0 right-0 top-full mt-2 mx-2 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                    <p className="font-semibold mb-1">¿Qué mide este indicador?</p>
                    <p className="mb-2">Muestra la cantidad de servicios que han llegado al estado COMPLETADO, indicando que finalizaron exitosamente todo el flujo operativo.</p>
                    <p className="font-semibold mb-1">Origen de los datos:</p>
                    <p>Se consulta la tabla <span className="font-mono bg-gray-800 px-1 rounded">Servicio</span> filtrando por <span className="font-mono bg-gray-800 px-1 rounded">estado = &quot;COMPLETADO&quot;</span> y agrupando por rangos de fechas (hoy, semana, mes) usando el campo <span className="font-mono bg-gray-800 px-1 rounded">fechaFinalizacion</span>.</p>
                </div>
            )}
            <div className="mb-3">
                <p className="text-3xl font-bold text-gray-900">{data.mes}</p>
                <p className="text-xs text-gray-500">Este mes</p>
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs">
                <div>
                    <p className="text-gray-500">Hoy</p>
                    <p className="font-semibold text-gray-900">{data.hoy}</p>
                </div>
            </div>
            {data.crecimiento !== 0 && (
                <div className={`mt-3 pt-3 border-t border-gray-100 flex items-center text-xs ${data.crecimiento > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <svg className={`h-4 w-4 mr-1 ${data.crecimiento > 0 ? '' : 'transform rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    {Math.abs(data.crecimiento)}% vs mes anterior
                </div>
            )}
        </div>
    );
}
