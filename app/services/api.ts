const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface LoginData {
    username: string;
    password: string;
}

export interface RegisterData extends LoginData {
    email?: string;
    role?: string;
}

export interface UserProfile {
    id: number;
    username: string;
    email: string;
    role: string;
}

export interface Room {
    id: number;
    name: string;
    owner_username: string;
    participants_count: number;
    is_participant: boolean;
}

class ApiService {
    private token: string | null = null;
    private username: string | null = null;
    private userRole: string | null = null;

    setToken(token: string) {
        this.token = token;
        if (typeof window !== 'undefined') {
            localStorage.setItem('token', token);
        }
    }

    getToken(): string | null {
        if (!this.token && typeof window !== 'undefined') {
            this.token = localStorage.getItem('token');
        }
        return this.token;
    }

    setUsername(username: string) {
        this.username = username;
        if (typeof window !== 'undefined') {
            localStorage.setItem('username', username);
        }
    }

    getUsername(): string | null {
        if (!this.username && typeof window !== 'undefined') {
            this.username = localStorage.getItem('username');
        }
        return this.username;
    }

    setUserRole(role: string) {
        this.userRole = role;
        if (typeof window !== 'undefined') {
            localStorage.setItem('userRole', role);
        }
    }

    getUserRole(): string | null {
        if (!this.userRole && typeof window !== 'undefined') {
            this.userRole = localStorage.getItem('userRole');
        }
        return this.userRole;
    }

    clearToken() {
        this.token = null;
        this.username = null;
        this.userRole = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('userRole');
        }
    }

    async request(endpoint: string, options: RequestInit = {}) {
        const token = this.getToken();
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Token ${token}` } : {}),
            ...options.headers,
        };

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('API Error Response:', data); // Debug için
            const error = new Error('API request failed') as any;
            error.response = response;
            error.data = data;
            throw error;
        }

        return data;
    }

    async login(data: LoginData) {
        const response = await this.request('/auth/login/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        this.setToken(response.token);
        this.setUsername(response.user.username);
        this.setUserRole(response.profile.role);
        return response;
    }

    async register(data: RegisterData) {
        try {
            console.log('Sending register request with data:', data); // Debug için
            const response = await this.request('/auth/register/', {
                method: 'POST',
                body: JSON.stringify({
                    username: data.username,
                    password: data.password,
                    email: data.email || '',
                    role: data.role
                }),
            });
            this.setToken(response.token);
            this.setUsername(response.user.username);
            this.setUserRole(response.profile.role);
            return response;
        } catch (error: any) {
            console.error('Register request error:', error.data || error); // Debug için
            throw error;
        }
    }

    async logout() {
        this.clearToken();
    }

    async getProfile() {
        return this.request('/auth/me/');
    }

    async createRoom(name: string) {
        return this.request('/rooms/', {
            method: 'POST',
            body: JSON.stringify({ name }),
        });
    }

    async getRooms() {
        return this.request('/rooms/');
    }

    async getRoom(id: number | string) {
        return this.request(`/rooms/${id}/`);
    }

    async joinRoom(roomId: number) {
        return this.request(`/rooms/${roomId}/join/`, {
            method: 'POST',
        });
    }

    async leaveRoom(roomId: number) {
        return this.request(`/rooms/${roomId}/leave/`, {
            method: 'POST',
        });
    }

    async deleteRoom(roomId: number) {
        return this.request(`/rooms/${roomId}/`, {
            method: 'DELETE',
        });
    }
}

export const api = new ApiService(); 