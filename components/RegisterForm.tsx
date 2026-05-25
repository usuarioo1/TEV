'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterForm() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        rol: 'operario',
        name: '',
        email: '',
        rut: '',
        empresa: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        // Validar que las contraseñas coincidan
        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (formData.password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password,
                    rol: formData.rol,
                    name: formData.name || undefined,
                    email: formData.email || undefined,
                    rut: formData.rut || undefined,
                    empresa: formData.empresa || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al registrar');
            }

            // Redirigir a la página de gestión de usuarios después del registro exitoso
            router.push('/users?created=true');
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al registrar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
            <div>
                <label htmlFor="username" className="block text-sm font-medium mb-1 text-black">
                    Usuario *
                </label>
                <input
                    id="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    disabled={loading}
                />
            </div>

            <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1 text-black">
                    Nombre completo
                </label>
                <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    disabled={loading}
                />
            </div>

            <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1 text-black">
                    Email
                </label>
                <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    disabled={loading}
                />
            </div>

            <div>
                <label htmlFor="rut" className="block text-sm font-medium mb-1 text-black">
                    RUT
                </label>
                <input
                    id="rut"
                    type="text"
                    placeholder="12.345.678-9"
                    value={formData.rut}
                    onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    disabled={loading}
                />
            </div>

            <div>
                <label htmlFor="empresa" className="block text-sm font-medium mb-1 text-black">
                    Empresa
                </label>
                <input
                    id="empresa"
                    type="text"
                    placeholder="Nombre de la empresa"
                    value={formData.empresa}
                    onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    disabled={loading}
                />
            </div>

            <div>
                <label htmlFor="rol" className="block text-sm font-medium mb-1 text-black">
                    Rol *
                </label>
                <select
                    id="rol"
                    required
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    disabled={loading}
                >
                    <option value="operario">Operario</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="coordinador">Coordinador</option>
                    <option value="jefaturas">Jefaturas</option>
                    <option value="prevencionista">Prevencionista</option>
                    <option value="taller">Taller</option>
                </select>
            </div>

            <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1 text-black">
                    Contraseña *
                </label>
                <input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    disabled={loading}
                />
            </div>

            <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1 text-black">
                    Confirmar contraseña *
                </label>
                <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    disabled={loading}
                />
            </div>

            {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
                {loading ? 'Registrando...' : 'Registrarse'}
            </button>
        </form>
    );
}
