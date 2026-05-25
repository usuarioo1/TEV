'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import EditableTractocamionesTable from '@/components/equipos/EditableTractocamionesTable';
import EditableSemirremolquesTable from '@/components/equipos/EditableSemirremolquesTable';
import { Semiremolque, TractoCamion } from '@/components/equipos/types';

export default function EquiposPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [activeTab, setActiveTab] = useState<'tractocamiones' | 'semirremolques'>('tractocamiones');
    const [tractocamiones, setTractocamiones] = useState<TractoCamion[]>([]);
    const [semirremolques, setSemirremolques] = useState<Semiremolque[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [userRole, setUserRole] = useState<string>('');

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const response = await fetch('/api/auth/session');
                if (response.ok) {
                    const data = await response.json();
                    setUserRole(data.rol || '');
                    if (data.rol === 'coordinador') {
                        router.push('/');
                    }
                }
            } catch (error) {
                console.error('Error al obtener sesión:', error);
            }
        };

        fetchSession();
    }, [router]);

    useEffect(() => {
        const success = searchParams.get('success');
        if (success === 'tractocamion') {
            showTemporarySuccess('Tractocamión creado exitosamente');
            setActiveTab('tractocamiones');
            return;
        }

        if (success === 'semiremolque') {
            showTemporarySuccess('Semirremolque creado exitosamente');
            setActiveTab('semirremolques');
        }
    }, [searchParams]);

    useEffect(() => {
        fetchEquipos();
    }, []);

    const fetchEquipos = async () => {
        setLoading(true);
        try {
            const [tractocamionesRes, semirremolquesRes] = await Promise.all([
                fetch('/api/equipos/tractocamiones'),
                fetch('/api/equipos/semirremolques'),
            ]);

            if (!tractocamionesRes.ok || !semirremolquesRes.ok) {
                throw new Error('No se pudieron obtener todos los equipos.');
            }

            const [tractocamionesData, semirremolquesData] = await Promise.all([
                tractocamionesRes.json(),
                semirremolquesRes.json(),
            ]);

            setTractocamiones(tractocamionesData);
            setSemirremolques(semirremolquesData);
        } catch (error) {
            console.error('Error al cargar equipos:', error);
            showTemporaryError('No se pudieron cargar los equipos. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const showTemporarySuccess = (message: string) => {
        setSuccessMessage(message);
        setShowSuccess(true);
        setShowError(false);
        setTimeout(() => setShowSuccess(false), 5000);
    };

    const showTemporaryError = (message: string) => {
        setErrorMessage(message);
        setShowError(true);
        setShowSuccess(false);
        setTimeout(() => setShowError(false), 6000);
    };

    const handleTractoUpdated = (updated: TractoCamion) => {
        setTractocamiones((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    };

    const handleSemiremolqueUpdated = (updated: Semiremolque) => {
        setSemirremolques((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Gestión de Equipos
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Administración de tractocamiones y semirremolques
                    </p>
                </div>

                {showSuccess && (
                    <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                        ✓ {successMessage}
                    </div>
                )}

                {showError && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {errorMessage}
                    </div>
                )}

                <div className="mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('tractocamiones')}
                                className={`${
                                    activeTab === 'tractocamiones'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                            >
                                Tractocamiones ({tractocamiones.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('semirremolques')}
                                className={`${
                                    activeTab === 'semirremolques'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                            >
                                Semirremolques ({semirremolques.length})
                            </button>
                        </nav>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-sm text-gray-600">Cargando equipos...</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'tractocamiones' && (
                            <div>
                                {userRole === 'jefaturas' && (
                                    <div className="mb-6">
                                        <Link
                                            href="/equipos/tractocamiones/nuevo"
                                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Agregar Tractocamión
                                        </Link>
                                    </div>
                                )}

                                <EditableTractocamionesTable
                                    tractocamiones={tractocamiones}
                                    userRole={userRole}
                                    onRowUpdated={handleTractoUpdated}
                                    onSuccess={showTemporarySuccess}
                                    onError={showTemporaryError}
                                />
                            </div>
                        )}

                        {activeTab === 'semirremolques' && (
                            <div>
                                {userRole === 'jefaturas' && (
                                    <div className="mb-6">
                                        <Link
                                            href="/equipos/semirremolques/nuevo"
                                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Agregar Semirremolque
                                        </Link>
                                    </div>
                                )}

                                <EditableSemirremolquesTable
                                    semirremolques={semirremolques}
                                    userRole={userRole}
                                    onRowUpdated={handleSemiremolqueUpdated}
                                    onSuccess={showTemporarySuccess}
                                    onError={showTemporaryError}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
