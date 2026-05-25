import { ESTADO_LABEL, ESTADO_STYLE } from './types';

interface StatusBadgeProps {
    estado?: string;
}

export default function StatusBadge({ estado }: StatusBadgeProps) {
    if (!estado) return null;

    return (
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${ESTADO_STYLE[estado] || 'bg-gray-100 text-gray-600'}`}>
            {ESTADO_LABEL[estado] || estado}
        </span>
    );
}
