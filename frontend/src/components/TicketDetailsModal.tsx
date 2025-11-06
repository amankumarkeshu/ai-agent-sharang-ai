import React, { useState, useEffect } from 'react';
import { Ticket, UpdateTicketRequest, TicketStatus, TicketPriority, TicketCategory, User } from '../types';
import apiService from '../services/api';
import { X, Edit, Save, User as UserIcon, Calendar, Tag, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import TicketSolutionPanel from './TicketSolutionPanel';

interface TicketDetailsModalProps {
    ticket: Ticket;
    onClose: () => void;
    onTicketUpdated: () => void;
}

const TicketDetailsModal: React.FC<TicketDetailsModalProps> = ({ ticket, onClose, onTicketUpdated }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<UpdateTicketRequest>({
        title: ticket.title,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        assignedTo: ticket.assignedTo,
    });
    const [technicians, setTechnicians] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTechnicians();
    }, []);

    const fetchTechnicians = async () => {
        try {
            const response = await apiService.getTechnicians();
            setTechnicians(response.technicians);
        } catch (error) {
            console.error('Failed to fetch technicians:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await apiService.updateTicket(ticket.id, formData);
            setIsEditing(false);
            onTicketUpdated();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update ticket');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

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

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Ticket Details</h3>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            <Edit className="h-4 w-4 mr-1" />
                            {isEditing ? 'Cancel' : 'Edit'}
                        </button>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Title
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900"
                                />
                            ) : (
                                <p className="text-sm text-gray-900">{ticket.title}</p>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            {isEditing ? (
                                <textarea
                                    name="description"
                                    rows={4}
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900"
                                />
                            ) : (
                                <p className="text-sm text-gray-900 whitespace-pre-wrap">{ticket.description}</p>
                            )}
                        </div>

                        {/* Status and Priority */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                {isEditing ? (
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900"
                                    >
                                        <option value="open">Open</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                ) : (
                                    <div className="flex items-center">
                                        {getStatusIcon(ticket.status)}
                                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                            {ticket.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Priority
                                </label>
                                {isEditing ? (
                                    <select
                                        name="priority"
                                        value={formData.priority}
                                        onChange={handleChange}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                ) : (
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                                        {ticket.priority}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Category and Assigned To */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category
                                </label>
                                {isEditing ? (
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900"
                                    >
                                        <option value="Network Issue">Network Issue</option>
                                        <option value="Hardware Issue">Hardware Issue</option>
                                        <option value="Software Issue">Software Issue</option>
                                        <option value="Security Issue">Security Issue</option>
                                        <option value="Performance Issue">Performance Issue</option>
                                        <option value="Other">Other</option>
                                    </select>
                                ) : (
                                    <div className="flex items-center">
                                        <Tag className="h-4 w-4 text-gray-400 mr-1" />
                                        <span className="text-sm text-gray-900">{ticket.category}</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Assigned To
                                </label>
                                {isEditing ? (
                                    <select
                                        name="assignedTo"
                                        value={formData.assignedTo || ''}
                                        onChange={handleChange}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900"
                                    >
                                        <option value="">Unassigned</option>
                                        {technicians.map((tech) => (
                                            <option key={tech.id} value={tech.id}>
                                                {tech.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="flex items-center">
                                        <UserIcon className="h-4 w-4 text-gray-400 mr-1" />
                                        <span className="text-sm text-gray-900">
                                            {ticket.assignedTo ? 'Assigned' : 'Unassigned'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Timestamps */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Created
                                </label>
                                <div className="flex items-center">
                                    <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                                    <span className="text-sm text-gray-900">
                                        {new Date(ticket.createdAt).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Last Updated
                                </label>
                                <div className="flex items-center">
                                    <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                                    <span className="text-sm text-gray-900">
                                        {new Date(ticket.updatedAt).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {ticket.resolvedAt && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Resolved
                                </label>
                                <div className="flex items-center">
                                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                                    <span className="text-sm text-gray-900">
                                        {new Date(ticket.resolvedAt).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        {isEditing && (
                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <div className="flex items-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Saving...
                                        </div>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </form>

                {/* AI Solution Panel */}
                <div className="mt-6">
                    <TicketSolutionPanel ticketId={ticket.id} />
                </div>
            </div>
        </div>
    );
};

export default TicketDetailsModal;
