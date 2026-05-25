import Link from 'next/link';
import type { ModalAprobacionesResumen, ServicioAprobacionResumen } from '../dashboard-types';
import { formatDateTime } from '../dashboard-utils';

interface AprobacionesModalProps {
    open: boolean;
    loading: boolean;
    error: string | null;
    resumen: ModalAprobacionesResumen;
    servicios: ServicioAprobacionResumen[];
    onClose: () => void;
}

export default function AprobacionesModal({
    open,
    loading,
    error,
    resumen,
    servicios,
    onClose,
}: AprobacionesModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
                className="absolute inset-0 bg-black/50"
                aria-label="Cerrar modal"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[85vh] overflow-hidden border border-gray-200">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Decisiones de supervisor sobre checklists de fatiga</h2>
                        <p className="text-sm text-gray-500">Incluye servicios del filtro con decisión de supervisor (aprobado/rechazado), aunque el checklist se haya contestado fuera del rango.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 text-sm rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                        Cerrar
                    </button>
                </div>

                <div className="px-5 pt-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
                        <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">Total: {resumen.total}</span>
                        <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700">Aprobadas: {resumen.aprobadas}</span>
                        <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700">Rechazadas: {resumen.rechazadas}</span>
                    </div>
                </div>

                <div className="p-5 overflow-auto max-h-[65vh]">
                    {loading ? (
                        <div className="py-10 text-center text-sm text-gray-500">Cargando servicios...</div>
                    ) : error ? (
                        <div className="py-10 text-center text-sm text-red-600">{error}</div>
                    ) : servicios.length === 0 ? (
                        <div className="py-10 text-center text-sm text-gray-500">No se encontraron decisiones de supervisor para este filtro.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Servicio</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Resultado</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Estado actual</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Supervisor</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Operario</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Coordinador</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Fecha decisión</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {servicios.map((servicio) => (
                                        <tr key={servicio.checklistId} className="hover:bg-gray-50">
                                            <td className="px-3 py-2 text-gray-900">
                                                <Link
                                                    href={`/dashboard/operaciones/${servicio.servicioId}`}
                                                    className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                                                >
                                                    {servicio.servicioCodigo}
                                                </Link>
                                                <p className="text-xs text-gray-500 mt-0.5">{servicio.origen} → {servicio.destino}</p>
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${servicio.tipoResultado === 'APROBADO_SUPERVISOR'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {servicio.tipoResultado === 'APROBADO_SUPERVISOR'
                                                        ? 'Aprobado supervisor'
                                                        : 'Rechazado supervisor'}
                                                </span>
                                                {servicio.motivoRechazo && (
                                                    <p className="text-xs text-red-600 mt-1 max-w-xs truncate" title={servicio.motivoRechazo}>
                                                        Motivo: {servicio.motivoRechazo}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-gray-700">{servicio.estadoServicio}</td>
                                            <td className="px-3 py-2 text-gray-700">{servicio.supervisor}</td>
                                            <td className="px-3 py-2 text-gray-700">{servicio.operario}</td>
                                            <td className="px-3 py-2 text-gray-700">{servicio.coordinador}</td>
                                            <td className="px-3 py-2 text-gray-700">{formatDateTime(servicio.fechaDecision)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
