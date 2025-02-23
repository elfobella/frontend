'use client';

import { useState, useEffect, useRef } from 'react';
import { timeAgo } from '../utils/timeAgo';

interface Message {
    message: string;
    username: string;
    created_at: string;
}

interface TypingStatus {
    username: string;
    isTyping: boolean;
}

export default function Chat() {
    const [username, setUsername] = useState('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [ws, setWs] = useState<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const typingTimeoutRef = useRef<NodeJS.Timeout>();
    const messageTimestampsRef = useRef<{ [key: number]: string }>({});
    const updateTimestampIntervalRef = useRef<NodeJS.Timeout>();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        // Update timestamps every minute
        updateTimestampIntervalRef.current = setInterval(() => {
            const timestamps = { ...messageTimestampsRef.current };
            let hasChanges = false;
            
            messages.forEach((msg, index) => {
                const newTimestamp = timeAgo(msg.created_at);
                if (timestamps[index] !== newTimestamp) {
                    timestamps[index] = newTimestamp;
                    hasChanges = true;
                }
            });

            if (hasChanges) {
                messageTimestampsRef.current = timestamps;
                // Force re-render
                setMessages(prev => [...prev]);
            }
        }, 60000); // Update every minute

        return () => {
            if (updateTimestampIntervalRef.current) {
                clearInterval(updateTimestampIntervalRef.current);
            }
        };
    }, [messages]);

    const connectWebSocket = () => {
        const websocket = new WebSocket('ws://localhost:8001/ws/chat/');
        
        websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'typing') {
                setTypingUsers(prev => {
                    const newSet = new Set(prev);
                    if (data.is_typing) {
                        newSet.add(data.username);
                    } else {
                        newSet.delete(data.username);
                    }
                    return newSet;
                });
            } else {
                const newMessage = {
                    ...data,
                    created_at: new Date().toISOString()
                };
                setMessages(prev => [...prev, newMessage]);
                
                // Clear typing status for the user who sent the message
                setTypingUsers(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(data.username);
                    return newSet;
                });
            }
        };

        websocket.onclose = () => {
            console.log('WebSocket disconnected');
            setTimeout(connectWebSocket, 3000);
        };

        setWs(websocket);
    };

    const sendTypingStatus = (isTyping: boolean) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            const typingData = {
                type: 'typing',
                username: username,
                is_typing: isTyping
            };
            ws.send(JSON.stringify(typingData));
        }
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim()) {
            setIsLoggedIn(true);
            connectWebSocket();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() && ws && ws.readyState === WebSocket.OPEN) {
            const messageData = {
                type: 'message',
                message: message.trim(),
                username: username
            };
            ws.send(JSON.stringify(messageData));
            setMessage('');
            sendTypingStatus(false);
        }
    };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(e.target.value);
        
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        sendTypingStatus(true);

        typingTimeoutRef.current = setTimeout(() => {
            sendTypingStatus(false);
        }, 1000);
    };

    const getTypingText = () => {
        const typingUsersArray = Array.from(typingUsers).filter(user => user !== username);
        if (typingUsersArray.length === 0) return null;
        if (typingUsersArray.length === 1) return `${typingUsersArray[0]} yazıyor...`;
        if (typingUsersArray.length === 2) return `${typingUsersArray[0]} ve ${typingUsersArray[1]} yazıyor...`;
        return 'Birden fazla kişi yazıyor...';
    };

    if (!isLoggedIn) {
        return (
            <div className="login-container">
                <div className="login-card">
                    <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-indigo-500 to-pink-500 text-transparent bg-clip-text">
                        Atlas Chat'e Hoş Geldiniz
                    </h2>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                Kullanıcı Adınız
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Kullanıcı adınızı girin..."
                                className="input-field"
                                required
                            />
                        </div>
                        <button type="submit" className="btn-primary w-full">
                            Sohbete Katıl
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-container">
            <div className="max-w-4xl mx-auto p-4">
                <div className="glass-card overflow-hidden">
                    <div className="chat-header">
                        <h2 className="text-2xl font-bold text-center">Atlas Chat</h2>
                        <p className="text-indigo-100 text-center text-sm mt-1">
                            {username} olarak bağlandınız
                        </p>
                    </div>
                    
                    <div className="h-[600px] overflow-y-auto p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 scrollbar-custom">
                        <div className="space-y-4">
                            {messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`flex ${msg.username === username ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[70%] ${
                                            msg.username === username
                                                ? 'message-bubble message-bubble-sent'
                                                : 'message-bubble message-bubble-received'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-sm font-semibold ${
                                                msg.username === username ? 'text-indigo-100' : 'text-gray-700'
                                            }`}>
                                                {msg.username}
                                            </span>
                                            <span className={`message-time ${
                                                msg.username === username ? 'text-indigo-200' : 'text-gray-400'
                                            }`}>
                                                {timeAgo(msg.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-sm break-words">{msg.message}</p>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    <div className="p-4 bg-white/50 backdrop-blur-sm border-t border-gray-100">
                        {getTypingText() && (
                            <div className="typing-indicator mb-2">
                                {getTypingText()}
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={handleTyping}
                                    placeholder="Mesajınızı yazın..."
                                    className="input-field"
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={!message.trim()}
                            >
                                Gönder
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
} 