import React from 'react';
import Link from 'next/link';

interface RoomProps {
    id: number;
    name: string;
    owner_username: string;
    participants_count: number;
    onJoin?: () => void;
    onLeave?: () => void;
    onDelete?: () => void;
    isOwner: boolean;
    isParticipant: boolean;
}

const Room: React.FC<RoomProps> = ({
    id,
    name,
    owner_username,
    participants_count,
    onJoin,
    onLeave,
    onDelete,
    isOwner,
    isParticipant
}) => {
    return (
        <div className="border rounded-lg p-4 shadow-sm bg-white">
            <div className="flex justify-between items-start">
                <Link href={`/rooms/${id}`} className="flex-1">
                    <div className="hover:text-indigo-600 transition-colors">
                        <h3 className="text-lg font-semibold">{name}</h3>
                        <p className="text-sm text-gray-500">Oda Sahibi: {owner_username}</p>
                        <p className="text-sm text-gray-500">Katılımcılar: {participants_count}</p>
                    </div>
                </Link>
                <div className="ml-4 flex flex-col gap-2">
                    {!isOwner && !isParticipant && onJoin && (
                        <button
                            onClick={onJoin}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                        >
                            Katıl
                        </button>
                    )}
                    {!isOwner && isParticipant && onLeave && (
                        <button
                            onClick={onLeave}
                            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                        >
                            Ayrıl
                        </button>
                    )}
                    {isOwner && (
                        <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">
                            Sizin Odanız
                        </span>
                    )}
                    {onDelete && (
                        <button
                            onClick={onDelete}
                            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                        >
                            Sil
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Room;