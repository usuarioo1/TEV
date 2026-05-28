'use client';

import { useEffect, useMemo, useState } from 'react';

interface UsuarioDistribucion {
    id: number;
    name: string;
    rol: string;
    realizadas: number;
    porRealizar: number;
    proximas: number;
    atrasadas: number;
    total: number;
}

interface DistribucionResponse {
    usuarios: UsuarioDistribucion[];
}

interface DistribucionEstatusUsuariosProps {
    fechaDesde?: string;
    fechaHasta?: string;
}

const ROL_LABEL: Record<string, string> = {
    jefaturas: 'Jefatura',
    supervisor: 'Supervisor',
    coordinador: 'Coordinador',
    prevencionista: 'Prevencionista',
};

export default function DistribucionEstatusUsuarios({
    fechaDesde,
    fechaHasta,
}: DistribucionEstatusUsuariosProps) {
    const [usuarios, setUsuarios] = useState<UsuarioDistribucion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams();
                if (fechaDesde) params.set('fechaInicio', fechaDesde);
                if (fechaHasta) params.set('fechaFin', fechaHasta);

                const url = params.toString()
                    ? `/api/dashboard/distribucion-estatus-usuarios?${params.toString()}`
                    : '/api/dashboard/distribucion-estatus-usuarios';

                const res = await fetch(url);
                const data: DistribucionResponse | { error?: string } = await res.json();

                if (!res.ok) {
                    throw new Error((data as { error?: string }).error || 'No se pudo cargar la distribucion');
                }

                if (!mounted) return;
                setUsuarios(Array.isArray((data as DistribucionResponse).usuarios) ? (data as DistribucionResponse).usuarios : []);
            } catch (e) {
                if (!mounted) return;
                setError(e instanceof Error ? e.message : 'Error inesperado');
                setUsuarios([]);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchData();

        return () => {
            mounted = false;
        };
    }, [fechaDesde, fechaHasta]);

    const hasData = useMemo(
        () => usuarios.some((u) => u.total > 0),
        [usuarios],
    );

    if (loading) {
        return (
            <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                <div className="animate-pulse h-40 bg-gray-100 rounded-lg" />
            </section>
        );
    }

    return (
        <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
            <div className="mb-4">
                <h2 className="text-base font-bold text-gray-900">
                    Distribucion de Estatus Por Usuario Responsable
                </h2>
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-emerald-500" />
                        Por Realizar
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-sky-500" />
                        Realizada
                    </span>
                </div>
            </div>

            {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm p-3">
                    {error}
                </div>
            ) : !usuarios.length ? (
                <p className="text-sm text-gray-500">No hay usuarios para mostrar.</p>
            ) : !hasData ? (
                <p className="text-sm text-gray-500">No hay actividades para el rango seleccionado.</p>
            ) : (
                <div className="max-h-72 overflow-y-auto pr-1">
                    <div className="space-y-2">
                        {usuarios.map((user) => {
                            const pctPorRealizar = user.total > 0 ? (user.porRealizar / user.total) * 100 : 0;
                            const pctRealizada = user.total > 0 ? (user.realizadas / user.total) * 100 : 0;

                            return (
                                <div key={user.id} className="grid grid-cols-[minmax(150px,220px)_1fr] items-center gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm text-gray-700 truncate uppercase">
                                            {user.name}
                                        </p>
                                        <p className="text-[11px] text-gray-500 truncate">
                                            {ROL_LABEL[user.rol] || user.rol}
                                        </p>
                                    </div>

                                    <div className="h-8 rounded-md overflow-hidden bg-gray-100 border border-gray-200 flex">
                                        <div
                                            className="h-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold"
                                            style={{ width: `${pctPorRealizar}%` }}
                                            title={`Por realizar: ${user.porRealizar} (proximas: ${user.proximas}, atrasadas: ${user.atrasadas})`}
                                        >
                                            {pctPorRealizar >= 12 ? `${Math.round(pctPorRealizar)}%` : ''}
                                        </div>
                                        <div
                                            className="h-full bg-sky-500 flex items-center justify-center text-white text-xs font-bold"
                                            style={{ width: `${pctRealizada}%` }}
                                            title={`Realizadas: ${user.realizadas}`}
                                        >
                                            {pctRealizada >= 12 ? `${Math.round(pctRealizada)}%` : ''}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </section>
    );
}
