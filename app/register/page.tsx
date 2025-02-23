'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthForm from '../components/AuthForm';
import { api } from '../services/api';

export default function RegisterPage() {
    const router = useRouter();
    const [error, setError] = useState('');

    const handleRegister = async (data: { username: string; password: string; email?: string; role?: string }) => {
        try {
            setError('');
            console.log('Register data:', data); // Debug için
            await api.register({
                username: data.username,
                password: data.password,
                email: data.email || '',
                role: data.role || 'CUSTOMER'
            });
            router.push('/rooms');
        } catch (err: any) {
            console.error('Register error:', err); // Debug için
            if (err.data) {
                // API'den gelen hata mesajlarını işle
                const errorMessages = Object.entries(err.data)
                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                    .join('\n');
                setError(errorMessages);
            } else {
                setError('Kayıt işlemi başarısız oldu. Lütfen tekrar deneyin.');
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Yeni Hesap Oluştur
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Zaten hesabınız var mı?{' '}
                        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                            Giriş yapın
                        </Link>
                    </p>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative whitespace-pre-line" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <AuthForm mode="register" onSubmit={handleRegister} />
            </div>
        </div>
    );
} 