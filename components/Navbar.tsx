'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ROLES } from '@/lib/auth';
import LogoutButton from './LogoutButton';
import { useSession } from '@/app/context/SessionContext';

interface SessionData {
    id: string;
    username: string;
    rol: string;
    name: string;
    email: string;
    rut: string;
    empresa: string;
}

export default function Navbar() {
    const { session } = useSession();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [adminMenuOpen, setAdminMenuOpen] = useState(false);
    const [caminatasPendientes, setCaminatasPendientes] = useState(0);
    const adminRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (adminRef.current && !adminRef.current.contains(e.target as Node)) {
                setAdminMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        // Fetch caminatas pendientes usando endpoint ligero de count
        const fetchCaminatasPendientes = () => {
            if (session?.rol === ROLES.SUPERVISOR) {
                fetch('/api/caminatas/pendientes-count')
                    .then(res => {
                        if (!res.ok) return { count: 0 };
                        return res.json();
                    })
                    .then(data => setCaminatasPendientes(data.count ?? 0))
                    .catch(() => setCaminatasPendientes(0));
            }
        };

        // Fetch inicial
        fetchCaminatasPendientes();

        // Escuchar eventos de cambio de estado de caminatas
        const handleCaminataChange = () => {
            fetchCaminatasPendientes();
        };

        window.addEventListener('caminataEstadoChanged', handleCaminataChange);

        // Cleanup
        return () => {
            window.removeEventListener('caminataEstadoChanged', handleCaminataChange);
        };
    }, [session]);

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo / Brand */}
                    <div className="flex items-center">
                        <Link href={session ? "/" : "/"} className="flex items-center hover:opacity-80 transition-opacity">
                            <Image
                                src="/assets/viasentra3.png"
                                alt="ViaSentra Logo"
                                width={220}
                                height={60}
                                priority
                                className="h-10 w-auto"
                            />
                        </Link>
                    </div>

                    {/* Desktop Navigation Links - eliminados, todo se gestiona desde "/" */}

                    {/* Right Side: User Info & Mobile Menu Button */}
                    <div className="flex items-center space-x-2">
                        {session ? (
                            <>
                                {/* Asignar actividades - solo prevencionista */}
                                {session.rol === ROLES.PREVENCIONISTA && (
                                    <Link
                                        href="/caminatas/nueva"
                                        className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors text-sm font-medium"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Asignar actividades
                                    </Link>
                                )}

                                {/* Gestionar servicios - solo coordinador */}
                                {session.rol === ROLES.COORDINADOR && (
                                    <Link
                                        href="/servicios"
                                        className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors text-sm font-medium"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        Gestionar servicios
                                    </Link>
                                )}

                                {/* Gestion de servicios - solo supervisor */}
                                {session.rol === ROLES.SUPERVISOR && (
                                    <Link
                                        href="/supervisor"
                                        className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors text-sm font-medium"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Gestion de servicios
                                    </Link>
                                )}

                                {/* Administración dropdown - solo jefaturas */}
                                {session.rol === 'jefaturas' && (
                                    <div className="relative hidden md:block" ref={adminRef}>
                                        <button
                                            onClick={() => setAdminMenuOpen(v => !v)}
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors text-sm font-medium"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            Administración
                                            <svg className={`w-4 h-4 transition-transform ${adminMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        {adminMenuOpen && (
                                            <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                                                <Link
                                                    href="/users"
                                                    onClick={() => setAdminMenuOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                                                >
                                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                    </svg>
                                                    Gestión de Usuarios
                                                </Link>
                                                <Link
                                                    href="/empresas"
                                                    onClick={() => setAdminMenuOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                                                >
                                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
                                                    </svg>
                                                    Gestión de Empresas
                                                </Link>
                                                <Link
                                                    href="/equipos"
                                                    onClick={() => setAdminMenuOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                                                >
                                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                                    </svg>
                                                    Gestión de Equipos
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* User Info Card - Desktop */}
                                <div className="hidden sm:flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-gray-900">
                                            {session.username}
                                        </p>
                                        <p className="text-xs text-gray-500 capitalize">
                                            {session.rol}
                                        </p>
                                    </div>
                                    <div className="h-9 w-9 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-sm">
                                        {session.username.charAt(0).toUpperCase()}
                                    </div>
                                </div>

                                {/* Logout Button - Desktop */}
                                <div className="hidden md:block">
                                    <LogoutButton variant="navbar" />
                                </div>

                                {/* Mobile menu button */}
                                <button
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all"
                                    aria-expanded={mobileMenuOpen}
                                >
                                    <span className="sr-only">Abrir menú</span>
                                    {!mobileMenuOpen ? (
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                        </svg>
                                    ) : (
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    )}
                                </button>
                            </>
                        ) : (
                            <Link
                                href="/login"
                                className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
                            >
                                Iniciar sesión
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile menu - solo muestra info de usuario y logout */}
            {mobileMenuOpen && session && (
                <div className="md:hidden border-t border-gray-200 bg-white">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {/* Mobile User Info */}
                        <div className="flex items-center space-x-3 px-3 py-3 bg-gray-50 rounded-lg mb-2">
                            <div className="h-10 w-10 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                                {session.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">{session.username}</p>
                                <p className="text-xs text-gray-500 capitalize">{session.rol}</p>
                            </div>
                        </div>

                        {/* Asignar actividades - Mobile (solo prevencionista) */}
                        {session.rol === ROLES.PREVENCIONISTA && (
                            <div className="px-3 pb-1">
                                <Link
                                    href="/caminatas/nueva"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Asignar actividades
                                </Link>
                            </div>
                        )}

                        {/* Gestionar servicios - Mobile (solo coordinador) */}
                        {session.rol === ROLES.COORDINADOR && (
                            <div className="px-3 pb-1">
                                <Link
                                    href="/servicios"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Gestionar servicios
                                </Link>
                            </div>
                        )}

                        {/* Gestion de servicios - Mobile (solo supervisor) */}
                        {session.rol === ROLES.SUPERVISOR && (
                            <div className="px-3 pb-1">
                                <Link
                                    href="/supervisor"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Gestion de servicios
                                </Link>
                            </div>
                        )}

                        {/* Administración - Mobile (solo jefaturas) */}
                        {session.rol === 'jefaturas' && (
                            <div className="px-3 pb-1">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-1">Administración</p>
                                <Link
                                    href="/users"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    Gestión de Usuarios
                                </Link>
                                <Link
                                    href="/empresas"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
                                    </svg>
                                    Gestión de Empresas
                                </Link>
                                <Link
                                    href="/equipos"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                    </svg>
                                    Gestión de Equipos
                                </Link>
                            </div>
                        )}

                        {/* Logout Button - Mobile */}
                        <div className="px-3 pt-2 border-t border-gray-200 mt-2">
                            <LogoutButton variant="mobile" />
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
