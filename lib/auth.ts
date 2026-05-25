import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Roles válidos del sistema
 * - JEFATURAS: Acceso completo al dashboard y toda la información
 * - COORDINADOR: Crea servicios, NO tiene acceso al dashboard
 * - SUPERVISOR: Aprueba checklists, NO tiene acceso al dashboard
 * - OPERARIO: Completa servicios y checklists
 * - PREVENCIONISTA: Gestiona prevención de riesgos y seguridad
 * - TALLER: Gestiona no conformidades mecánicas y de equipos
 */
export const ROLES = {
    JEFATURAS: 'jefaturas',
    COORDINADOR: 'coordinador',
    SUPERVISOR: 'supervisor',
    OPERARIO: 'operario',
    PREVENCIONISTA: 'prevencionista',
    TALLER: 'taller',
} as const;

export type RolType = typeof ROLES[keyof typeof ROLES];

export interface UserPayload {
    id: number;
    username: string;
    rol: RolType;
    name: string | null;
    email: string | null;
    rut: string | null;
    empresa: string | null;
}

/**
 * Hashea una contraseña usando bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

/**
 * Verifica si una contraseña coincide con su hash
 */
export async function verifyPassword(
    password: string,
    hashedPassword: string
): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

/**
 * Genera un token JWT para un usuario
 */
export function generateToken(payload: UserPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verifica y decodifica un token JWT
 */
export function verifyToken(token: string): UserPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as UserPayload;
    } catch (error) {
        return null;
    }
}

/**
 * Valida si un rol es válido
 */
export function isValidRole(rol: string): rol is RolType {
    return Object.values(ROLES).includes(rol as RolType);
}
