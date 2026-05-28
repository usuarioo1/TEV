import { Info } from 'lucide-react';
import { useState } from 'react';

interface KPIRiesgosControladosProps {
    porcentaje: number;
    total: number;
}

export default function KPIRiesgosControlados({ porcentaje, total }: KPIRiesgosControladosProps) {
    const conRiesgos = Math.round(total - (total * porcentaje / 100));
    const [showInfo, setShowInfo] = useState(false);

    return (
        <div className="bg-white rounded-lg shadow p-6 relative">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-gray-600">Riesgos Controlados</h3>
                    <button
                        onMouseEnter={() => setShowInfo(true)}
                        onMouseLeave={() => setShowInfo(false)}
                        className="text-gray-400 hover:text-green-500 transition-colors"
                    >
                        <Info className="w-4 h-4" />
                    </button>
                </div>
                <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            </div>
            {showInfo && (
                <div className="absolute z-10 left-0 right-0 top-full mt-2 mx-2 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                    <p className="font-semibold mb-1">¿Qué mide este indicador?</p>
                    <p className="mb-2">Representa el porcentaje de análisis de riesgo donde todos los riesgos identificados están bajo control. Meta: &gt;95% para garantizar operaciones seguras.</p>
                    <p className="font-semibold mb-1">Origen de los datos:</p>
                    <p>Se consulta la tabla <span className="font-mono bg-gray-800 px-1 rounded">AnalisisRiesgo</span> y se cuenta cuántos tienen <span className="font-mono bg-gray-800 px-1 rounded">riesgosControlados = true</span>, dividido entre el total de análisis realizados.</p>
                </div>
            )}
            <div className="mb-3">
                <p className="text-3xl font-bold text-gray-900">{porcentaje}%</p>
                <p className="text-xs text-gray-500">Meta: &gt;95%</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                    className={`h-2 rounded-full ${porcentaje >= 95 ? 'bg-green-500' :
                            porcentaje >= 85 ? 'bg-yellow-500' :
                                'bg-red-500'
                        }`}
                    style={{ width: `${porcentaje}%` }}
                ></div>
            </div>
            <p className="text-xs text-gray-500">
                {conRiesgos} de {total} análisis con riesgos
            </p>
        </div>
    );
}
