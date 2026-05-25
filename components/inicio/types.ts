export interface CaminataPendiente {
    id: number;
    codigo: string;
    zona: string;
    estado: string;
    fechaCreacion: string;
    fechaProgramada?: string | null;
    fechaLimite?: string | null;
    coordinador: { name: string | null; username: string };
}

export interface TareaAsignada {
    id: number;
    tipo: string;
    fechaProgramada: string | null;
    fechaLimite: string | null;
    descripcion: string | null;
    createdAt: string;
    creadoPor: { name: string | null; username: string };
}

export interface AlertaResumen {
    id: number;
    tipo: 'reporte' | 'tarjeta';
    titulo: string;
    zona: string;
    creadoPor: { name: string | null; username: string };
    createdAt: string;
}

export interface ARTResumen {
    id: number;
    datos: Record<string, unknown>;
    createdAt: string;
    creadoPor: { name: string | null; username: string };
    caminata: { id: number; codigo: string; zona: string } | null;
}

export const TIPO_TAREA_LABELS: Record<string, string> = {
    caminata: 'Caminata de Seguridad',
    reporte_peligro: 'Reporte de Peligro',
    tarjeta_stop: 'Tarjeta Alto/Stop',
    control_art: 'Control ART',
};
