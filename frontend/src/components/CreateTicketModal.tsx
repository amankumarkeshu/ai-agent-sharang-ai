import React, { useState } from 'react';
import { CreateTicketRequest, TicketCategory, TicketPriority } from '../types';
import apiService from '../services/api';
import { X, Sparkles, Loader } from 'lucide-react';

interface CreateTicketModalProps {
    onClose: () => void;
    onTicketCreated: () => void;
}

const CreateTicketModal: React.FC<CreateTicketModalProps> = ({ onClose, onTicketCreated }) => {
    const [formData, setFormData] = useState<CreateTicketRequest>({
        title: '',
        description: '',
        category: 'Other',
        priority: 'medium',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [aiTriageLoading, setAiTriageLoading] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<any>(null);
    const [showAiSuggestion, setShowAiSuggestion] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await apiService.createTicket(formData);
            onTicketCreated();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create ticket');
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

    const handleAITriage = async () => {
        if (!formData.title || !formData.description) {
            setError('Please enter title and description for AI triage');
            return;
        }

        setAiTriageLoading(true);
        setError('');

        try {
            const triageResult = await apiService.triageTicket({
                title: formData.title,
                description: formData.description,
            });

            setAiSuggestion(triageResult);
            setShowAiSuggestion(true);
        } catch (err: any) {
            setError(err.response?.data?.error || 'AI triage failed');
        } finally {
            setAiTriageLoading(false);
        }
    };

    const acceptAiSuggestion = () => {
        if (aiSuggestion) {
            setFormData({
                ...formData,
                category: aiSuggestion.category,
                priority: aiSuggestion.priority,
            });
            setShowAiSuggestion(false);
        }
    };

    const rejectAiSuggestion = () => {
        setShowAiSuggestion(false);
        setAiSuggestion(null);
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Create New Ticket</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                            Title *
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            required
                            value={formData.title}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900"
                            placeholder="Brief description of the issue"
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Description *
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={4}
                            required
                            value={formData.description}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900"
                            placeholder="Detailed description of the issue, including steps to reproduce if applicable"
                        />
                    </div>

                    <div className="flex justify-between items-center">
                        <button
                            type="button"
                            onClick={handleAITriage}
                            disabled={aiTriageLoading || !formData.title || !formData.description}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {aiTriageLoading ? (
                                <Loader className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Sparkles className="h-4 w-4 mr-2" />
                            )}
                            AI Auto-Triage
                        </button>
                    </div>

                    {showAiSuggestion && aiSuggestion && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-purple-900 flex items-center">
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    AI Triage Suggestion
                                </h4>
                                <div className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                                    Confidence: {Math.round(aiSuggestion.confidence * 100)}%
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium text-gray-700">Category:</span>
                                    <span className="ml-2 text-purple-700">{aiSuggestion.category}</span>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">Priority:</span>
                                    <span className="ml-2 text-purple-700 capitalize">{aiSuggestion.priority}</span>
                                </div>
                            </div>

                            {aiSuggestion.suggestedTechnician && (
                                <div className="text-sm">
                                    <span className="font-medium text-gray-700">Suggested Technician:</span>
                                    <span className="ml-2 text-purple-700">{aiSuggestion.suggestedTechnician}</span>
                                </div>
                            )}

                            <div className="text-sm">
                                <span className="font-medium text-gray-700">Summary:</span>
                                <p className="mt-1 text-gray-600">{aiSuggestion.summary}</p>
                            </div>

                            {aiSuggestion.reasoning && (
                                <div className="text-sm">
                                    <span className="font-medium text-gray-700">Reasoning:</span>
                                    <p className="mt-1 text-gray-600">{aiSuggestion.reasoning}</p>
                                </div>
                            )}

                            <div className="flex justify-end space-x-2 pt-2">
                                <button
                                    type="button"
                                    onClick={rejectAiSuggestion}
                                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                                >
                                    Dismiss
                                </button>
                                <button
                                    type="button"
                                    onClick={acceptAiSuggestion}
                                    className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                                >
                                    Apply Suggestions
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                                Category
                            </label>
                            <select
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900"
                            >
                                <option value="Network Issue">Network Issue</option>
                                <option value="Hardware Issue">Hardware Issue</option>
                                <option value="Software Issue">Software Issue</option>
                                <option value="Security Issue">Security Issue</option>
                                <option value="Performance Issue">Performance Issue</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                                Priority
                            </label>
                            <select
                                id="priority"
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                                    Creating...
                                </div>
                            ) : (
                                'Create Ticket'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTicketModal;
