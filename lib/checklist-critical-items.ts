export type ChecklistCriticoTipo = 'TRACTO_CAMION' | 'SEMIREMOLQUE';

export const TRACTO_CAMION_CRITICAL_ITEMS = [
    'Licencia de conducir',
    'Permiso de circulación',
    'Revisión técnica',
    'Seguro obligatorio',
    'Padrón',
    'Casco de seguridad',
    'Guantes de seguridad',
    'Botín de seguridad',
    'Geólogo reflectante',
    'Gafas de seguridad',
    'Intermitentes izquierdo/derecho',
    'Luces bajas/altas',
    'Luces de freno',
    'Luces de estacionamiento',
    'Tacógrafo',
    'Aire acondicionado',
    'Freno de parqueo',
    'Freno de emergencia',
    'Freno de pedal',
    'Alarma de retroceso',
    'Gata hidráulica',
    'Llave de tuerca',
    'Triángulos reflectantes x2',
    'Extintor de cabina',
    'Extintor exterior (10-6 kg)',
    'Espejos',
    'Cintas reflectantes laterales y portalón',
    'Neumáticos (Todos los ejes y repuesto)',
    'Conexión hidráulica / eléctrica / aire',
    'Tercer ojo',
    'Patentes x2',
] as const;

export const SEMIREMOLQUE_CRITICAL_ITEMS = [
    'Permiso de circulación',
    'Revisión técnica',
    'Seguro obligatorio',
    'Padrón',
    'Conexión eléctrica (Enchufe y chicote eléctrico)',
    'Conexión de aire (mangueras x2)',
    'Estado de neumáticos por eje',
    'Seguro de tuercas',
    'Cinta reflectante lateral',
    'Cintas reflectante portalón (roja y blanca)',
    'Luces (Estacionamiento, intermitentes, freno, focos, etc.)',
    'Alarma de retroceso',
    'Patas de apoyo',
    'Neumáticos de repuesto',
] as const;

function normalizeChecklistItemName(itemNombre: string): string {
    return itemNombre
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .toUpperCase();
}

function normalizeChecklistValor(valor: unknown): string {
    if (typeof valor !== 'string') {
        return '';
    }

    return valor
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase();
}

const CRITICAL_ITEMS_BY_CHECKLIST: Record<ChecklistCriticoTipo, Set<string>> = {
    TRACTO_CAMION: new Set(TRACTO_CAMION_CRITICAL_ITEMS.map((item) => normalizeChecklistItemName(item))),
    SEMIREMOLQUE: new Set(SEMIREMOLQUE_CRITICAL_ITEMS.map((item) => normalizeChecklistItemName(item))),
};

export function isChecklistItemCritico(checklistTipo: ChecklistCriticoTipo, itemNombre: string): boolean {
    return CRITICAL_ITEMS_BY_CHECKLIST[checklistTipo].has(normalizeChecklistItemName(itemNombre));
}

export function isChecklistValorNoConformidad(valor: unknown): boolean {
    const normalized = normalizeChecklistValor(valor);
    return normalized === 'NO' || normalized === 'NC';
}

export function getChecklistItemValor(rawItem: unknown): string {
    if (typeof rawItem === 'object' && rawItem !== null && 'valor' in rawItem) {
        const value = (rawItem as { valor?: unknown }).valor;
        return normalizeChecklistValor(value);
    }

    return normalizeChecklistValor(rawItem);
}

export function hasChecklistNoCritico(
    checklistTipo: ChecklistCriticoTipo,
    items: Record<string, Record<string, unknown>> | null | undefined,
): boolean {
    if (!items || typeof items !== 'object') {
        return false;
    }

    for (const seccionItems of Object.values(items)) {
        if (!seccionItems || typeof seccionItems !== 'object') {
            continue;
        }

        for (const [itemNombre, rawItem] of Object.entries(seccionItems as Record<string, unknown>)) {
            if (!isChecklistItemCritico(checklistTipo, itemNombre)) {
                continue;
            }

            if (isChecklistValorNoConformidad(getChecklistItemValor(rawItem))) {
                return true;
            }
        }
    }

    return false;
}
