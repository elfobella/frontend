'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../services/api';

const Navbar = () => {
    const router = useRouter();
    const [username, setUsername] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setUsername(api.getUsername());
        setUserRole(api.getUserRole());
        setIsLoading(false);
    }, []);

    const handleLogout = () => {
        api.logout();
        router.push('/login');
    };

    if (isLoading) {
        return <nav className="bg-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex items-center">
                            <span className="text-2xl font-bold text-indigo-600">Atlas Boost</span>
                        </div>
                    </div>
                </div>
            </div>
        </nav>;
    }

    return (
        <nav className="bg-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link href="/" className="flex items-center">
                            <span className="text-2xl font-bold text-indigo-600">Atlas Boost</span>
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        {username ? (
                            <>
                                <div className="flex items-center space-x-2">
                                    <span className="text-gray-700">{username}</span>
                                    <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                                        {userRole}
                                    </span>
                                </div>
                                <Link
                                    href="/rooms"
                                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Odalar
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                                >
                                    Çıkış Yap
                                </button>
                            </>
                        ) : (
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
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar; 