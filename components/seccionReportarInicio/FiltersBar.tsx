interface FiltersBarProps {
    fechaDesde: string;
    fechaHasta: string;
    onChangeDesde: (value: string) => void;
    onChangeHasta: (value: string) => void;
    onReset: () => void;
}

export default function FiltersBar({
    fechaDesde,
    fechaHasta,
    onChangeDesde,
    onChangeHasta,
    onReset,
}: FiltersBarProps) {
    return (
        <div className="px-6 py-3 border-b bg-white flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold text-gray-500">Filtrar por fecha:</span>
            <input
                type="date"
                value={fechaDesde}
                onChange={(e) => onChangeDesde(e.target.value)}
                className="border rounded-lg px-2 py-1 text-xs"
            />
            <input
                type="date"
                value={fechaHasta}
                onChange={(e) => onChangeHasta(e.target.value)}
                className="border rounded-lg px-2 py-1 text-xs"
            />
            {(fechaDesde || fechaHasta) && (
                <button onClick={onReset} className="text-xs text-gray-500 underline">
                    Limpiar
                </button>
            )}
        </div>
    );
}
