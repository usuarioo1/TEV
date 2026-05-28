'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
    ActivityDetail,
    GestionDesempenoMetrics,
    SimpleUser,
    TablaActividadRow,
} from './types';

interface FiltroState {
    desde: string;
    hasta: string;
    userId: string;
}

const EMPTY_DETAILS: { cumplidas: ActivityDetail[]; vencidas: ActivityDetail[] } = {
    cumplidas: [],
    vencidas: [],
};

export function useGestionDesempenoData() {
    const [rows, setRows] = useState<TablaActividadRow[]>([]);
    const [detalles, setDetalles] = useState(EMPTY_DETAILS);
    const [users, setUsers] = useState<SimpleUser[]>([]);
    const [canFilterByUser, setCanFilterByUser] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [filtro, setFiltro] = useState<FiltroState>({
        desde: '',
        hasta: '',
        userId: '',
    });
    const [detalleActivo, setDetalleActivo] = useState<'cumplidas' | 'vencidas' | null>(null);

    useEffect(() => {
        let mounted = true;

        const loadSessionAndUsers = async () => {
            try {
                const sessionRes = await fetch('/api/auth/session');
                const sessionData = await sessionRes.json();
                if (!sessionRes.ok || !mounted) return;

                const allowFilter =
                    sessionData?.rol === 'jefaturas' ||
                    sessionData?.rol === 'prevencionista';
                setCanFilterByUser(allowFilter);

                if (!allowFilter) return;

                const usersRes = await fetch('/api/users');
                const usersData = await usersRes.json();
                if (!usersRes.ok || !mounted || !Array.isArray(usersData)) return;

                const rolesPermitidos = new Set([
                    'supervisor',
                    'jefaturas',
                    'prevencionista',
                ]);

                setUsers(
                    usersData.filter((u: SimpleUser) => rolesPermitidos.has(u.rol)),
                );
            } catch {
                // Se mantiene sin filtro por trabajador si falla la carga
            }
        };

        loadSessionAndUsers();
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        let mounted = true;

        const fetchRows = async () => {
            setLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams();
                if (filtro.desde) params.set('fechaInicio', filtro.desde);
                if (filtro.hasta) params.set('fechaFin', filtro.hasta);
                if (canFilterByUser && filtro.userId) params.set('userId', filtro.userId);

                const url = params.toString()
                    ? `/api/dashboard/tabla-actividades?${params.toString()}`
                    : '/api/dashboard/tabla-actividades';

                const res = await fetch(url);
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data?.error || 'No se pudieron cargar las actividades');
                }

                if (!mounted) return;

                setRows(Array.isArray(data?.rows) ? data.rows : []);
                setDetalles({
                    cumplidas: Array.isArray(data?.detalles?.cumplidas)
                        ? data.detalles.cumplidas
                        : [],
                    vencidas: Array.isArray(data?.detalles?.vencidas)
                        ? data.detalles.vencidas
                        : [],
                });
            } catch (e) {
                if (!mounted) return;
                setError(e instanceof Error ? e.message : 'Error inesperado');
                setRows([]);
                setDetalles(EMPTY_DETAILS);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        fetchRows();
        return () => {
            mounted = false;
        };
    }, [filtro, canFilterByUser]);

    const aplicarFiltro = () => {
        if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
            setError('La fecha desde no puede ser mayor que la fecha hasta');
            return;
        }

        setFiltro({
            desde: fechaDesde,
            hasta: fechaHasta,
            userId: canFilterByUser ? selectedUserId : '',
        });
    };

    const limpiarFiltro = () => {
        setFechaDesde('');
        setFechaHasta('');
        setSelectedUserId('');
        setFiltro({ desde: '', hasta: '', userId: '' });
        setDetalleActivo(null);
    };

    const toggleDetalle = (tipo: 'cumplidas' | 'vencidas') => {
        setDetalleActivo((prev) => (prev === tipo ? null : tipo));
    };

    const metrics: GestionDesempenoMetrics = useMemo(() => {
        const totalProgramadas = rows.reduce(
            (acc, row) => acc + row.totalProgramadas,
            0,
        );
        const totalCumplidas = rows.reduce(
            (acc, row) => acc + row.realizadas + row.realizadasFueraPlazo,
            0,
        );
        const totalAtrasadas = rows.reduce(
            (acc, row) => acc + row.atrasadas + row.proximas,
            0,
        );

        const cumplimiento =
            totalProgramadas > 0
                ? (totalCumplidas / totalProgramadas) * 100
                : 0;

        const universoGrafico = totalCumplidas + totalAtrasadas;
        const pctCumplidasGrafico =
            universoGrafico > 0
                ? (totalCumplidas / universoGrafico) * 100
                : 0;
        const pctAtrasadasGrafico =
            universoGrafico > 0
                ? (totalAtrasadas / universoGrafico) * 100
                : 0;

        return {
            totalProgramadas,
            totalCumplidas,
            totalAtrasadas,
            cumplimiento,
            universoGrafico,
            pctCumplidasGrafico,
            pctAtrasadasGrafico,
        };
    }, [rows]);

    return {
        rows,
        detalles,
        users,
        canFilterByUser,
        loading,
        error,
        fechaDesde,
        fechaHasta,
        selectedUserId,
        filtro,
        detalleActivo,
        metrics,
        setFechaDesde,
        setFechaHasta,
        setSelectedUserId,
        aplicarFiltro,
        limpiarFiltro,
        toggleDetalle,
    };
}
