export interface TractoCamion {
    id: number;
    patente: string;
    marca: string;
    año: number;
    activo: boolean;
    createdAt: string;
}

export interface Semiremolque {
    id: number;
    patente: string;
    tipo: string;
    marca: string;
    año: number;
    activo: boolean;
    createdAt: string;
}

export interface TractoCamionDraft {
    patente: string;
    marca: string;
    anio: string;
    activo: boolean;
}

export interface SemiremolqueDraft {
    patente: string;
    tipo: string;
    marca: string;
    anio: string;
    activo: boolean;
}

export const TIPOS_SEMIREMOLQUE = [
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

const TIPOS_LABELS: Record<string, string> = {
    rampa_plana: 'Rampa Plana',
    drop_deck: 'Drop Deck',
    lowboy: 'Lowboy',
    portacontenedor: 'Portacontenedor',
    tolva: 'Tolva',
    refrigerado: 'Refrigerado',
    palote: 'Palote',
    neumatiquera: 'Neumatiquera',
    otro: 'Otro',
};

export function getTipoLabel(tipo: string): string {
    return TIPOS_LABELS[tipo] || tipo;
}