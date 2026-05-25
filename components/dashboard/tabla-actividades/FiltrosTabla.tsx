'use client';

import { useEffect, useState } from 'react';
import type { TablaFilters, SimpleUser } from './types';

interface Props {
    filters: TablaFilters;
    onChange: (filters: TablaFilters) => void;
    canFilterByUser: boolean;
}

export default function FiltrosTabla({ filters, onChange, canFilterByUser }: Props) {
    const [users, setUsers] = useState<SimpleUser[]>([]);

    useEffect(() => {
        if (!canFilterByUser) return;
        const rolesPermitidos = new Set(['supervisor', 'coordinador', 'jefaturas', 'prevencionista']);
        fetch('/api/users')
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data))
                    setUsers(data.filter((u: SimpleUser) => rolesPermitidos.has(u.rol)));
            })
            .catch(() => { });
    }, [canFilterByUser]);

    const set = (key: keyof TablaFilters, value: string) =>
        onChange({ ...filters, [key]: value });

    const limpiar = () => onChange({ fechaInicio: '', fechaFin: '', userId: '' });

    return (
        <div className="flex flex-wrap items-end gap-4">
            <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                    Desde
                </label>
                <input
                    type="date"
                    value={filters.fechaInicio}
                    onChange={e => set('fechaInicio', e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                    Hasta
                </label>
                <input
                    type="date"
                    value={filters.fechaFin}
                    onChange={e => set('fechaFin', e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
            </div>

            {canFilterByUser && (
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        Empleado
                    </label>
                    <select
                        value={filters.userId}
                        onChange={e => set('userId', e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black min-w-50"
                    >
                        <option value="">Todos los empleados</option>
                        {users.map(u => (
                            <option key={u.id} value={String(u.id)}>
                                {u.name || u.username} — {u.rol}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <button
                onClick={limpiar}
                className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
            >
                Limpiar
            </button>
        </div>
    );
}
