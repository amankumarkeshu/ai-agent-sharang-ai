import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    Ticket,
    CreateTicketRequest,
    UpdateTicketRequest,
    TriageRequest,
    TriageResponse,
    User,
    PaginatedResponse
} from '../types';

class ApiService {
    private api: AxiosInstance;

    constructor() {
        this.api = axios.create({
            baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Add request interceptor to include auth token
        this.api.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Add response interceptor to handle auth errors
        this.api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    }

    // Auth endpoints
    async login(credentials: LoginRequest): Promise<AuthResponse> {
        const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', credentials);
        return response.data;
    }

    async register(userData: RegisterRequest): Promise<AuthResponse> {
        const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/register', userData);
        return response.data;
    }

    async getProfile(): Promise<{ user: User }> {
        const response = await this.api.get('/auth/profile');
        return response.data;
    }

    // Ticket endpoints
    async getTickets(params?: {
        status?: string;
        priority?: string;
        assignedTo?: string;
        page?: number;
        limit?: number;
    }): Promise<any> {
        const response = await this.api.get('/tickets', { params });
        return response.data;
    }

    async getTicket(id: string): Promise<Ticket> {
        const response = await this.api.get(`/tickets/${id}`);
        return response.data;
    }

    async createTicket(ticketData: CreateTicketRequest): Promise<Ticket> {
        const response = await this.api.post('/tickets', ticketData);
        return response.data;
    }

    async updateTicket(id: string, ticketData: UpdateTicketRequest): Promise<{ message: string }> {
        const response = await this.api.put(`/tickets/${id}`, ticketData);
        return response.data;
    }

    async deleteTicket(id: string): Promise<{ message: string }> {
        const response = await this.api.delete(`/tickets/${id}`);
        return response.data;
    }

    // AI endpoints
    async triageTicket(triageData: TriageRequest): Promise<TriageResponse> {
        const response = await this.api.post('/ai/triage', triageData);
        return response.data;
    }

    async getTechnicians(): Promise<{ technicians: User[] }> {
        const response = await this.api.get('/ai/technicians');
        return response.data;
    }

    // Admin endpoints
    async getAllUsers(): Promise<{ users: User[]; total: number }> {
        const response = await this.api.get('/admin/users');
        return response.data;
    }

    async createUser(userData: RegisterRequest): Promise<{ message: string; user: User }> {
        const response = await this.api.post('/admin/users', userData);
        return response.data;
    }

    async updateUser(id: string, userData: Partial<User>): Promise<{ message: string; user: User }> {
        const response = await this.api.put(`/admin/users/${id}`, userData);
        return response.data;
    }

    async deleteUser(id: string): Promise<{ message: string }> {
        const response = await this.api.delete(`/admin/users/${id}`);
        return response.data;
    }

    async getSystemStats(): Promise<any> {
        const response = await this.api.get('/admin/stats');
        return response.data;
    }

    // Health check
    async healthCheck(): Promise<{ status: string }> {
        const response = await this.api.get('/health');
        return response.data;
    }

    // Document endpoints
    async getTicketSolutions(ticketId: string): Promise<any> {
        const response = await this.api.get(`/tickets/${ticketId}/solutions`);
        return response.data;
    }

    async indexDocuments(path?: string): Promise<any> {
        const response = await this.api.post('/docs/index', { path });
        return response.data;
    }

    async searchDocuments(query: string, topK?: number): Promise<any> {
        const response = await this.api.post('/docs/search', { query, topK });
        return response.data;
    }

    async uploadDocument(file: File): Promise<any> {
        const formData = new FormData();
        formData.append('document', file);
        const response = await this.api.post('/docs/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }

    async getIndexStats(): Promise<any> {
        const response = await this.api.get('/docs/stats');
        return response.data;
    }
}

export const apiService = new ApiService();
export default apiService;
