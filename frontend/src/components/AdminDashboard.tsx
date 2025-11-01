import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { User, Ticket } from '../types';
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal';
import { Link } from 'react-router-dom';
import {
    Users,
    Ticket as TicketIcon,
    Shield,
    Activity,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertCircle,
    XCircle,
    Settings,
    UserPlus,
    Search,
    Edit,
    Trash2,
    Home,
    Brain,
    Zap,
    Database
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalTickets: 0,
        openTickets: 0,
        resolvedTickets: 0,
        criticalTickets: 0,
        technicians: 0
    });
    const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [showCreateUserModal, setShowCreateUserModal] = useState(false);
    const [showEditUserModal, setShowEditUserModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchDashboardData();
        }
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch system stats
            const systemStats = await apiService.getSystemStats();

            // Fetch tickets
            const ticketsResponse = await apiService.getTickets();
            const tickets = ticketsResponse.tickets || ticketsResponse.data || [];

            // Fetch all users
            const usersResponse = await apiService.getAllUsers();
            const usersList = usersResponse.users || [];

            setStats({
                totalUsers: systemStats.users.total,
                totalTickets: systemStats.tickets.total,
                openTickets: systemStats.tickets.open,
                resolvedTickets: systemStats.tickets.resolved,
                criticalTickets: systemStats.tickets.critical,
                technicians: systemStats.users.technicians
            });

            setRecentTickets(tickets.slice(0, 5));
            setAllUsers(usersList);

        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = () => {
        setShowCreateUserModal(true);
    };

    const handleUserCreated = () => {
        setShowCreateUserModal(false);
        fetchDashboardData(); // Refresh data
    };

    const handleEditUser = (userData: User) => {
        setSelectedUser(userData);
        setShowEditUserModal(true);
    };

    const handleUserUpdated = () => {
        setShowEditUserModal(false);
        setSelectedUser(null);
        fetchDashboardData(); // Refresh data
    };

    const handleDeleteUser = async (userId: string) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await apiService.deleteUser(userId);
                fetchDashboardData(); // Refresh data
            } catch (error) {
                console.error('Failed to delete user:', error);
                alert('Failed to delete user. Please try again.');
            }
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'text-red-300 bg-red-900/50 border border-red-500/50';
            case 'high': return 'text-orange-300 bg-orange-900/50 border border-orange-500/50';
            case 'medium': return 'text-yellow-300 bg-yellow-900/50 border border-yellow-500/50';
            case 'low': return 'text-emerald-300 bg-emerald-900/50 border border-emerald-500/50';
            default: return 'text-ai-gray-300 bg-ai-gray-800/50 border border-ai-gray-600/50';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'text-ai-blue-300 bg-ai-blue-900/50 border border-ai-blue-500/50';
            case 'in_progress': return 'text-yellow-300 bg-yellow-900/50 border border-yellow-500/50';
            case 'resolved': return 'text-emerald-300 bg-emerald-900/50 border border-emerald-500/50';
            case 'closed': return 'text-ai-gray-300 bg-ai-gray-800/50 border border-ai-gray-600/50';
            default: return 'text-ai-gray-300 bg-ai-gray-800/50 border border-ai-gray-600/50';
        }
    };

    if (user?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-ai-dark flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 ai-glow">
                        <Shield className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-semibold text-ai-gray-100 mb-3">Access Denied</h2>
                    <p className="text-ai-gray-400">You need admin privileges to access this page.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-ai-dark flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ai-blue-500"></div>
                    <p className="text-ai-gray-400">Loading admin dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-ai-dark">
            <div className="ai-card border-b border-ai-gray-800 mb-0 rounded-none">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-3xl font-bold ai-text-gradient">Admin Dashboard</h1>
                            <p className="text-ai-gray-400 mt-1">System overview and management</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Link
                                to="/"
                                className="ai-button-secondary flex items-center space-x-2"
                            >
                                <Home className="h-4 w-4" />
                                <span>Back to Dashboard</span>
                            </Link>
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === 'overview'
                                    ? 'bg-ai-blue-600 text-white shadow-lg shadow-ai-blue-500/25'
                                    : 'text-ai-gray-400 hover:text-ai-gray-200 hover:bg-ai-gray-800'
                                    }`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === 'users'
                                    ? 'bg-ai-blue-600 text-white shadow-lg shadow-ai-blue-500/25'
                                    : 'text-ai-gray-400 hover:text-ai-gray-200 hover:bg-ai-gray-800'
                                    }`}
                            >
                                Users
                            </button>
                            <button
                                onClick={() => setActiveTab('tickets')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === 'tickets'
                                    ? 'bg-ai-blue-600 text-white shadow-lg shadow-ai-blue-500/25'
                                    : 'text-ai-gray-400 hover:text-ai-gray-200 hover:bg-ai-gray-800'
                                    }`}
                            >
                                Tickets
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'overview' && (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="ai-card p-6 ai-glow">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 bg-gradient-to-br from-ai-blue-500 to-ai-cyan-500 rounded-xl flex items-center justify-center">
                                            <Users className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-ai-gray-400">Total Users</p>
                                        <p className="text-2xl font-semibold text-ai-gray-100">{stats.totalUsers}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="ai-card p-6 ai-glow">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 bg-gradient-to-br from-ai-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
                                            <TicketIcon className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-ai-gray-400">Total Tickets</p>
                                        <p className="text-2xl font-semibold text-ai-gray-100">{stats.totalTickets}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="ai-card p-6 ai-glow">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                                            <Clock className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-ai-gray-400">Open Tickets</p>
                                        <p className="text-2xl font-semibold text-ai-gray-100">{stats.openTickets}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="ai-card p-6 ai-glow">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                                            <AlertCircle className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-ai-gray-400">Critical Tickets</p>
                                        <p className="text-2xl font-semibold text-ai-gray-100">{stats.criticalTickets}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Tickets */}
                        <div className="ai-card ai-glow mb-8">
                            <div className="px-6 py-4 border-b border-ai-gray-800">
                                <h3 className="text-xl font-semibold text-ai-gray-100">Recent Tickets</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-ai-gray-800">
                                    <thead className="bg-ai-gray-900/50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-ai-gray-400 uppercase tracking-wider">
                                                Title
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-ai-gray-400 uppercase tracking-wider">
                                                Priority
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-ai-gray-400 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-ai-gray-400 uppercase tracking-wider">
                                                Category
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-ai-gray-400 uppercase tracking-wider">
                                                Created
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-ai-gray-800">
                                        {recentTickets.map((ticket) => (
                                            <tr key={ticket.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-ai-gray-100">
                                                        {ticket.title}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                                                        {ticket.priority}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                                                        {ticket.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-ai-gray-300">
                                                    {ticket.category}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-ai-gray-300">
                                                    {new Date(ticket.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'users' && (
                    <div className="ai-card ai-glow">
                        <div className="px-6 py-4 border-b border-ai-gray-800 flex justify-between items-center">
                            <h3 className="text-xl font-semibold text-ai-gray-100">System Users</h3>
                            <button
                                onClick={handleCreateUser}
                                className="ai-button-primary flex items-center space-x-2"
                            >
                                <UserPlus className="h-4 w-4" />
                                <span>Add User</span>
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-ai-gray-800">
                                <thead className="bg-ai-gray-900/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-ai-gray-400 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-ai-gray-400 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-ai-gray-400 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-ai-gray-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-ai-gray-800">
                                    {allUsers.map((userData) => (
                                        <tr key={userData.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-ai-gray-100">
                                                    {userData.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-ai-gray-300">
                                                {userData.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${userData.role === 'admin'
                                                    ? 'bg-ai-purple-900/50 text-ai-purple-300 border border-ai-purple-500/50'
                                                    : 'bg-ai-blue-900/50 text-ai-blue-300 border border-ai-blue-500/50'
                                                    }`}>
                                                    {userData.role === 'admin' ? 'Admin' : 'Technician'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-ai-gray-300">
                                                <div className="flex items-center space-x-3">
                                                    <button
                                                        onClick={() => handleEditUser(userData)}
                                                        className="text-ai-blue-400 hover:text-ai-blue-300 transition-colors"
                                                        title="Edit user"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    {userData.id !== user?.id && (
                                                        <button
                                                            onClick={() => handleDeleteUser(userData.id)}
                                                            className="text-red-400 hover:text-red-300 transition-colors"
                                                            title="Delete user"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'tickets' && (
                    <div className="ai-card ai-glow">
                        <div className="px-6 py-4 border-b border-ai-gray-800 flex justify-between items-center">
                            <h3 className="text-xl font-semibold text-ai-gray-100">All Tickets</h3>
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-ai-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search tickets..."
                                        className="ai-input pl-10"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-ai-gray-800">
                                <thead className="bg-ai-gray-900/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-ai-gray-400 uppercase tracking-wider">
                                            Title
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-ai-gray-400 uppercase tracking-wider">
                                            Priority
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-ai-gray-400 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-ai-gray-400 uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-ai-gray-400 uppercase tracking-wider">
                                            Assigned To
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-ai-gray-400 uppercase tracking-wider">
                                            Created
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-ai-gray-800">
                                    {recentTickets.map((ticket) => (
                                        <tr key={ticket.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-ai-gray-100">
                                                    {ticket.title}
                                                </div>
                                                <div className="text-sm text-ai-gray-400 truncate max-w-xs">
                                                    {ticket.description}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                                                    {ticket.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                                                    {ticket.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-ai-gray-300">
                                                {ticket.category}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-ai-gray-300">
                                                {ticket.assignedTo || 'Unassigned'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-ai-gray-300">
                                                {new Date(ticket.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Create User Modal */}
            {showCreateUserModal && (
                <CreateUserModal
                    onClose={() => setShowCreateUserModal(false)}
                    onUserCreated={handleUserCreated}
                />
            )}

            {/* Edit User Modal */}
            {showEditUserModal && selectedUser && (
                <EditUserModal
                    user={selectedUser}
                    onClose={() => {
                        setShowEditUserModal(false);
                        setSelectedUser(null);
                    }}
                    onUserUpdated={handleUserUpdated}
                />
            )}
        </div>
    );
};

export default AdminDashboard;
