'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '@/app/context/SessionContext';

interface FunctionCard {
    title: string;
    description: string;
    href: string;
    icon: React.ReactNode;
    color: string;
    enabled: boolean;
}

export default function InicioPage() {
    const router = useRouter();
    const { session: user, loading } = useSession();

    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.push('/login');
            return;
        }
        if (user.rol === 'operario') {
            router.push('/servicios');
        } else if (user.rol === 'coordinador') {
            router.push('/');
        } else if (user.rol === 'taller') {
            router.push('/');
        }
    }, [user, loading, router]);

    const getWelcomeMessage = () => {
        const hour = new Date().getHours();
        if (hour < 12) return '¡Buenos días';
        if (hour < 19) return '¡Buenas tardes';
        return '¡Buenas noches';
    };

    const getRoleName = (rol: string) => {
        const roles: Record<string, string> = {
            'jefaturas': 'Jefatura',
            'coordinador': 'Coordinador',
            'supervisor': 'Supervisor',
            'operario': 'Operario',
            'prevencionista': 'Prevencionista',
            'taller': 'Taller'
        };
        return roles[rol] || rol;
    };

    // Iconos reutilizables
    const DashboardIcon = (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    );

    const ServicesIcon = (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    );

    const SupervisorIcon = (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );

    const CaminataIcon = (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
    );

    const AlertIcon = (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    );

    const EquipmentIcon = (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
    );

    const UsersIcon = (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    );

    // Funciones disponibles según el rol
    const getFunctionsForRole = (rol: string): FunctionCard[] => {
        const allFunctions: Record<string, FunctionCard[]> = {
            'jefaturas': [
                {
                    title: 'Dashboard',
                    description: 'Visualiza métricas, KPIs y el estado general de operaciones y seguridad',
                    href: '/dashboard',
                    icon: DashboardIcon,
                    color: 'bg-blue-500',
                    enabled: true
                },
                // {
                //     title: 'Servicios',
                //     description: 'Crea, gestiona y consulta servicios de transporte. Asigna conductores y equipos',
                //     href: '/servicios',
                //     icon: ServicesIcon,
                //     color: 'bg-green-500',
                //     enabled: true
                // },
                // {
                //     title: 'Supervisión',
                //     description: 'Revisa y aprueba servicios pendientes. Valida compliance y seguridad',
                //     href: '/supervisor',
                //     icon: SupervisorIcon,
                //     color: 'bg-purple-500',
                //     enabled: true
                // },
                {
                    title: 'Caminatas de Seguridad',
                    description: 'Registra y gestiona caminatas de seguridad, reportes e inspecciones',
                    href: '/caminatas',
                    icon: CaminataIcon,
                    color: 'bg-orange-500',
                    enabled: true
                },
                {
                    title: 'Equipos',
                    description: 'Administra tractocamiones y semirremolques. Mantén registros actualizados',
                    href: '/equipos',
                    icon: EquipmentIcon,
                    color: 'bg-yellow-500',
                    enabled: true
                },
                {
                    title: 'Usuarios',
                    description: 'Gestiona usuarios del sistema, roles y permisos de acceso',
                    href: '/users',
                    icon: UsersIcon,
                    color: 'bg-indigo-500',
                    enabled: true
                },
            ],
            'coordinador': [
                {
                    title: 'Servicios',
                    description: 'Crea, gestiona y consulta servicios de transporte. Asigna conductores y equipos',
                    href: '/servicios',
                    icon: ServicesIcon,
                    color: 'bg-green-500',
                    enabled: true
                },
                // {
                //     title: 'Supervisión',
                //     description: 'Consulta el estado de servicios y sus aprobaciones',
                //     href: '/supervisor',
                //     icon: SupervisorIcon,
                //     color: 'bg-purple-500',
                //     enabled: true
                // },
                {
                    title: 'Caminatas de Seguridad',
                    description: 'Registra caminatas, tarjetas stop, reportes de peligro y controles ART',
                    href: '/caminatas',
                    icon: CaminataIcon,
                    color: 'bg-orange-500',
                    enabled: true
                },
                // {
                //     title: 'Ver Alertas de Seguridad',
                //     description: 'Consulta todas las tarjetas stop, reportes de peligro y controles ART registrados',
                //     href: '/dashboard',
                //     icon: AlertIcon,
                //     color: 'bg-red-500',
                //     enabled: true
                // },
                // {
                //     title: 'Equipos',
                //     description: 'Consulta información de tractocamiones y semirremolques',
                //     href: '/equipos',
                //     icon: EquipmentIcon,
                //     color: 'bg-yellow-500',
                //     enabled: true
                // },
                {
                    title: 'No Conformidades',
                    description: 'Revisa y gestiona no conformidades de documentación detectadas en checklists',
                    href: '/no-conformidades',
                    icon: AlertIcon,
                    color: 'bg-red-500',
                    enabled: true
                },
                {
                    title: 'Hallazgos',
                    description: 'Revisa y gestiona hallazgos detectados en items SI con observación adicional y NO no críticos',
                    href: '/hallazgoschecklist',
                    icon: AlertIcon,
                    color: 'bg-blue-600',
                    enabled: true
                },
            ],
            'supervisor': [
                {
                    title: 'Aprobar Servicios',
                    description: 'Revisa y aprueba servicios pendientes. Valida checklists y documentación',
                    href: '/supervisor',
                    icon: SupervisorIcon,
                    color: 'bg-purple-500',
                    enabled: true
                },
                {
                    title: 'Consultar Servicios',
                    description: 'Visualiza servicios aprobados, completados y rechazados',
                    href: '/servicios',
                    icon: ServicesIcon,
                    color: 'bg-green-500',
                    enabled: true
                },
                {
                    title: 'Caminatas de Seguridad',
                    description: 'Registra caminatas de seguridad y realiza inspecciones en terreno',
                    href: '/caminatas',
                    icon: CaminataIcon,
                    color: 'bg-orange-500',
                    enabled: true
                },
                // {
                //     title: 'Ver Alertas de Seguridad',
                //     description: 'Consulta tarjetas stop, reportes de peligro y controles ART registrados',
                //     href: '/dashboard',
                //     icon: AlertIcon,
                //     color: 'bg-red-500',
                //     enabled: true
                // },
                // {
                //     title: 'Equipos',
                //     description: 'Consulta información de tractocamiones y semirremolques',
                //     href: '/equipos',
                //     icon: EquipmentIcon,
                //     color: 'bg-yellow-500',
                //     enabled: true
                // },
            ],
            'prevencionista': [
                {
                    title: 'Caminatas de Seguridad',
                    description: 'Crea y asigna caminatas de seguridad a supervisores y jefaturas',
                    href: '/caminatas',
                    icon: CaminataIcon,
                    color: 'bg-orange-500',
                    enabled: true
                },
                {
                    title: 'Mis Alertas Pendientes',
                    description: 'Gestiona alertas de seguridad asignadas a ti como responsable de cierre',
                    href: '/caminatas/pendientes',
                    icon: AlertIcon,
                    color: 'bg-red-500',
                    enabled: true
                },
                {
                    title: 'Todas las Alertas',
                    description: 'Visualiza todos los reportes de peligro, tarjetas stop y controles ART',
                    href: '/caminatas/alertas',
                    icon: AlertIcon,
                    color: 'bg-yellow-500',
                    enabled: true
                },
                {
                    title: 'No Conformidades',
                    description: 'Revisa y gestiona no conformidades de EPP detectadas en checklists',
                    href: '/no-conformidades',
                    icon: AlertIcon,
                    color: 'bg-red-600',
                    enabled: true
                },
                {
                    title: 'Hallazgos',
                    description: 'Revisa y gestiona hallazgos detectados en items SI con observación adicional y NO no críticos',
                    href: '/hallazgoschecklist',
                    icon: AlertIcon,
                    color: 'bg-blue-600',
                    enabled: true
                },
                {
                    title: 'Equipos',
                    description: 'Consulta información de tractocamiones y semirremolques',
                    href: '/equipos',
                    icon: EquipmentIcon,
                    color: 'bg-blue-500',
                    enabled: true
                },
            ],
            'taller': [
                {
                    title: 'No Conformidades',
                    description: 'Gestiona no conformidades mecánicas y de equipos detectadas en checklists',
                    href: '/no-conformidades',
                    icon: AlertIcon,
                    color: 'bg-orange-600',
                    enabled: true
                },
                {
                    title: 'Hallazgos',
                    description: 'Gestiona hallazgos detectados en items SI con observación adicional y NO no críticos',
                    href: '/hallazgoschecklist',
                    icon: AlertIcon,
                    color: 'bg-blue-600',
                    enabled: true
                },
                {
                    title: 'Equipos',
                    description: 'Consulta información de tractocamiones y semirremolques',
                    href: '/equipos',
                    icon: EquipmentIcon,
                    color: 'bg-yellow-500',
                    enabled: true
                },
            ]
        };

        return allFunctions[rol] || [];
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const functions = getFunctionsForRole(user.rol);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="bg-linear-to-r from-blue-600 to-blue-800 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <h1 className="text-4xl font-bold mb-2">
                        {getWelcomeMessage()}, {user.name}!
                    </h1>
                    <p className="text-blue-100 text-lg">
                        {getRoleName(user.rol)} • Sistema de Gestión de Transportes
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Accesos Rápidos
                    </h2>
                    <p className="text-gray-600">
                        Selecciona una función para comenzar a trabajar
                    </p>
                </div>

                {/* Function Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {functions.map((func, index) => (
                        <Link
                            key={index}
                            href={func.href}
                            className={`group relative bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden ${!func.enabled ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            {/* Color Bar */}
                            <div className={`h-2 ${func.color}`}></div>

                            {/* Card Content */}
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`${func.color} text-white p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                                        {func.icon}
                                    </div>
                                    <svg
                                        className="w-6 h-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>

                                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                    {func.title}
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    {func.description}
                                </p>
                            </div>

                            {/* Hover Effect */}
                            <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-400 rounded-lg transition-colors pointer-events-none"></div>
                        </Link>
                    ))}
                </div>

                {/* Quick Stats or Info */}
                <div className="mt-12 bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                ¿Necesitas ayuda?
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Usa el menú de navegación superior para acceder a todas las funciones disponibles
                            </p>
                        </div>
                        <div className="hidden sm:block">
                            <svg className="w-16 h-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
