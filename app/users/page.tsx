import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/session';
import { requireRole } from '@/lib/permissions';
import { ROLES } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';
import prisma from '@/lib/prisma';
import SaveUserButton from '@/components/users/SaveUserButton';
import UsersToast from '@/components/users/UsersToast';

interface UsersPageProps {
    searchParams: Promise<{ created?: string; updated?: string; error?: string }>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
    async function updateUserAction(userId: number, formData: FormData) {
        'use server';

        await requireRole([ROLES.JEFATURAS]);

        const nameValue = formData.get('name');
        const emailValue = formData.get('email');
        const passwordValue = formData.get('password');
        const passwordConfirmValue = formData.get('passwordConfirm');

        const name = typeof nameValue === 'string' ? nameValue.trim() : '';
        const emailRaw = typeof emailValue === 'string' ? emailValue.trim().toLowerCase() : '';
        const email = emailRaw.length > 0 ? emailRaw : null;
        const password = typeof passwordValue === 'string' ? passwordValue.trim() : '';
        const passwordConfirm = typeof passwordConfirmValue === 'string' ? passwordConfirmValue.trim() : '';

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            redirect('/users?error=invalid-email');
        }

        if ((password.length > 0 || passwordConfirm.length > 0) && password !== passwordConfirm) {
            redirect('/users?error=password-mismatch');
        }

        if (password.length > 0 && password.length < 6) {
            redirect('/users?error=password-too-short');
        }

        const updateData: {
            name: string | null;
            email: string | null;
            password?: string;
        } = {
            name: name.length > 0 ? name : null,
            email,
        };

        if (password.length > 0) {
            updateData.password = await hashPassword(password);
        }

        await prisma.user.update({
            where: { id: userId },
            data: updateData,
        });

        revalidatePath('/users');
        redirect('/users?updated=true');
    }

    // Solo permitir acceso a usuarios con rol de jefaturas
    await requireRole([ROLES.JEFATURAS]);

    const session = await getSession();
    const params = await searchParams;
    const errorMessages: Record<string, string> = {
        'invalid-email': 'El formato del email no es válido.',
        'password-mismatch': 'Las contraseñas no coinciden.',
        'password-too-short': 'La nueva contraseña debe tener al menos 6 caracteres.',
    };
    const errorMessage = params.error ? errorMessages[params.error] ?? 'No se pudo actualizar el usuario.' : null;

    // Obtener todos los usuarios
    const users = await prisma.user.findMany({
        select: {
            id: true,
            username: true,
            name: true,
            email: true,
            rut: true,
            rol: true,
            createdAt: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    const roleConfig: Array<{ key: string; label: string }> = [
        { key: 'jefaturas', label: 'Jefaturas' },
        { key: 'coordinador', label: 'Coordinador' },
        { key: 'supervisor', label: 'Supervisor' },
        { key: 'operario', label: 'Operario' },
        { key: 'prevencionista', label: 'Prevencionista' },
        { key: 'taller', label: 'Taller' },
    ];

    const roleCounts = users.reduce<Record<string, number>>((acc, user) => {
        acc[user.rol] = (acc[user.rol] ?? 0) + 1;
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Gestión de Usuarios
                            </h1>
                            <p className="mt-2 text-sm text-gray-600">
                                Panel de administración - Solo accesible para Jefaturas
                            </p>
                        </div>
                        <a
                            href="/register"
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Crear Usuario
                        </a>
                    </div>
                </div>

                {/* Success Message */}
                {params.created === 'true' && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex">
                            <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-green-800">
                                    ¡Usuario creado exitosamente!
                                </p>
                                <p className="mt-1 text-sm text-green-700">
                                    El nuevo usuario ha sido registrado en el sistema y ya puede iniciar sesión.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {params.updated === 'true' && (
                    <UsersToast type="success" message="Cambios guardados correctamente." />
                )}

                {errorMessage && (
                    <UsersToast type="error" message={errorMessage} />
                )}

                {/* User Info Banner */}
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        <span className="font-semibold">Acceso autorizado:</span> Estás viendo esta página como{' '}
                        <span className="font-semibold capitalize">{session?.rol}</span>
                    </p>
                </div>

                <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Roles
                        </span>
                        <span className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800">
                            Total {users.length}
                        </span>
                        {roleConfig.map((role) => (
                            <span
                                key={role.key}
                                className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700"
                            >
                                <span>{role.label}</span>
                                <span className="font-semibold text-gray-900">{roleCounts[role.key] ?? 0}</span>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Usuario
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Rol
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    RUT
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fecha de registro
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Editar nombre, email y clave
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                                                {user.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {user.username}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize
                      ${user.rol === 'jefaturas' ? 'bg-purple-100 text-purple-800' : ''}
                      ${user.rol === 'coordinador' ? 'bg-blue-100 text-blue-800' : ''}
                      ${user.rol === 'supervisor' ? 'bg-green-100 text-green-800' : ''}
                      ${user.rol === 'operario' ? 'bg-gray-100 text-gray-800' : ''}
                      ${user.rol === 'prevencionista' ? 'bg-orange-100 text-orange-800' : ''}
                      ${user.rol === 'taller' ? 'bg-yellow-100 text-yellow-800' : ''}
                    `}>
                                            {user.rol}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {user.rut || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(user.createdAt).toLocaleDateString('es-ES', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <form action={updateUserAction.bind(null, user.id)} className="space-y-2">
                                            <input
                                                type="text"
                                                name="name"
                                                defaultValue={user.name || ''}
                                                placeholder="Nombre"
                                                className="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                            <input
                                                type="email"
                                                name="email"
                                                defaultValue={user.email || ''}
                                                placeholder="email@empresa.com"
                                                className="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                            <input
                                                type="password"
                                                name="password"
                                                placeholder="Nueva contraseña (opcional)"
                                                className="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                autoComplete="new-password"
                                                minLength={6}
                                            />
                                            <input
                                                type="password"
                                                name="passwordConfirm"
                                                placeholder="Confirmar nueva contraseña"
                                                className="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                autoComplete="new-password"
                                                minLength={6}
                                            />
                                            <p className="text-xs text-gray-500">
                                                Deja ambos campos de contraseña vacíos si no quieres cambiarla.
                                            </p>
                                            <SaveUserButton />
                                        </form>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}
