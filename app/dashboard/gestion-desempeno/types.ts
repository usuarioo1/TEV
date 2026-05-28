export interface TablaActividadRow {
    tipo: 'caminata' | 'reporte_peligro' | 'tarjeta_stop' | 'control_art';
    nombre: string;
    totalProgramadas: number;
    realizadas: number;
    realizadasFueraPlazo: number;
    proximas: number;
    atrasadas: number;
    cumplimiento: number;
    actividadesCumplidas: number;
    totalActividades: number;
    estadoCumplimientoTotal: number;
}

export interface ActivityDetail {
    id: string;
    tipo: string;
    tarea: string;
    usuario: string;
    estado: 'cumplida' | 'vencida' | 'proxima';
}

export interface SimpleUser {
    id: number;
    name: string | null;
    username: string;
    rol: string;
}

export interface GestionDesempenoMetrics {
    totalProgramadas: number;
    totalCumplidas: number;
    totalAtrasadas: number;
    cumplimiento: number;
    universoGrafico: number;
    pctCumplidasGrafico: number;
    pctAtrasadasGrafico: number;
}

export interface GestionDesempenoData {
    rows: TablaActividadRow[];
    detalles: {
        cumplidas: ActivityDetail[];
        vencidas: ActivityDetail[];
    };
}
