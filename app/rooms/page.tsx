'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Room from '../components/Room';
import Navbar from '../components/Navbar';
import { api } from '../services/api';
import type { Room as RoomType } from '../services/api';

export default function RoomsPage() {
    const router = useRouter();
    const [rooms, setRooms] = useState<RoomType[]>([]);
    const [newRoomName, setNewRoomName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [currentUsername, setCurrentUsername] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        const token = api.getToken();
        if (!token) {
            router.push('/login');
            return;
        }
        setCurrentUsername(api.getUsername());
        setUserRole(api.getUserRole());
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const response = await api.getRooms();
            setRooms(response);
        } catch (err) {
            setError('Failed to fetch rooms');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.createRoom(newRoomName);
            setNewRoomName('');
            fetchRooms();
        } catch (err) {
            setError('Failed to create room');
        }
    };

    const handleJoinRoom = async (roomId: number) => {
        try {
            await api.joinRoom(roomId);
            fetchRooms();
        } catch (err) {
            setError('Failed to join room');
        }
    };

    const handleLeaveRoom = async (roomId: number) => {
        try {
            await api.leaveRoom(roomId);
            fetchRooms();
        } catch (err) {
            setError('Failed to leave room');
        }
    };

    const handleDeleteRoom = async (roomId: number) => {
        if (!confirm('Bu odayı silmek istediğinizden emin misiniz?')) {
            return;
        }
        try {
            await api.deleteRoom(roomId);
            fetchRooms();
        } catch (err) {
            setError('Failed to delete room');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <form onSubmit={handleCreateRoom} className="mb-8">
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                            placeholder="Oda adı girin"
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                        />
                        <button
                            type="submit"
                            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                        >
                            Oda Oluştur
                        </button>
                    </div>
                </form>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {rooms.map((room) => (
                        <Room
                            key={room.id}
                            {...room}
                            isOwner={room.owner_username === currentUsername}
                            isParticipant={room.is_participant}
                            onJoin={() => handleJoinRoom(room.id)}
                            onLeave={() => handleLeaveRoom(room.id)}
                            onDelete={userRole === 'ADMIN' ? () => handleDeleteRoom(room.id) : undefined}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
} 