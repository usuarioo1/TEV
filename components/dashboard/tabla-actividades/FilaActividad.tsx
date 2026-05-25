import type { ActividadRow } from './types';

interface Props {
    row: ActividadRow;
}

function PctBadge({ value }: { value: number }) {
    const color =
        value >= 80
            ? 'bg-green-100 text-green-700 border-green-200'
            : value >= 50
                ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                : 'bg-red-100 text-red-700 border-red-200';

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${color}`}
        >
            {value}%
        </span>
    );
}

const TIPO_COLORS: Record<ActividadRow['tipo'], string> = {
    caminata: 'border-blue-500',
    reporte_peligro: 'border-orange-500',
    tarjeta_stop: 'border-red-500',
    control_art: 'border-purple-500',
};

export default function FilaActividad({ row }: Props) {
    const cumplimientoConFueraPlazo =
        row.totalProgramadas > 0
            ? Math.round(
                ((row.realizadas + row.realizadasFueraPlazo) / row.totalProgramadas) * 100,
            )
            : 0;

    return (
        <tr className="hover:bg-gray-50 transition-colors">
            {/* Actividad */}
            <td
                className={`px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap border-l-4 ${TIPO_COLORS[row.tipo]}`}
            >
                {row.nombre}
            </td>

            {/* Realizadas */}
            <td className="px-4 py-3 text-sm text-center font-semibold text-green-700">
                {row.realizadas}
            </td>

            {/* Realizadas fuera de plazo */}
            <td className="px-4 py-3 text-sm text-center font-semibold text-orange-600">
                {row.realizadasFueraPlazo}
            </td>

            {/* Próximas */}
            <td className="px-4 py-3 text-sm text-center font-semibold text-blue-600">
                {row.proximas}
            </td>

            {/* Atrasadas */}
            <td className="px-4 py-3 text-sm text-center font-semibold text-red-600">
                {row.atrasadas}
            </td>

            {/* Total programadas */}
            <td className="px-4 py-3 text-sm text-center text-gray-700">
                {row.totalProgramadas}
            </td>

            {/* Cumplimiento */}
            <td className="px-4 py-3 text-center">
                <PctBadge value={row.cumplimiento} />
            </td>

            {/* Actividades no programadas (auto-asignadas / derivadas) */}
            <td className="px-4 py-3 text-sm text-center font-semibold text-purple-600">
                {row.actividadesCumplidas}
            </td>

            {/* Total actividades */}
            <td className="px-4 py-3 text-sm text-center font-semibold text-gray-800">
                {row.totalActividades}
            </td>

            {/* Cumplimiento */}
            <td className="px-4 py-3 text-center">
                <PctBadge value={cumplimientoConFueraPlazo} />
            </td>
        </tr>
    );
}
