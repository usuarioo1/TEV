import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/permissions';
import { ROLES } from '@/lib/auth';

interface EmpresasPageProps {
    searchParams: Promise<{ created?: string; error?: string }>;
}

export const dynamic = 'force-dynamic';

export default async function EmpresasPage({ searchParams }: EmpresasPageProps) {
    async function createEmpresaAction(formData: FormData) {
        'use server';

        await requireRole([ROLES.JEFATURAS]);

        const nombreValue = formData.get('nombre');
        const nombre = typeof nombreValue === 'string' ? nombreValue.trim() : '';

        if (!nombre) {
            redirect('/empresas?error=nombre-requerido');
        }

        const empresaExistente = await prisma.empresa.findFirst({
            where: {
                nombre: {
                    equals: nombre,
                    mode: 'insensitive',
                },
            },
            select: { id: true },
        });

        if (empresaExistente) {
            redirect('/empresas?error=nombre-existe');
        }

        await prisma.empresa.create({
            data: {
                nombre,
            },
        });

        revalidatePath('/empresas');
        revalidatePath('/servicios/nuevo');
        revalidatePath('/servicios');
        redirect('/empresas?created=true');
    }

    await requireRole([ROLES.JEFATURAS]);

    const params = await searchParams;
    const errorMessages: Record<string, string> = {
        'nombre-requerido': 'El nombre de la empresa es obligatorio.',
        'nombre-existe': 'Ya existe una empresa con ese nombre.',
    };

    const errorMessage = params.error ? errorMessages[params.error] ?? 'No se pudo crear la empresa.' : null;

    const empresas = await prisma.empresa.findMany({
        orderBy: {
            nombre: 'asc',
        },
    });

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Volver al inicio
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Gestión de Empresas</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Crea las empresas para asignarlas luego en la creación y edición de servicios.
                    </p>
                </div>

                {params.created === 'true' && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                        Empresa creada correctamente.
                    </div>
                )}

                {errorMessage && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                        {errorMessage}
                    </div>
                )}

                <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Nueva empresa</h2>

                    <form action={createEmpresaAction} className="space-y-4">
                        <div>
                            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre de la empresa <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="nombre"
                                name="nombre"
                                type="text"
                                placeholder="Ej: Minera Los Andes"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                        >
                            Crear empresa
                        </button>
                    </form>
                </div>

                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Empresas registradas</h2>
                        <p className="text-sm text-gray-500 mt-1">Total: {empresas.length}</p>
                    </div>

                    {empresas.length === 0 ? (
                        <div className="p-6 text-sm text-gray-500">Aún no hay empresas registradas.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Empresa
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Fecha creación
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {empresas.map((empresa) => (
                                        <tr key={empresa.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{empresa.nombre}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(empresa.createdAt).toLocaleDateString('es-CL', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    timeZone: 'America/Santiago',
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
