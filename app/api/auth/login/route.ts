import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, generateToken } from '@/lib/auth';
import { createSession } from '@/lib/session';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password } = body;

        // Validaciones
        if (!username || !password) {
            return NextResponse.json(
                { error: 'Usuario y contraseña son requeridos' },
                { status: 400 }
            );
        }

        // Buscar el usuario
        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Credenciales inválidas' },
                { status: 401 }
            );
        }

        // Verificar la contraseña
        const isValidPassword = await verifyPassword(password, user.password);

        if (!isValidPassword) {
            return NextResponse.json(
                { error: 'Credenciales inválidas' },
                { status: 401 }
            );
        }

        // Generar token y crear sesión
        const token = generateToken({
            id: user.id,
            username: user.username,
            rol: user.rol as import('@/lib/auth').RolType,
            name: user.name,
            email: user.email,
            rut: user.rut,
            empresa: user.empresa,
        });

        await createSession(token);

        return NextResponse.json({
            message: 'Login exitoso',
            user: {
                id: user.id,
                username: user.username,
                rol: user.rol,
                name: user.name,
            },
        });
    } catch (error) {
        console.error('Error en login:', error);
        return NextResponse.json(
            { error: 'Error al iniciar sesión' },
            { status: 500 }
        );
    }
}
