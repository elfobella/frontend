'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

interface Message {
    id: number;
    content: string;
    sender_username: string;
    timestamp: string;
}

interface ChatProps {
    roomId: number;
    roomName: string;
}

const Chat: React.FC<ChatProps> = ({ roomId, roomName }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [ws, setWs] = useState<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const currentUsername = api.getUsername();
    const processedMessagesRef = useRef(new Set<string>());

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const processMessage = (msg: Message | { id: number; content: string; sender_username: string; timestamp: number | string }) => {
        const messageKey = `${msg.id}-${msg.sender_username}-${msg.content}`;
        if (processedMessagesRef.current.has(messageKey)) {
            return false;
        }
        processedMessagesRef.current.add(messageKey);
        return true;
    };

    useEffect(() => {
        const token = api.getToken();
        if (!token) return;

        const websocket = new WebSocket(`ws://localhost:8001/ws/chat/${roomId}/?token=${token}`);

        websocket.onopen = () => {
            console.log('WebSocket bağlantısı açıldı');
        };

        websocket.onclose = (event) => {
            console.log('WebSocket bağlantısı kapandı:', event.code, event.reason);
        };

        websocket.onerror = (error) => {
            console.error('WebSocket hatası:', error);
        };

        websocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                if (data.type === 'message_history') {
                    processedMessagesRef.current.clear();
                    const uniqueMessages = data.messages.filter((msg: Message) => processMessage(msg));
                    const sortedMessages = uniqueMessages.sort((a: Message, b: Message) => 
                        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                    );
                    setMessages(sortedMessages);
                }
                else if (data.type === 'chat_message') {
                    const newMessage = {
                        id: data.message_id,
                        content: data.message,
                        sender_username: data.sender,
                        timestamp: new Date(data.timestamp).toISOString()
                    };

                    if (processMessage(newMessage)) {
                        setMessages(prev => {
                            const updatedMessages = [...prev, newMessage];
                            return updatedMessages.sort((a, b) => 
                                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                            );
                        });
                    }
                }
            } catch (error) {
                console.error('Mesaj işlenirken hata:', error);
            }
        };

        setWs(websocket);

        return () => {
            processedMessagesRef.current.clear();
            if (websocket.readyState === WebSocket.OPEN) {
                websocket.close();
            }
        };
    }, [roomId]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!ws || !newMessage.trim()) return;

        ws.send(JSON.stringify({
            type: 'chat_message',
            message: newMessage.trim()
        }));

        setNewMessage('');
    };

    return (
        <div className="flex flex-col h-[600px] bg-white rounded-lg shadow">
            <div className="p-4 border-b">
                <h2 className="text-xl font-semibold">{roomName}</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                    const isOwnMessage = message.sender_username === currentUsername;
                    const messageKey = `${message.id}-${message.sender_username}-${message.content}`;
                    return (
                        <div
                            key={messageKey}
                            className={`flex flex-col ${
                                isOwnMessage ? 'items-end' : 'items-start'
                            }`}
                        >
                            <div
                                className={`max-w-[70%] rounded-lg p-3 ${
                                    isOwnMessage
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-900'
                                }`}
                            >
                                {!isOwnMessage && (
                                    <p className="text-sm font-semibold mb-1">{message.sender_username}</p>
                                )}
                                <p className="break-words">{message.content}</p>
                                <p className="text-xs mt-1 opacity-70">
                                    {new Date(message.timestamp).toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Mesajınızı yazın..."
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <button
                        type="submit"
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                        Gönder
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Chat; 