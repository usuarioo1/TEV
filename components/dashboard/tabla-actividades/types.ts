export interface ActividadRow {
    tipo: 'caminata' | 'reporte_peligro' | 'tarjeta_stop' | 'control_art';
    nombre: string;
    realizadas: number;
    realizadasFueraPlazo: number;
    proximas: number;
    atrasadas: number;
    totalProgramadas: number;
    cumplimiento: number;
    actividadesRealizadas: null; // placeholder — pendiente de implementar
    actividadesCumplidas: number;
    totalActividades: number;
    estadoCumplimientoTotal: number;
}

export interface TablaFilters {
    fechaInicio: string;
    fechaFin: string;
    userId: string;
}

export interface SimpleUser {
    id: number;
    name: string | null;
    username: string;
    rol: string;
}
