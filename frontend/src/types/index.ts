export type UserRole = 'admin' | 'technician';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketCategory = 'Network Issue' | 'Hardware Issue' | 'Software Issue' | 'Security Issue' | 'Performance Issue' | 'Other';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    createdAt: string;
    updatedAt: string;
}

export interface Ticket {
    id: string;
    title: string;
    description: string;
    category: TicketCategory;
    priority: TicketPriority;
    status: TicketStatus;
    assignedTo?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    resolvedAt?: string;
}

export interface TicketWithUser extends Ticket {
    assignedUser?: User;
    createdUser: User;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    role: UserRole;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface CreateTicketRequest {
    title: string;
    description: string;
    category?: TicketCategory;
    priority?: TicketPriority;
}

export interface UpdateTicketRequest {
    title?: string;
    description?: string;
    category?: TicketCategory;
    priority?: TicketPriority;
    status?: TicketStatus;
    assignedTo?: string;
}

export interface TriageRequest {
    title: string;
    description: string;
}

export interface TriageResponse {
    category: TicketCategory;
    summary: string;
    priority: TicketPriority;
    suggestedTechnician: string;
    confidence: number;
    reasoning: string;
}

export interface ApiResponse<T> {
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}
