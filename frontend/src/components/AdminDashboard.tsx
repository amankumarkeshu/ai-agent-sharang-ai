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
    Home
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
            case 'critical': return 'text-red-600 bg-red-100';
            case 'high': return 'text-orange-600 bg-orange-100';
            case 'medium': return 'text-yellow-600 bg-yellow-100';
            case 'low': return 'text-green-600 bg-green-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'text-blue-600 bg-blue-100';
            case 'in_progress': return 'text-yellow-600 bg-yellow-100';
            case 'resolved': return 'text-green-600 bg-green-100';
            case 'closed': return 'text-gray-600 bg-gray-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    if (user?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600">You need admin privileges to access this page.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                            <p className="text-gray-600">System overview and management</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link
                                to="/"
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                <Home className="h-4 w-4 mr-2" />
                                Back to Dashboard
                            </Link>
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'overview'
                                    ? 'bg-primary-100 text-primary-700'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'users'
                                    ? 'bg-primary-100 text-primary-700'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Users
                            </button>
                            <button
                                onClick={() => setActiveTab('tickets')}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'tickets'
                                    ? 'bg-primary-100 text-primary-700'
                                    : 'text-gray-500 hover:text-gray-700'
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
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <Users className="h-8 w-8 text-blue-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Total Users</p>
                                        <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <TicketIcon className="h-8 w-8 text-green-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Total Tickets</p>
                                        <p className="text-2xl font-semibold text-gray-900">{stats.totalTickets}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <Clock className="h-8 w-8 text-yellow-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Open Tickets</p>
                                        <p className="text-2xl font-semibold text-gray-900">{stats.openTickets}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <AlertCircle className="h-8 w-8 text-red-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Critical Tickets</p>
                                        <p className="text-2xl font-semibold text-gray-900">{stats.criticalTickets}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Tickets */}
                        <div className="bg-white rounded-lg shadow mb-8">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">Recent Tickets</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Title
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Priority
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Category
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Created
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {recentTickets.map((ticket) => (
                                            <tr key={ticket.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {ticket.title}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                                                        {ticket.priority}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                                                        {ticket.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {ticket.category}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                    <div className="bg-white rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900">System Users</h3>
                            <button
                                onClick={handleCreateUser}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add User
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {allUsers.map((userData) => (
                                        <tr key={userData.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {userData.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {userData.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${userData.role === 'admin'
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {userData.role === 'admin' ? 'Admin' : 'Technician'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleEditUser(userData)}
                                                        className="text-primary-600 hover:text-primary-900"
                                                        title="Edit user"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    {userData.id !== user?.id && (
                                                        <button
                                                            onClick={() => handleDeleteUser(userData.id)}
                                                            className="text-red-600 hover:text-red-900"
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
                    <div className="bg-white rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900">All Tickets</h3>
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search tickets..."
                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Title
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Priority
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Assigned To
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Created
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {recentTickets.map((ticket) => (
                                        <tr key={ticket.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {ticket.title}
                                                </div>
                                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                                    {ticket.description}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                                                    {ticket.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                                                    {ticket.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {ticket.category}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {ticket.assignedTo || 'Unassigned'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
