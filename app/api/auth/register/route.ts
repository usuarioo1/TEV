import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, isValidRole } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password, rol, name, email, rut, empresa } = body;

        // Validaciones
        if (!username || !password || !rol) {
            return NextResponse.json(
                { error: 'Usuario, contraseña y rol son requeridos' },
                { status: 400 }
            );
        }

        if (!isValidRole(rol)) {
            return NextResponse.json(
                { error: 'Rol inválido. Opciones: jefaturas, coordinador, supervisor, operario' },
                { status: 400 }
            );
        }

        // Verificar si el usuario ya existe
        const existingUser = await prisma.user.findUnique({
            where: { username },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'El usuario ya existe' },
                { status: 409 }
            );
        }

        // Verificar si el email ya existe (si se proporciona)
        if (email) {
            const existingEmail = await prisma.user.findUnique({
                where: { email },
            });

            if (existingEmail) {
                return NextResponse.json(
                    { error: 'El email ya está registrado' },
                    { status: 409 }
                );
            }
        }

        // Hashear la contraseña
        const hashedPassword = await hashPassword(password);

        // Crear el usuario
        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                rol,
                name: name || null,
                email: email || null,
                rut: rut || null,
                empresa: empresa || null,
            },
            select: {
                id: true,
                username: true,
                rol: true,
                name: true,
                email: true,
                rut: true,
                empresa: true,
                createdAt: true,
            },
        });

        return NextResponse.json(
            {
                message: 'Usuario registrado exitosamente',
                user
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error en registro:', error);

        // Manejar errores específicos de Prisma
        if (error.code === 'P2002') {
            const field = error.meta?.target?.[0] || 'campo';
            return NextResponse.json(
                { error: `El ${field} ya está registrado en el sistema` },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: 'Error al registrar usuario' },
            { status: 500 }
        );
    }
}
