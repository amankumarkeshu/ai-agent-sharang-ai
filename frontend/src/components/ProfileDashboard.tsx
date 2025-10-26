import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, Zap, Shield, Plus, Eye, Activity, LogOut, User as UserIcon } from 'lucide-react';
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
                return 'bg-red-900/50 text-red-300 border border-red-500/50';
            case 'technician':
                return 'bg-ai-blue-900/50 text-ai-blue-300 border border-ai-blue-500/50';
            default:
                return 'bg-ai-gray-800/50 text-ai-gray-300 border border-ai-gray-600/50';
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin':
                return <Shield className="h-4 w-4 text-red-400" />;
            case 'technician':
                return <Zap className="h-4 w-4 text-ai-blue-400" />;
            default:
                return <UserIcon className="h-4 w-4 text-ai-gray-400" />;
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
            <div className="min-h-screen bg-ai-dark flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ai-blue-500"></div>
                    <p className="text-ai-gray-400">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-ai-dark">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="ai-card p-6 mb-8 ai-glow">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Link
                                to="/"
                                className="ai-button-secondary flex items-center space-x-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span>Back to Dashboard</span>
                            </Link>
                        </div>
                        <button
                            onClick={logout}
                            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
                        >
                            <LogOut className="h-4 w-4" />
                            <span>Logout</span>
                        </button>
                    </div>
                    <div className="flex items-center space-x-6 mt-8">
                        <div className="flex-shrink-0">
                            <div className="h-20 w-20 bg-gradient-to-br from-ai-blue-500 to-ai-cyan-500 rounded-2xl flex items-center justify-center ai-glow">
                                <div className="text-2xl text-white">
                                    {getRoleIcon(profile?.role || 'user')}
                                </div>
                            </div>
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold ai-text-gradient mb-2">
                                {profile?.name || user?.name || 'User Profile'}
                            </h1>
                            <p className="text-ai-gray-300 text-lg mb-3">{profile?.email || user?.email}</p>
                            <div className="flex items-center space-x-2">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(profile?.role || 'user')}`}>
                                    {getRoleIcon(profile?.role || 'user')}
                                    <span className="ml-2 capitalize">{profile?.role || user?.role || 'user'}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-900/50 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm backdrop-blur-sm mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-red-300">Error</h3>
                                <div className="mt-1 text-sm text-red-400">{error}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="ai-card p-6 ai-glow">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-gradient-to-br from-ai-blue-500 to-ai-cyan-500 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-4 flex-1">
                                <dt className="text-sm font-medium text-ai-gray-400 truncate">Total Tickets</dt>
                                <dd className="text-2xl font-bold text-ai-gray-100">{stats.totalTickets}</dd>
                            </div>
                        </div>
                    </div>

                    <div className="ai-card p-6 ai-glow">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-4 flex-1">
                                <dt className="text-sm font-medium text-ai-gray-400 truncate">Open Tickets</dt>
                                <dd className="text-2xl font-bold text-ai-gray-100">{stats.openTickets}</dd>
                            </div>
                        </div>
                    </div>

                    <div className="ai-card p-6 ai-glow">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-gradient-to-br from-ai-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-4 flex-1">
                                <dt className="text-sm font-medium text-ai-gray-400 truncate">Resolved</dt>
                                <dd className="text-2xl font-bold text-ai-gray-100">{stats.resolvedTickets}</dd>
                            </div>
                        </div>
                    </div>

                    <div className="ai-card p-6 ai-glow">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-gradient-to-br from-ai-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-4 flex-1">
                                <dt className="text-sm font-medium text-ai-gray-400 truncate">In Progress</dt>
                                <dd className="text-2xl font-bold text-ai-gray-100">{stats.inProgressTickets}</dd>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Information */}
                <div className="ai-card p-6 mb-8 ai-glow">
                    <h3 className="text-xl font-semibold text-ai-gray-100 mb-6">Profile Information</h3>
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                        <div>
                            <dt className="text-sm font-medium text-ai-gray-400">Full Name</dt>
                            <dd className="mt-2 text-lg text-ai-gray-100">{profile?.name || user?.name || 'N/A'}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-ai-gray-400">Email Address</dt>
                            <dd className="mt-2 text-lg text-ai-gray-100">{profile?.email || user?.email || 'N/A'}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-ai-gray-400">Role</dt>
                            <dd className="mt-2">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(profile?.role || user?.role || 'user')}`}>
                                    {getRoleIcon(profile?.role || user?.role || 'user')}
                                    <span className="ml-2 capitalize">{profile?.role || user?.role || 'user'}</span>
                                </span>
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-ai-gray-400">User ID</dt>
                            <dd className="mt-2 text-lg font-mono text-ai-cyan-400">{profile?.id || user?.id || 'N/A'}</dd>
                        </div>
                    </dl>
                </div>

                {/* Quick Actions */}
                <div className="ai-card p-6 ai-glow">
                    <h3 className="text-xl font-semibold text-ai-gray-100 mb-6">Quick Actions</h3>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        <button
                            onClick={handleCreateTicket}
                            className="ai-card-hover p-6 text-left group"
                        >
                            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-ai-blue-500 to-ai-cyan-500 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                                <Plus className="h-6 w-6 text-white" />
                            </div>
                            <h4 className="text-lg font-medium text-ai-gray-100 mb-2">
                                Create New Ticket
                            </h4>
                            <p className="text-sm text-ai-gray-400">
                                Submit a new support ticket for assistance.
                            </p>
                        </button>

                        <button
                            onClick={handleViewAllTickets}
                            className="ai-card-hover p-6 text-left group"
                        >
                            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-ai-purple-500 to-purple-600 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                                <Eye className="h-6 w-6 text-white" />
                            </div>
                            <h4 className="text-lg font-medium text-ai-gray-100 mb-2">
                                View All Tickets
                            </h4>
                            <p className="text-sm text-ai-gray-400">
                                Manage and track all your support tickets.
                            </p>
                        </button>

                        <button
                            onClick={handleAITriage}
                            className="ai-card-hover p-6 text-left group"
                        >
                            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-ai-emerald-500 to-green-500 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                                <Brain className="h-6 w-6 text-white" />
                            </div>
                            <h4 className="text-lg font-medium text-ai-gray-100 mb-2">
                                AI Triage
                            </h4>
                            <p className="text-sm text-ai-gray-400">
                                Use AI to categorize and prioritize tickets.
                            </p>
                        </button>
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
