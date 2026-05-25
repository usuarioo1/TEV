import Link from 'next/link';
import type { ServicioRechazoOperarioResumen } from '../dashboard-types';
import { formatDateTime } from '../dashboard-utils';

interface RechazosOperarioModalProps {
    open: boolean;
    loading: boolean;
    error: string | null;
    total: number;
    servicios: ServicioRechazoOperarioResumen[];
    onClose: () => void;
}

export default function RechazosOperarioModal({
    open,
    loading,
    error,
    total,
    servicios,
    onClose,
}: RechazosOperarioModalProps) {
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
                        <h2 className="text-lg font-semibold text-gray-900">Servicios rechazados por operario</h2>
                        <p className="text-sm text-gray-500">Detalle de rechazos para el filtro actual.</p>
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
                        <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700">Total rechazados: {total}</span>
                    </div>
                </div>

                <div className="p-5 overflow-auto max-h-[65vh]">
                    {loading ? (
                        <div className="py-10 text-center text-sm text-gray-500">Cargando servicios...</div>
                    ) : error ? (
                        <div className="py-10 text-center text-sm text-red-600">{error}</div>
                    ) : servicios.length === 0 ? (
                        <div className="py-10 text-center text-sm text-gray-500">No se encontraron rechazos de operario para este filtro.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Servicio</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Estado</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Motivo rechazo</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Operario</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Coordinador</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Fecha rechazo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {servicios.map((servicio) => (
                                        <tr key={servicio.servicioId} className="hover:bg-gray-50">
                                            <td className="px-3 py-2 text-gray-900">
                                                <Link
                                                    href={`/dashboard/operaciones/${servicio.servicioId}`}
                                                    className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                                                >
                                                    {servicio.servicioCodigo}
                                                </Link>
                                                <p className="text-xs text-gray-500 mt-0.5">{servicio.origen} → {servicio.destino}</p>
                                            </td>
                                            <td className="px-3 py-2 text-gray-700">{servicio.estadoServicio}</td>
                                            <td className="px-3 py-2 text-gray-700">
                                                <p className="max-w-xs truncate" title={servicio.motivoRechazo || ''}>{servicio.motivoRechazo || '-'}</p>
                                            </td>
                                            <td className="px-3 py-2 text-gray-700">{servicio.operario}</td>
                                            <td className="px-3 py-2 text-gray-700">{servicio.coordinador}</td>
                                            <td className="px-3 py-2 text-gray-700">
                                                {servicio.fechaRechazo ? formatDateTime(servicio.fechaRechazo) : formatDateTime(servicio.fechaRegistro)}
                                            </td>
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
