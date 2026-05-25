'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Supervisor {
    id: number;
    name: string | null;
    username: string;
}

interface EnviarAprobacionFormProps {
    servicioId: number;
    initialSupervisorResponsableId?: number | null;
    bloqueadoPorNoConformidadesCriticas?: boolean;
}

export default function EnviarAprobacionForm({
    servicioId,
    initialSupervisorResponsableId,
    bloqueadoPorNoConformidadesCriticas = false,
}: EnviarAprobacionFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [loadingSupervisores, setLoadingSupervisores] = useState(true);
    const [error, setError] = useState('');
    const [confirmado, setConfirmado] = useState(false);
    const [supervisores, setSupervisores] = useState<Supervisor[]>([]);
    const [redirectingPorCriticos, setRedirectingPorCriticos] = useState(false);
    const [supervisorResponsableId, setSupervisorResponsableId] = useState<number | ''>(
        initialSupervisorResponsableId ?? ''
    );

    useEffect(() => {
        if (!bloqueadoPorNoConformidadesCriticas) {
            return;
        }

        setRedirectingPorCriticos(true);
        const timeoutId = setTimeout(() => {
            router.push('/servicios');
        }, 2500);

        return () => clearTimeout(timeoutId);
    }, [bloqueadoPorNoConformidadesCriticas, router]);

    useEffect(() => {
        let isMounted = true;

        const fetchSupervisores = async () => {
            try {
                const response = await fetch('/api/users?rol=supervisor');
                if (!response.ok) {
                    throw new Error('No se pudieron cargar los supervisores');
                }

                const data = await response.json();
                if (isMounted) {
                    setSupervisores(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : 'Error al cargar supervisores');
                }
            } finally {
                if (isMounted) {
                    setLoadingSupervisores(false);
                }
            }
        };

        fetchSupervisores();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (bloqueadoPorNoConformidadesCriticas) {
            router.push('/servicios');
            return;
        }

        if (!supervisorResponsableId) {
            setError('Debes seleccionar un supervisor para enviar la aprobación');
            return;
        }

        if (!confirmado) {
            setError('Debes confirmar que las validaciones son correctas');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/servicios/${servicioId}/enviar-aprobacion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supervisorResponsableId: Number(supervisorResponsableId),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 409 && data?.requiresResend) {
                    router.push('/servicios');
                    return;
                }
                throw new Error(data.message || 'Error al enviar a aprobación');
            }

            // Redirigir al dashboard de servicios
            router.push('/servicios');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Confirmación
            </h2>

            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {bloqueadoPorNoConformidadesCriticas && (
                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-md p-3">
                    <p className="text-sm text-amber-800">
                        Hay no conformidades críticas abiertas en checklist de tracto camión o semirremolque.
                        Este formulario no se enviará a aprobación todavía.
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                        {redirectingPorCriticos
                            ? 'Redirigiendo a servicios para volver a enviar cuando se cierren...'
                            : 'Redirigiendo a servicios...'}
                    </p>
                </div>
            )}

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supervisor Responsable y a Cargo de la Tarea <span className="text-red-500">*</span>
                </label>
                <select
                    value={supervisorResponsableId}
                    onChange={(e) => {
                        const value = e.target.value;
                        setSupervisorResponsableId(value ? Number(value) : '');
                        setError('');
                    }}
                    disabled={loadingSupervisores || loading || bloqueadoPorNoConformidadesCriticas}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black disabled:bg-gray-50"
                    required
                >
                    <option value="">
                        {loadingSupervisores ? 'Cargando supervisores...' : 'Seleccione un supervisor'}
                    </option>
                    {supervisores.map((supervisor) => (
                        <option key={supervisor.id} value={supervisor.id}>
                            {supervisor.name || supervisor.username}
                        </option>
                    ))}
                </select>
                {!loadingSupervisores && supervisores.length === 0 && (
                    <p className="mt-1 text-xs text-red-600">
                        No hay supervisores disponibles para asignar.
                    </p>
                )}
            </div>

            {/* Checkbox de Confirmación */}
            <div className="mb-6">
                <label className="flex items-start">
                    <input
                        type="checkbox"
                        checked={confirmado}
                        onChange={(e) => {
                            setConfirmado(e.target.checked);
                            setError('');
                        }}
                        disabled={bloqueadoPorNoConformidadesCriticas}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700">
                        Confirmo que he realizado todas las validaciones correctamente y que la información
                        proporcionada es precisa. Entiendo que un supervisor revisará este servicio antes de
                        autorizar su ejecución.
                    </span>
                </label>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={() => {
                        if (bloqueadoPorNoConformidadesCriticas) {
                            router.push('/servicios');
                            return;
                        }
                        router.back();
                    }}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                    disabled={loading}
                >
                    {bloqueadoPorNoConformidadesCriticas ? 'Ir a Servicios' : 'Cancelar'}
                </button>
                <button
                    type="submit"
                    disabled={
                        loading
                        || loadingSupervisores
                        || !confirmado
                        || !supervisorResponsableId
                        || supervisores.length === 0
                        || bloqueadoPorNoConformidadesCriticas
                    }
                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {bloqueadoPorNoConformidadesCriticas
                        ? 'Pendiente de Corrección Crítica'
                        : loading
                            ? 'Enviando...'
                            : 'Enviar a Aprobación'}
                </button>
            </div>
        </form>
    );
}
