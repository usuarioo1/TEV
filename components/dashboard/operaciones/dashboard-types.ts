import type { Servicio } from './types';

export interface OperacionesMetrics {
    serviciosPorEstado: Record<string, number>;
    serviciosCompletados: {
        hoy: number;
        semana: number;
        mes: number;
        mesAnterior: number;
        crecimiento: number;
    };
    seguridad: {
        porcentajeEquiposOk: number;
        totalChecklistEquipo: number;
        totalChecklistTracto: number;
        conductoresNoAptos: number;
        conductoresReemplazo: number;
        porcentajeConductoresAptos: number;
        totalChecklistFatiga: number;
    };
    alertas: {
        equiposConProblemas: number;
        equiposConProblemasEnCompletados: number;
        tractosConProblemas: number;
    };
    tiempos: {
        promedioCicloHoras: number;
        totalServiciosAnalizados: number;
    };
    aprobaciones: {
        tasaAprobacion: number;
        totalAprobaciones: number;
        aprobadas: number;
        rechazadas: number;
    };
    aceptacionOperarios: {
        porcentaje: number;
        totalAsignados: number;
        aceptados: number;
        rechazados: number;
        sinRespuesta: number;
    };
    noConformidades: {
        topNC: Array<{
            categoria: string;
            item: string;
            frecuencia: number;
            tipo: 'equipo' | 'tracto';
            serviciosAfectados: number;
            equiposReincidentes: number;
            ultimaDeteccion: string;
        }>;
        totalNC: number;
        porServicio: Array<{
            servicioId: number;
            servicioCodigo: string;
            totalNC: number;
            ncEquipo: number;
            ncTracto: number;
        }>;
    };
    tendencia: Array<{
        fecha: string;
        completados: number;
    }>;
}

export type TipoNoConformidad = 'equipo' | 'tracto';

export interface ServicioConNoConformidad {
    checklistId: number;
    servicioId: number;
    servicioCodigo: string;
    servicioEstado: string;
    descripcion: string;
    origen: string;
    destino: string;
    patente: string;
    fechaChecklist: string;
    operario: string;
    coordinador: string;
}

export interface ServiciosNoConformidadResponse {
    tipo: TipoNoConformidad;
    total: number;
    servicios: ServicioConNoConformidad[];
}

export interface PersonaResumen {
    name: string | null;
    username: string;
}

export interface ServicioCompletado {
    id: number;
    codigo: string;
    descripcion: string;
    origen: string;
    destino: string;
    estado: string;
    fechaAsignacion: string;
    fechaFinalizacion: string | null;
    operario: PersonaResumen | null;
    coordinador: PersonaResumen | null;
}

export interface ServiciosCompletadosResponse {
    servicios: ServicioCompletado[];
    total: number;
}

export interface ServicioAprobacionResumen {
    checklistId: number;
    aprobacionId: number | null;
    tipoResultado: 'APROBADO_SUPERVISOR' | 'RECHAZADO_SUPERVISOR';
    aprobado: boolean;
    fechaDecision: string;
    fechaRegistro: string;
    motivoRechazo: string | null;
    supervisor: string;
    servicioId: number;
    servicioCodigo: string;
    descripcion: string;
    origen: string;
    destino: string;
    estadoServicio: string;
    fechaAsignacion: string;
    operario: string;
    coordinador: string;
}

export interface ServiciosAprobacionResponse {
    total: number;
    aprobadas: number;
    rechazadas: number;
    servicios: ServicioAprobacionResumen[];
}

export interface ModalAprobacionesResumen {
    total: number;
    aprobadas: number;
    rechazadas: number;
}

export interface ServicioRechazoOperarioResumen {
    servicioId: number;
    servicioCodigo: string;
    descripcion: string;
    origen: string;
    destino: string;
    estadoServicio: string;
    motivoRechazo: string | null;
    fechaAsignacion: string;
    fechaRechazo: string | null;
    fechaRegistro: string;
    operario: string;
    coordinador: string;
}

export interface ServiciosRechazoOperarioResponse {
    total: number;
    servicios: ServicioRechazoOperarioResumen[];
}

export interface ChecklistFatigaResumen {
    checklistId: number;
    aptoParaTrabajar: boolean;
    requiereReemplazo: boolean;
    observaciones: string | null;
    fechaChecklist: string;
    servicioId: number;
    servicioCodigo: string;
    descripcion: string;
    origen: string;
    destino: string;
    estadoServicio: string;
    fechaAsignacion: string;
    operario: string;
    coordinador: string;
}

export interface ConductoresAptosDetalleResponse {
    total: number;
    aptos: number;
    noAptos: number;
    conReemplazo: number;
    checklists: ChecklistFatigaResumen[];
}

export interface OperacionesExportResponse {
    servicios: Servicio[];
    total: number;
}

export interface DateFilter {
    desde: string;
    hasta: string;
}
