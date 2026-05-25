'use client';

import { useState } from 'react';
import {
    Semiremolque,
    SemiremolqueDraft,
    TIPOS_SEMIREMOLQUE,
    getTipoLabel,
} from '@/components/equipos/types';

interface EditableSemirremolquesTableProps {
    semirremolques: Semiremolque[];
    userRole: string;
    onRowUpdated: (updated: Semiremolque) => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

const EMPTY_DRAFT: SemiremolqueDraft = {
    patente: '',
    tipo: 'rampa_plana',
    marca: '',
    anio: '',
    activo: true,
};

async function extractErrorMessage(response: Response, fallback: string) {
    try {
        const data = await response.json();
        return data.error || data.message || fallback;
    } catch {
        return fallback;
    }
}

export default function EditableSemirremolquesTable({
    semirremolques,
    userRole,
    onRowUpdated,
    onSuccess,
    onError,
}: EditableSemirremolquesTableProps) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [draft, setDraft] = useState<SemiremolqueDraft>(EMPTY_DRAFT);
    const [isSaving, setIsSaving] = useState(false);

    const startEdit = (semiremolque: Semiremolque) => {
        setEditingId(semiremolque.id);
        setDraft({
            patente: semiremolque.patente,
            tipo: semiremolque.tipo,
            marca: semiremolque.marca,
            anio: String(semiremolque.año),
            activo: semiremolque.activo,
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setDraft(EMPTY_DRAFT);
    };

    const saveEdit = async (id: number) => {
        if (!draft.patente.trim() || !draft.tipo.trim() || !draft.marca.trim() || !draft.anio.trim()) {
            onError('Todos los campos del semirremolque son requeridos.');
            return;
        }

        const anioNum = Number.parseInt(draft.anio, 10);
        if (Number.isNaN(anioNum)) {
            onError('El año del semirremolque debe ser un número válido.');
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch(`/api/equipos/semirremolques/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    patente: draft.patente,
                    tipo: draft.tipo,
                    marca: draft.marca,
                    año: anioNum,
                    activo: draft.activo,
                }),
            });

            if (!response.ok) {
                const message = await extractErrorMessage(response, 'No se pudo actualizar el semirremolque.');
                throw new Error(message);
            }

            const updated = await response.json();
            onRowUpdated(updated);
            setEditingId(null);
            onSuccess('Semirremolque actualizado exitosamente.');
        } catch (error) {
            onError(error instanceof Error ? error.message : 'Error al actualizar semirremolque.');
        } finally {
            setIsSaving(false);
        }
    };

    if (semirremolques.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay semirremolques</h3>
                <p className="mt-1 text-sm text-gray-500">Comienza agregando un nuevo semirremolque.</p>
            </div>
        );
    }

    return (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Patente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Marca
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Año
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha de Registro
                        </th>
                        {userRole === 'jefaturas' && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {semirremolques.map((semi) => {
                        const isEditing = editingId === semi.id;

                        return (
                            <tr key={semi.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={draft.patente}
                                            onChange={(e) => setDraft({ ...draft, patente: e.target.value.toUpperCase() })}
                                            className="w-full min-w-30 px-3 py-2 border border-gray-300 rounded-md text-sm text-black uppercase"
                                            maxLength={10}
                                        />
                                    ) : (
                                        <div className="text-sm font-medium text-gray-900">
                                            {semi.patente}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {isEditing ? (
                                        <select
                                            value={draft.tipo}
                                            onChange={(e) => setDraft({ ...draft, tipo: e.target.value })}
                                            className="w-full min-w-37.5 px-3 py-2 border border-gray-300 rounded-md text-sm text-black"
                                        >
                                            {TIPOS_SEMIREMOLQUE.map((tipo) => (
                                                <option key={tipo.value} value={tipo.value}>
                                                    {tipo.label}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="text-sm text-gray-900">{getTipoLabel(semi.tipo)}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={draft.marca}
                                            onChange={(e) => setDraft({ ...draft, marca: e.target.value })}
                                            className="w-full min-w-35 px-3 py-2 border border-gray-300 rounded-md text-sm text-black"
                                        />
                                    ) : (
                                        <div className="text-sm text-gray-900">{semi.marca}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            value={draft.anio}
                                            onChange={(e) => setDraft({ ...draft, anio: e.target.value })}
                                            min={1980}
                                            max={new Date().getFullYear() + 1}
                                            className="w-full min-w-27.5 px-3 py-2 border border-gray-300 rounded-md text-sm text-black"
                                        />
                                    ) : (
                                        <div className="text-sm text-gray-900">{semi.año}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {isEditing ? (
                                        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                            <input
                                                type="checkbox"
                                                checked={draft.activo}
                                                onChange={(e) => setDraft({ ...draft, activo: e.target.checked })}
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            Activo
                                        </label>
                                    ) : (
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                semi.activo
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}
                                        >
                                            {semi.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(semi.createdAt).toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </td>
                                {userRole === 'jefaturas' && (
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {isEditing ? (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => saveEdit(semi.id)}
                                                    disabled={isSaving}
                                                    className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-60"
                                                >
                                                    {isSaving ? 'Guardando...' : 'Guardar'}
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    disabled={isSaving}
                                                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-60"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => startEdit(semi)}
                                                disabled={isSaving}
                                                className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-60"
                                            >
                                                Editar
                                            </button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}