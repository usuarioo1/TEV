'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const TIPOS_SEMIREMOLQUE = [
    { value: 'rampa_plana', label: 'Rampa Plana' },
    { value: 'drop_deck', label: 'Drop Deck' },
    { value: 'lowboy', label: 'Lowboy' },
    { value: 'portacontenedor', label: 'Portacontenedor' },
    { value: 'tolva', label: 'Tolva' },
    { value: 'refrigerado', label: 'Refrigerado' },
    { value: 'palote', label: 'Palote' },
    { value: 'neumatiquera', label: 'Neumatiquera' },
    { value: 'otro', label: 'Otro' },
];

export default function CrearSemiremolqueForm() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        patente: '',
        tipo: 'rampa_plana',
        marca: '',
        año: new Date().getFullYear(),
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/equipos/semirremolques', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Error al crear el semirremolque');
            }

            // Redirigir a la página de equipos
            router.push('/equipos?success=semiremolque');
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {/* Patente */}
            <div>
                <label htmlFor="patente" className="block text-sm font-medium text-gray-700 mb-2">
                    Patente *
                </label>
                <input
                    type="text"
                    id="patente"
                    required
                    value={formData.patente}
                    onChange={(e) => setFormData({ ...formData, patente: e.target.value.toUpperCase() })}
                    placeholder="Ej: BB5678"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase text-black"
                    maxLength={10}
                />
                <p className="mt-1 text-sm text-gray-500">
                    Ingrese la patente del semirremolque (sin espacios ni guiones)
                </p>
            </div>

            {/* Tipo */}
            <div>
                <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Semirremolque *
                </label>
                <select
                    id="tipo"
                    required
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                >
                    {TIPOS_SEMIREMOLQUE.map((tipo) => (
                        <option key={tipo.value} value={tipo.value}>
                            {tipo.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Marca */}
            <div>
                <label htmlFor="marca" className="block text-sm font-medium text-gray-700 mb-2">
                    Marca *
                </label>
                <input
                    type="text"
                    id="marca"
                    required
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                    placeholder="Ej: Fruehauf, Great Dane, Utility"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                />
            </div>

            {/* Año */}
            <div>
                <label htmlFor="año" className="block text-sm font-medium text-gray-700 mb-2">
                    Año *
                </label>
                <input
                    type="number"
                    id="año"
                    required
                    value={formData.año}
                    onChange={(e) => setFormData({ ...formData, año: parseInt(e.target.value) })}
                    min={1980}
                    max={new Date().getFullYear() + 1}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                />
                <p className="mt-1 text-sm text-gray-500">
                    Año de fabricación del equipo
                </p>
            </div>

            {/* Botones */}
            <div className="flex gap-4">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isSubmitting ? 'Creando...' : 'Crear Semirremolque'}
                </button>
                <button
                    type="button"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors text-black"
                >
                    Cancelar
                </button>
            </div>
        </form>
    );
}
