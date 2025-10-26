import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Ticket, TicketStatus, TicketPriority, TicketCategory } from '../types';
import apiService from '../services/api';
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    Clock,
    CheckCircle,
    AlertCircle,
    XCircle,
    User,
    Calendar,
    Tag,
    UserCircle,
    Settings
} from 'lucide-react';
import { Link } from 'react-router-dom';
import CreateTicketModal from './CreateTicketModal';
import TicketDetailsModal from './TicketDetailsModal';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
    const [priorityFilter, setPriorityFilter] = useState<TicketPriority | ''>('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    useEffect(() => {
        fetchTickets();
    }, [statusFilter, priorityFilter]);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const response = await apiService.getTickets({
                status: statusFilter || undefined,
                priority: priorityFilter || undefined,
            });
            // Handle both MongoDB backend format (response.data) and simplified backend format (response.tickets)
            const ticketsData = response.tickets || response.data || [];
            setTickets(ticketsData);
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTickets = tickets.filter(ticket =>
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusIcon = (status: TicketStatus) => {
        switch (status) {
            case 'open':
                return <Clock className="h-5 w-5 text-yellow-400" />;
            case 'in_progress':
                return <AlertCircle className="h-5 w-5 text-ai-blue-400" />;
            case 'resolved':
                return <CheckCircle className="h-5 w-5 text-ai-emerald-400" />;
            case 'closed':
                return <XCircle className="h-5 w-5 text-ai-gray-400" />;
            default:
                return <Clock className="h-5 w-5 text-ai-gray-400" />;
        }
    };

    const getPriorityColor = (priority: TicketPriority) => {
        switch (priority) {
            case 'critical':
                return 'bg-red-900/50 text-red-300 border border-red-500/50';
            case 'high':
                return 'bg-orange-900/50 text-orange-300 border border-orange-500/50';
            case 'medium':
                return 'bg-yellow-900/50 text-yellow-300 border border-yellow-500/50';
            case 'low':
                return 'bg-emerald-900/50 text-emerald-300 border border-emerald-500/50';
            default:
                return 'bg-ai-gray-800/50 text-ai-gray-300 border border-ai-gray-600/50';
        }
    };

    const getStatusColor = (status: TicketStatus) => {
        switch (status) {
            case 'open':
                return 'bg-yellow-900/50 text-yellow-300 border border-yellow-500/50';
            case 'in_progress':
                return 'bg-ai-blue-900/50 text-ai-blue-300 border border-ai-blue-500/50';
            case 'resolved':
                return 'bg-emerald-900/50 text-emerald-300 border border-emerald-500/50';
            case 'closed':
                return 'bg-ai-gray-800/50 text-ai-gray-300 border border-ai-gray-600/50';
            default:
                return 'bg-ai-gray-800/50 text-ai-gray-300 border border-ai-gray-600/50';
        }
    };

    const handleCreateTicket = () => {
        setShowCreateModal(true);
    };

    const handleTicketCreated = () => {
        setShowCreateModal(false);
        fetchTickets();
    };

    const handleTicketClick = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setShowDetailsModal(true);
    };

    const handleTicketUpdated = () => {
        setShowDetailsModal(false);
        fetchTickets();
    };

    return (
        <div className="min-h-screen bg-ai-dark">
            {/* Header */}
            <div className="ai-card border-b border-ai-gray-800 mb-0 rounded-none">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-3xl font-bold ai-text-gradient">Dashboard</h1>
                            <p className="text-ai-gray-400 mt-1">
                                Welcome back, <span className="text-ai-cyan-400 font-medium">{user?.name}</span>
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            {user?.role === 'admin' && (
                                <Link
                                    to="/admin"
                                    className="ai-button-secondary flex items-center space-x-2"
                                >
                                    <Settings className="h-4 w-4" />
                                    <span>Admin</span>
                                </Link>
                            )}
                            <Link
                                to="/profile"
                                className="ai-button-secondary flex items-center space-x-2"
                            >
                                <UserCircle className="h-4 w-4" />
                                <span>Profile</span>
                            </Link>
                            <button
                                onClick={handleCreateTicket}
                                className="ai-button-primary flex items-center space-x-2"
                            >
                                <Plus className="h-4 w-4" />
                                <span>New Ticket</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters */}
                <div className="ai-card p-6 mb-6 ai-glow">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-ai-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search tickets..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="ai-input w-full pl-10 pr-3"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as TicketStatus | '')}
                            className="ai-input"
                        >
                            <option value="">All Status</option>
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>

                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | '')}
                            className="ai-input"
                        >
                            <option value="">All Priority</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>

                        <button
                            onClick={fetchTickets}
                            className="ai-button-secondary flex items-center justify-center space-x-2"
                        >
                            <Filter className="h-4 w-4" />
                            <span>Apply Filters</span>
                        </button>
                    </div>
                </div>

                {/* Tickets List */}
                <div className="ai-card ai-glow overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col justify-center items-center py-16">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ai-blue-500 mb-4"></div>
                            <p className="text-ai-gray-400">Loading tickets...</p>
                        </div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-ai-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="h-8 w-8 text-ai-gray-500" />
                            </div>
                            <p className="text-ai-gray-400 text-lg">No tickets found</p>
                            <p className="text-ai-gray-500 text-sm mt-2">Try adjusting your search criteria</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-ai-gray-800">
                            {filteredTickets.map((ticket) => (
                                <div key={ticket.id} className="ai-card-hover border-0 rounded-none">
                                    <div
                                        className="px-6 py-5 flex items-center justify-between cursor-pointer"
                                        onClick={() => handleTicketClick(ticket)}
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className="flex-shrink-0">
                                                {getStatusIcon(ticket.status)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <p className="text-lg font-medium text-ai-gray-100 truncate">
                                                        {ticket.title}
                                                    </p>
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                                                        {ticket.priority}
                                                    </span>
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                                        {ticket.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-4 text-sm text-ai-gray-400">
                                                    <div className="flex items-center space-x-1">
                                                        <Tag className="h-4 w-4" />
                                                        <span>{ticket.category}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <Calendar className="h-4 w-4" />
                                                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <button className="text-ai-gray-400 hover:text-ai-gray-200 p-2 rounded-lg hover:bg-ai-gray-800 transition-colors duration-200">
                                                <MoreVertical className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showCreateModal && (
                <CreateTicketModal
                    onClose={() => setShowCreateModal(false)}
                    onTicketCreated={handleTicketCreated}
                />
            )}

            {showDetailsModal && selectedTicket && (
                <TicketDetailsModal
                    ticket={selectedTicket}
                    onClose={() => setShowDetailsModal(false)}
                    onTicketUpdated={handleTicketUpdated}
                />
            )}
        </div>
    );
};

export default Dashboard;
