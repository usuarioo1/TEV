import type { SimpleUser } from '../types';

interface FiltrosDesempenoProps {
    fechaDesde: string;
    fechaHasta: string;
    selectedUserId: string;
    canFilterByUser: boolean;
    users: SimpleUser[];
    hasFiltroActivo: boolean;
    onFechaDesdeChange: (value: string) => void;
    onFechaHastaChange: (value: string) => void;
    onSelectedUserIdChange: (value: string) => void;
    onAplicar: () => void;
    onLimpiar: () => void;
}

export default function FiltrosDesempeno({
    fechaDesde,
    fechaHasta,
    selectedUserId,
    canFilterByUser,
    users,
    hasFiltroActivo,
    onFechaDesdeChange,
    onFechaHastaChange,
    onSelectedUserIdChange,
    onAplicar,
    onLimpiar,
}: FiltrosDesempenoProps) {
    return (
        <div className="mb-5 flex flex-wrap items-end gap-2 sm:gap-3">
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                    Desde
                </label>
                <input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => onFechaDesdeChange(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-50 text-black"
                />
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                    Hasta
                </label>
                <input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => onFechaHastaChange(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-50 text-black"
                />
            </div>

            {canFilterByUser && (
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                        Trabajador
                    </label>
                    <select
                        value={selectedUserId}
                        onChange={(e) => onSelectedUserIdChange(e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-50 text-black min-w-56"
                    >
                        <option value="">Todos los trabajadores</option>
                        {users.map((u) => (
                            <option key={u.id} value={String(u.id)}>
                                {u.name || u.username} - {u.rol}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <button
                onClick={onAplicar}
                className="px-4 py-2 bg-cyan-600 text-white text-sm rounded-lg hover:bg-cyan-700 transition-colors"
            >
                Aplicar
            </button>

            {hasFiltroActivo && (
                <button
                    onClick={onLimpiar}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                >
                    Limpiar
                </button>
            )}
        </div>
    );
}
