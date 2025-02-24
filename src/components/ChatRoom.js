import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/ChatRoom.css';

const ChatRoom = () => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [error, setError] = useState('');
    const [connected, setConnected] = useState(false);
    const { roomId } = useParams();
    const wsRef = useRef(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        // Fetch existing messages
        const fetchMessages = async () => {
            try {
                const response = await axios.get(`/api/rooms/${roomId}/messages/`, {
                    headers: {
                        'Authorization': `Token ${localStorage.getItem('token')}`
                    }
                });
                setMessages(response.data);
            } catch (err) {
                setError('Failed to load messages');
                console.error('Error fetching messages:', err);
            }
        };

        fetchMessages();
    }, [roomId]);

    useEffect(() => {
        // Connect to WebSocket
        const token = localStorage.getItem('token');
        const ws = new WebSocket(`ws://${window.location.host}/ws/chat/${roomId}/`);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('WebSocket Connected');
            setConnected(true);
            setError('');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setMessages(prev => [...prev, {
                content: data.message,
                sender_username: data.username,
                message_type: data.message_type,
                created_at: data.timestamp
            }]);
            scrollToBottom();
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setError('Connection error');
            setConnected(false);
        };

        ws.onclose = () => {
            console.log('WebSocket Disconnected');
            setConnected(false);
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [roomId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                message: newMessage
            }));
            setNewMessage('');
        } else {
            setError('Connection lost. Please refresh the page.');
        }
    };

    const renderMessage = (msg, index) => {
        const messageClass = `message ${msg.message_type}`;
        const timestamp = new Date(msg.created_at || msg.timestamp).toLocaleTimeString();

        if (msg.message_type === 'system' || msg.message_type === 'join' || msg.message_type === 'leave') {
            return (
                <div key={index} className={messageClass}>
                    <span className="system-message">{msg.content}</span>
                    <span className="timestamp">{timestamp}</span>
                </div>
            );
        }

        return (
            <div key={index} className={messageClass}>
                <strong>{msg.sender_username}</strong>
                <span className="timestamp">{timestamp}</span>
                <p>{msg.content}</p>
            </div>
        );
    };

    return (
        <div className="chat-container">
            <div className="chat-messages">
                {messages.map((msg, index) => renderMessage(msg, index))}
                <div ref={messagesEndRef} />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={sendMessage} className="message-form">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    disabled={!connected}
                />
                <button type="submit" disabled={!connected}>
                    Send
                </button>
            </form>
            
            {!connected && (
                <div className="connection-status">
                    Disconnected. Please refresh the page.
                </div>
            )}
        </div>
    );
};

export default ChatRoom; 