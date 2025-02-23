'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Chat from '../../components/Chat';
import { api } from '../../services/api';
import type { Room as RoomType } from '../../services/api';

export default function RoomDetail() {
    const router = useRouter();
    const params = useParams();
    const roomId = typeof params?.id === 'string' ? params.id : '';
    
    const [room, setRoom] = useState<RoomType | null>(null);
    const [error, setError] = useState('');
    const [isParticipant, setIsParticipant] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const token = api.getToken();
        if (!token) {
            router.push('/login');
            return;
        }
        if (roomId) {
            fetchRoomDetails();
        }
    }, [roomId]);

    const fetchRoomDetails = async () => {
        try {
            const response = await api.getRoom(roomId);
            setRoom(response);
            setIsParticipant(response.is_participant);
        } catch (err) {
            setError('Oda bilgileri alınamadı');
            console.error('Oda bilgileri alınırken hata:', err);
        }
    };

    const handleJoinRoom = async () => {
        try {
            setIsLoading(true);
            setError('');
            await api.joinRoom(parseInt(roomId));
            await fetchRoomDetails();
        } catch (err) {
            setError('Odaya katılırken bir hata oluştu');
            console.error('Odaya katılırken hata:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLeaveRoom = async () => {
        try {
            setIsLoading(true);
            setError('');
            await api.leaveRoom(parseInt(roomId));
            await fetchRoomDetails();
        } catch (err) {
            setError('Odadan ayrılırken bir hata oluştu');
            console.error('Odadan ayrılırken hata:', err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!room) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <Link 
                                href="/rooms" 
                                className="text-indigo-600 hover:text-indigo-700 mb-2 inline-flex items-center"
                            >
                                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Odalara Dön
                            </Link>
                            <h1 className="text-3xl font-bold text-gray-900">{room.name}</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            {!isParticipant ? (
                                <button
                                    onClick={handleJoinRoom}
                                    disabled={isLoading}
                                    className={`bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}
                                >
                                    {isLoading && (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    )}
                                    Odaya Katıl
                                </button>
                            ) : (
                                <button
                                    onClick={handleLeaveRoom}
                                    disabled={isLoading}
                                    className={`bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}
                                >
                                    {isLoading && (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    )}
                                    Odadan Ayrıl
                                </button>
                            )}
                        </div>
                    </div>
                    <p className="text-gray-500 mt-2">Oda Sahibi: {room.owner_username}</p>
                    <p className="text-gray-500">Katılımcı Sayısı: {room.participants_count}</p>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                {isParticipant && (
                    <Chat roomId={parseInt(roomId)} roomName={room.name} />
                )}

                {!isParticipant && (
                    <div className="text-center py-12">
                        <h3 className="text-lg font-medium text-gray-900">
                            Sohbete katılmak için odaya katılmanız gerekmektedir.
                        </h3>
                    </div>
                )}
            </div>
        </div>
    );
} 