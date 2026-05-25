import Link from 'next/link';
import LoginForm from '@/components/LoginForm';

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ registered?: string }>;
}) {
    const params = await searchParams;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Iniciar sesión
                    </h2>

                </div>

                {params.registered === 'true' && (
                    <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                        ¡Registro exitoso! Ahora puedes iniciar sesión.
                    </div>
                )}

                <LoginForm />
            </div>
        </div>
    );
}
