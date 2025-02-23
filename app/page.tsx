'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from './services/api';

export default function HomePage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const token = api.getToken();
        setIsLoggedIn(!!token);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-b from-indigo-100 to-white">
            {/* Navigation */}
            <nav className="bg-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <Link href="/" className="flex items-center">
                                <span className="text-2xl font-bold text-indigo-600">Atlas Boost</span>
                            </Link>
                        </div>
                        <div className="flex items-center space-x-4">
                            {!isLoggedIn ? (
                                <>
                                    <Link
                                        href="/login"
                                        className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        Giriş Yap
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                                    >
                                        Kayıt Ol
                                    </Link>
                                </>
                            ) : (
                                <Link
                                    href="/rooms"
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                                >
                                    Odalar
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center">
                    <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                        <span className="block">Atlas Boost'a</span>
                        <span className="block text-indigo-600">Hoş Geldiniz</span>
                    </h1>
                    <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                        Odalar oluşturun, arkadaşlarınızla sohbet edin ve eğlenceli vakit geçirin.
                    </p>
                    <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                        {!isLoggedIn ? (
                            <>
                                <div className="rounded-md shadow">
                                    <Link
                                        href="/register"
                                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                                    >
                                        Hemen Başla
                                    </Link>
                                </div>
                                <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                                    <Link
                                        href="/login"
                                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                                    >
                                        Giriş Yap
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <div className="rounded-md shadow">
                                <Link
                                    href="/rooms"
                                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                                >
                                    Odalara Git
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 