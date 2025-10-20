import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CreateTicketModal from './CreateTicketModal';

interface ProfileStats {
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    inProgressTickets: number;
}

const ProfileDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<User | null>(null);
    const [stats, setStats] = useState<ProfileStats>({
        totalTickets: 0,
        openTickets: 0,
        resolvedTickets: 0,
        inProgressTickets: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);

    useEffect(() => {
        fetchProfile();
        fetchStats();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await apiService.getProfile();
            setProfile(response.user);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch profile');
        }
    };

    const fetchStats = async () => {
        try {
            const response = await apiService.getTickets();
            const tickets = response.tickets || [];

            const stats = {
                totalTickets: tickets.length,
                openTickets: tickets.filter((t: any) => t.status === 'open').length,
                resolvedTickets: tickets.filter((t: any) => t.status === 'resolved').length,
                inProgressTickets: tickets.filter((t: any) => t.status === 'in_progress').length,
            };

            setStats(stats);
        } catch (err: any) {
            console.error('Failed to fetch stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin':
                return 'bg-red-100 text-red-800';
            case 'technician':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin':
                return '👑';
            case 'technician':
                return '🔧';
            default:
                return '👤';
        }
    };

    const handleCreateTicket = () => {
        setShowCreateTicketModal(true);
    };

    const handleTicketCreated = () => {
        setShowCreateTicketModal(false);
        fetchStats(); // Refresh stats after creating ticket
    };

    const handleViewAllTickets = () => {
        navigate('/');
    };

    const handleAITriage = () => {
        // Navigate to dashboard and trigger create ticket modal with AI triage
        navigate('/', { state: { openCreateTicket: true } });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="bg-white shadow rounded-lg p-6 mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Link
                                to="/"
                                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Dashboard
                            </Link>
                        </div>
                        <button
                            onClick={logout}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                    <div className="flex items-center space-x-4 mt-6">
                        <div className="flex-shrink-0">
                            <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
                                <span className="text-2xl">
                                    {getRoleIcon(profile?.role || 'user')}
                                </span>
                            </div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {profile?.name || user?.name || 'User Profile'}
                            </h1>
                            <p className="text-gray-600">{profile?.email || user?.email}</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(profile?.role || 'user')}`}>
                                {getRoleIcon(profile?.role || 'user')} {profile?.role || user?.role || 'user'}
                            </span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Error</h3>
                                <div className="mt-2 text-sm text-red-700">{error}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Total Tickets</dt>
                                        <dd className="text-lg font-medium text-gray-900">{stats.totalTickets}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Open Tickets</dt>
                                        <dd className="text-lg font-medium text-gray-900">{stats.openTickets}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Resolved</dt>
                                        <dd className="text-lg font-medium text-gray-900">{stats.resolvedTickets}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
                                        <dd className="text-lg font-medium text-gray-900">{stats.inProgressTickets}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Information */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Profile Information</h3>
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                                <dd className="mt-1 text-sm text-gray-900">{profile?.name || user?.name || 'N/A'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Email Address</dt>
                                <dd className="mt-1 text-sm text-gray-900">{profile?.email || user?.email || 'N/A'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Role</dt>
                                <dd className="mt-1">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(profile?.role || user?.role || 'user')}`}>
                                        {getRoleIcon(profile?.role || user?.role || 'user')} {profile?.role || user?.role || 'user'}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">User ID</dt>
                                <dd className="mt-1 text-sm text-gray-900 font-mono">{profile?.id || user?.id || 'N/A'}</dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-8 bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <button
                                onClick={handleCreateTicket}
                                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-300 hover:border-gray-400 hover:shadow-md transition-all"
                            >
                                <div>
                                    <span className="rounded-lg inline-flex p-3 bg-primary-50 text-primary-700 ring-4 ring-white">
                                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </span>
                                </div>
                                <div className="mt-8">
                                    <h3 className="text-lg font-medium">
                                        Create New Ticket
                                    </h3>
                                    <p className="mt-2 text-sm text-gray-500">
                                        Submit a new support ticket for assistance.
                                    </p>
                                </div>
                            </button>

                            <button
                                onClick={handleViewAllTickets}
                                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-300 hover:border-gray-400 hover:shadow-md transition-all"
                            >
                                <div>
                                    <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </span>
                                </div>
                                <div className="mt-8">
                                    <h3 className="text-lg font-medium">
                                        View All Tickets
                                    </h3>
                                    <p className="mt-2 text-sm text-gray-500">
                                        Manage and track all your support tickets.
                                    </p>
                                </div>
                            </button>

                            <button
                                onClick={handleAITriage}
                                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-300 hover:border-gray-400 hover:shadow-md transition-all"
                            >
                                <div>
                                    <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                    </span>
                                </div>
                                <div className="mt-8">
                                    <h3 className="text-lg font-medium">
                                        AI Triage
                                    </h3>
                                    <p className="mt-2 text-sm text-gray-500">
                                        Use AI to categorize and prioritize tickets.
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Ticket Modal */}
            {showCreateTicketModal && (
                <CreateTicketModal
                    onClose={() => setShowCreateTicketModal(false)}
                    onTicketCreated={handleTicketCreated}
                />
            )}
        </div>
    );
};

export default ProfileDashboard;
