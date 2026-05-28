import ReportePeligroForm from '@/components/caminatas/ReportePeligroForm';
import TarjetaStopForm from '@/components/caminatas/TarjetaStopForm';
import ControlCalidadARTForm from '@/components/caminatas/ControlCalidadARTForm';

type TipoFormulario = 'seleccion' | 'peligro' | 'stop' | 'art';

interface ModalReporteProps {
    show: boolean;
    tipo: TipoFormulario;
    onChange: (tipo: TipoFormulario) => void;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ModalReporte({ show, tipo, onChange, onClose, onSuccess }: ModalReporteProps) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {tipo === 'seleccion' && (
                    <div className="p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">¿Qué deseas reportar?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={() => onChange('peligro')}
                                className="p-6 border-2 border-orange-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all"
                            >
                                <svg className="w-12 h-12 text-orange-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <h3 className="font-semibold text-lg text-gray-900 mb-2">Reporte de Peligro</h3>
                                <p className="text-sm text-gray-600">Reporta una condición peligrosa identificada</p>
                            </button>
                            <button
                                onClick={() => onChange('stop')}
                                className="p-6 border-2 border-red-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all"
                            >
                                <svg className="w-12 h-12 text-red-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 715.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                                <h3 className="font-semibold text-lg text-gray-900 mb-2">Tarjeta Alto/Stop</h3>
                                <p className="text-sm text-gray-600">Detiene una actividad insegura</p>
                            </button>
                            <button
                                onClick={() => onChange('art')}
                                className="p-6 border-2 border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                            >
                                <svg className="w-12 h-12 text-blue-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="font-semibold text-lg text-gray-900 mb-2">Control Calidad ART</h3>
                                <p className="text-sm text-gray-600">Verifica análisis de riesgo en el trabajo</p>
                            </button>
                        </div>
                        <button
                            onClick={onClose}
                            className="mt-6 w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                )}
                {tipo === 'peligro' && (
                    <ReportePeligroForm
                        caminataId={null as any}
                        onSuccess={onSuccess}
                        onCancel={onClose}
                    />
                )}
                {tipo === 'stop' && (
                    <TarjetaStopForm
                        caminataId={null as any}
                        onSuccess={onSuccess}
                        onCancel={onClose}
                    />
                )}
                {tipo === 'art' && (
                    <ControlCalidadARTForm
                        caminataId={null as any}
                        onSuccess={onSuccess}
                        onCancel={onClose}
                    />
                )}
            </div>
        </div>
    );
}
