'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

interface Message {
    id: number | string;
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
    const [error, setError] = useState<string>('');
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [participants, setParticipants] = useState<string[]>([]);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
    const typingTimeoutRef = useRef<NodeJS.Timeout>();
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
            console.log('Duplicate message detected:', messageKey);
            return false;
        }
        processedMessagesRef.current.add(messageKey);
        return true;
    };

    const handleTyping = (isTyping: boolean) => {
        if (!ws || !currentUsername) return;

        try {
            ws.send(JSON.stringify({
                type: 'typing',
                is_typing: isTyping,
                username: currentUsername
            }));
        } catch (error) {
            console.error('Yazıyor durumu gönderilirken hata:', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewMessage(value);
        
        // Yazıyor durumunu gönder
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        
        // Sadece input boş değilse yazıyor durumunu gönder
        if (value.trim()) {
            handleTyping(true);
            
            // 2 saniye sonra yazıyor durumunu kaldır
            typingTimeoutRef.current = setTimeout(() => {
                handleTyping(false);
            }, 2000);
        } else {
            handleTyping(false);
        }
    };

    const connectWebSocket = () => {
        const token = api.getToken();
        if (!token) {
            console.error('Token bulunamadı');
            setError('Oturum hatası: Token bulunamadı');
            return null;
        }

        console.log('WebSocket bağlantısı başlatılıyor...', roomId);
        const websocket = new WebSocket(`ws://localhost:8001/ws/chat/${roomId}/?token=${token}`);

        websocket.onopen = () => {
            console.log('WebSocket bağlantısı başarıyla açıldı');
            setError('');
            setIsReconnecting(false);
            reconnectAttempts.current = 0;
        };

        websocket.onclose = (event) => {
            console.log('WebSocket bağlantısı kapandı:', event.code, event.reason);
            
            let errorMessage = 'Bağlantı kapandı.';
            switch (event.code) {
                case 4001:
                    errorMessage = 'Oturum hatası: Token bulunamadı';
                    break;
                case 4002:
                    errorMessage = 'Oturum hatası: Geçersiz token';
                    break;
                case 4003:
                    errorMessage = 'Oda bulunamadı';
                    break;
                case 4004:
                    errorMessage = 'Bu odaya erişim yetkiniz yok';
                    break;
                case 4005:
                    errorMessage = 'Mesaj gönderme yetkiniz yok';
                    break;
                case 1011:
                    errorMessage = 'Sunucu hatası oluştu';
                    break;
            }
            setError(errorMessage);
            
            if (event.code === 1011 && !isReconnecting && reconnectAttempts.current < maxReconnectAttempts) {
                setIsReconnecting(true);
                reconnectAttempts.current += 1;
                const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
                
                console.log(`Yeniden bağlanmayı deniyor... Deneme: ${reconnectAttempts.current}`);
                reconnectTimeoutRef.current = setTimeout(() => {
                    const newWs = connectWebSocket();
                    if (newWs) setWs(newWs);
                }, timeout);
            } else if (reconnectAttempts.current >= maxReconnectAttempts) {
                setError('Bağlantı kurulamadı. Lütfen sayfayı yenileyin.');
            }
        };

        websocket.onerror = (error) => {
            console.error('WebSocket hatası:', error);
            setError('Bağlantı hatası oluştu. Yeniden bağlanmayı deneyeceğiz...');
        };

        websocket.onmessage = (event) => {
            try {
                console.log('WebSocket mesajı alındı:', event.data);
                const data = JSON.parse(event.data);
                
                if (data.error) {
                    console.error('Sunucu hatası:', data.error);
                    setError(data.error);
                    return;
                }
                
                if (data.type === 'message_history') {
                    console.log('Mesaj geçmişi alındı:', data.messages);
                    processedMessagesRef.current.clear();
                    const uniqueMessages = data.messages.filter((msg: Message) => processMessage(msg));
                    const sortedMessages = uniqueMessages.sort((a: Message, b: Message) => 
                        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                    );
                    setMessages(sortedMessages);
                }
                else if (data.type === 'chat_message') {
                    console.log('Yeni mesaj alındı:', data);
                    const newMessage = {
                        id: data.message_id,
                        content: data.message,
                        sender_username: data.sender,
                        timestamp: new Date(data.timestamp).toISOString()
                    };

                    if (processMessage(newMessage)) {
                        setMessages(prev => [...prev, newMessage]);
                        scrollToBottom();
                    }
                }
                else if (data.type === 'room_participants') {
                    console.log('Katılımcı listesi güncellendi:', data);
                    setParticipants(data.participants);
                    
                    // Katılma/ayrılma mesajını göster
                    if (data.username !== currentUsername) {
                        const action = data.action === 'joined' ? 'katıldı' : 'ayrıldı';
                        const systemMessageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                        setMessages(prev => [...prev, {
                            id: systemMessageId,
                            content: `${data.username} odaya ${action}`,
                            sender_username: 'Sistem',
                            timestamp: new Date().toISOString()
                        }]);
                    }
                }
                else if (data.type === 'user_typing') {
                    if (data.is_typing) {
                        setTypingUsers(prev => [...new Set([...prev, data.username])]);
                    } else {
                        setTypingUsers(prev => prev.filter(username => username !== data.username));
                    }
                }
            } catch (error) {
                console.error('Mesaj işlenirken hata:', error);
                setError('Mesaj işlenirken bir hata oluştu');
            }
        };

        return websocket;
    };

    useEffect(() => {
        const websocket = connectWebSocket();
        if (websocket) setWs(websocket);

        return () => {
            console.log('WebSocket bağlantısı temizleniyor');
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            processedMessagesRef.current.clear();
            if (ws?.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [roomId]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!ws || !newMessage.trim()) return;

        console.log('Mesaj gönderiliyor:', newMessage);
        try {
            ws.send(JSON.stringify({
                type: 'chat_message',
                message: newMessage.trim()
            }));
            console.log('Mesaj başarıyla gönderildi');
            setNewMessage('');
            handleTyping(false);
        } catch (error) {
            console.error('Mesaj gönderilirken hata:', error);
            setError('Mesaj gönderilemedi');
        }
    };

    return (
        <div className="flex flex-col h-[600px] bg-white rounded-lg shadow">
            <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">{roomName}</h2>
                    <div className="text-sm text-gray-500">
                        {participants.length} kişi
                    </div>
                </div>
                {error && (
                    <div className="text-red-500 text-sm mt-2">{error}</div>
                )}
                {isReconnecting && (
                    <div className="text-yellow-500 text-sm mt-2">
                        Yeniden bağlanmaya çalışılıyor... (Deneme: {reconnectAttempts.current}/{maxReconnectAttempts})
                    </div>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                    const isOwnMessage = message.sender_username === currentUsername;
                    const isSystemMessage = message.sender_username === 'Sistem';
                    const messageKey = typeof message.id === 'number' 
                        ? `msg-${message.id}` 
                        : `system-${message.id}`;
                    
                    if (isSystemMessage) {
                        return (
                            <div key={messageKey} className="flex justify-center">
                                <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm">
                                    {message.content}
                                </div>
                            </div>
                        );
                    }
                    
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

            {typingUsers.length > 0 && (
                <div className="px-4 py-2 text-sm text-gray-500 italic">
                    {typingUsers.join(', ')} yazıyor...
                </div>
            )}

            <form onSubmit={handleSendMessage} className="p-4 border-t">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={handleInputChange}
                        placeholder="Mesajınızı yazın..."
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <button
                        type="submit"
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                        disabled={!ws || ws.readyState !== WebSocket.OPEN}
                    >
                        Gönder
                    </button>
                </div>
            </form>

            <div className="p-4 border-t bg-gray-50">
                <h3 className="text-sm font-semibold mb-2">Odadaki Kişiler</h3>
                <div className="flex flex-wrap gap-2">
                    {participants.map(username => (
                        <span
                            key={username}
                            className={`px-2 py-1 rounded-full text-sm ${
                                username === currentUsername
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : 'bg-gray-100 text-gray-800'
                            }`}
                        >
                            {username}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Chat; 