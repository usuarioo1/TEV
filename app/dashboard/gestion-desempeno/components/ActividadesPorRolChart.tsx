'use client';

import { useEffect, useMemo, useState } from 'react';

interface UsuarioDistribucion {
    id: number;
    rol: string;
    total: number;
}

interface DistribucionResponse {
    usuarios: UsuarioDistribucion[];
}

interface RolData {
    rol: string;
    label: string;
    totalProgramadas: number;
}

interface ActividadesPorRolChartProps {
    fechaDesde?: string;
    fechaHasta?: string;
}

const ROL_LABEL: Record<string, string> = {
    jefaturas: 'Jefaturas',
    supervisor: 'Supervisor',
    coordinador: 'Coordinador',
    prevencionista: 'Prev.',
};

export default function ActividadesPorRolChart({
    fechaDesde,
    fechaHasta,
}: ActividadesPorRolChartProps) {
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
                    throw new Error((data as { error?: string }).error || 'No se pudo cargar actividades por rol');
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

    const dataByRole = useMemo<RolData[]>(() => {
        const totals = new Map<string, number>();

        for (const u of usuarios) {
            const current = totals.get(u.rol) ?? 0;
            totals.set(u.rol, current + (u.total || 0));
        }

        return Array.from(totals.entries())
            .map(([rol, totalProgramadas]) => ({
                rol,
                label: ROL_LABEL[rol] || rol,
                totalProgramadas,
            }))
            .sort((a, b) => b.totalProgramadas - a.totalProgramadas);
    }, [usuarios]);

    const maxValue = useMemo(
        () => Math.max(...dataByRole.map((d) => d.totalProgramadas), 1),
        [dataByRole],
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
            <h2 className="text-base font-bold text-gray-900 mb-1">
                Actividades por Rol de Usuario Responsable
            </h2>
            <p className="text-xs text-gray-500 mb-4">
                Conteo de actividades totales programadas agrupadas por rol.
            </p>

            {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm p-3">
                    {error}
                </div>
            ) : dataByRole.length === 0 ? (
                <p className="text-sm text-gray-500">Sin datos para el rango seleccionado.</p>
            ) : (
                <div className="overflow-x-auto">
                    <div className="min-w-120 h-72 border-l border-b border-gray-100 pl-3 pr-2 pb-10 flex items-end gap-5">
                        {dataByRole.map((item) => {
                            const height = Math.max((item.totalProgramadas / maxValue) * 100, item.totalProgramadas > 0 ? 8 : 2);

                            return (
                                <div key={item.rol} className="w-16 shrink-0 flex flex-col items-center">
                                    <span className="text-xs font-semibold text-gray-700 mb-1">
                                        {item.totalProgramadas}
                                    </span>
                                    <div className="h-44 w-10 rounded-md bg-sky-100 border border-sky-200 flex items-end overflow-hidden">
                                        <div
                                            className="w-full rounded-t-sm bg-sky-500"
                                            style={{ height: `${height}%` }}
                                            title={`${item.label}: ${item.totalProgramadas}`}
                                        />
                                    </div>
                                    <p className="mt-2 text-[11px] text-center text-gray-700 leading-tight wrap-break-word w-16">
                                        {item.label}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </section>
    );
}
