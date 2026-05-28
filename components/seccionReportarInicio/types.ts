export type TipoFormulario = 'peligro' | 'stop' | 'art';

export interface AlertaItem {
    id: number;
    estado?: string;
    fecha: string;
    creadoPor: string;
    rol?: string;
    responsableCierre?: string | null;
    responsableVerificacion?: string | null;
    fechaCierre?: string | null;
    fechaVerificacion?: string | null;
    comentarioCierre?: string | null;
    comentarioVerificacion?: string | null;
    caminata: {
        codigo: string | null;
        zona: string | null;
        faena: string | null;
    } | null;
    datos?: any;
}

export interface CaminataItem {
    id: number;
    codigo: string;
    zona: string;
    faena: string;
    estado: string;
    fechaCreacion: string;
    coordinador?: { name: string | null; username: string };
    asignado?: { name: string | null; username: string };
    _count?: { reportesPeligro: number; tarjetasStop: number };
}

export interface AlertasSeguridadResponse {
    tarjetasStop: AlertaItem[];
    reportesPendientes: AlertaItem[];
    reportesEnRevision: AlertaItem[];
    reportesPendientesVerificacion: AlertaItem[];
    reportesCerrados: AlertaItem[];
    controlesART: AlertaItem[];
}

export const ESTADO_LABEL: Record<string, string> = {
    PENDIENTE: 'Pendiente',
    EN_REVISION: 'En Revision',
    PENDIENTE_VERIFICACION: 'Pend. Verificacion',
    CERRADO: 'Cerrado',
    EN_PROCESO: 'En Proceso',
    COMPLETADA: 'Completada',
};

export const ESTADO_STYLE: Record<string, string> = {
    PENDIENTE: 'bg-orange-100 text-orange-700',
    EN_REVISION: 'bg-yellow-100 text-yellow-700',
    PENDIENTE_VERIFICACION: 'bg-amber-100 text-amber-700',
    CERRADO: 'bg-green-100 text-green-700',
    EN_PROCESO: 'bg-yellow-100 text-yellow-700',
    COMPLETADA: 'bg-green-100 text-green-700',
};
