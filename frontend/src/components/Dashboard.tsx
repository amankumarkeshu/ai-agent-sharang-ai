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
                return <Clock className="h-4 w-4 text-yellow-500" />;
            case 'in_progress':
                return <AlertCircle className="h-4 w-4 text-blue-500" />;
            case 'resolved':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'closed':
                return <XCircle className="h-4 w-4 text-gray-500" />;
            default:
                return <Clock className="h-4 w-4 text-gray-500" />;
        }
    };

    const getPriorityColor = (priority: TicketPriority) => {
        switch (priority) {
            case 'critical':
                return 'bg-red-100 text-red-800';
            case 'high':
                return 'bg-orange-100 text-orange-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'low':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status: TicketStatus) => {
        switch (status) {
            case 'open':
                return 'bg-yellow-100 text-yellow-800';
            case 'in_progress':
                return 'bg-blue-100 text-blue-800';
            case 'resolved':
                return 'bg-green-100 text-green-800';
            case 'closed':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
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
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                            <p className="text-sm text-gray-600">
                                Welcome back, {user?.name}
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            {user?.role === 'admin' && (
                                <Link
                                    to="/admin"
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                >
                                    <Settings className="h-4 w-4 mr-2" />
                                    Admin
                                </Link>
                            )}
                            <Link
                                to="/profile"
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                <UserCircle className="h-4 w-4 mr-2" />
                                Profile
                            </Link>
                            <button
                                onClick={handleCreateTicket}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                New Ticket
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search tickets..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as TicketStatus | '')}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
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
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        >
                            <option value="">All Priority</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>

                        <button
                            onClick={fetchTickets}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Apply Filters
                        </button>
                    </div>
                </div>

                {/* Tickets List */}
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No tickets found</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                            {filteredTickets.map((ticket) => (
                                <li key={ticket.id} className="hover:bg-gray-50">
                                    <div
                                        className="px-4 py-4 flex items-center justify-between cursor-pointer"
                                        onClick={() => handleTicketClick(ticket)}
                                    >
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                {getStatusIcon(ticket.status)}
                                            </div>
                                            <div className="ml-4">
                                                <div className="flex items-center">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {ticket.title}
                                                    </p>
                                                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                                                        {ticket.priority}
                                                    </span>
                                                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                                        {ticket.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div className="mt-1 flex items-center text-sm text-gray-500">
                                                    <Tag className="h-4 w-4 mr-1" />
                                                    {ticket.category}
                                                </div>
                                                <div className="mt-1 flex items-center text-sm text-gray-500">
                                                    <Calendar className="h-4 w-4 mr-1" />
                                                    {new Date(ticket.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <button className="text-gray-400 hover:text-gray-600">
                                                <MoreVertical className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
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
