import React, { useState } from 'react';
import { Lightbulb, FileText, Loader, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import apiService from '../services/api';

interface TicketSolutionPanelProps {
    ticketId: string;
}

interface SuggestedSolution {
    title: string;
    description: string;
    steps: string[];
    references: string[];
    confidence: number;
}

interface DocumentSource {
    document: {
        title: string;
        summary: string;
    };
    score: number;
    relevance: string;
}

interface TicketSolution {
    ticketId: string;
    solutions: SuggestedSolution[];
    documentSources: DocumentSource[];
    confidence: number;
    generatedAt: string;
}

const TicketSolutionPanel: React.FC<TicketSolutionPanelProps> = ({ ticketId }) => {
    const [loading, setLoading] = useState(false);
    const [solution, setSolution] = useState<TicketSolution | null>(null);
    const [error, setError] = useState('');
    const [expandedSolution, setExpandedSolution] = useState<number | null>(null);

    const fetchSolutions = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await apiService.getTicketSolutions(ticketId);
            setSolution(response);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch solutions');
        } finally {
            setLoading(false);
        }
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return 'text-green-600 bg-green-100';
        if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
        return 'text-orange-600 bg-orange-100';
    };

    const getRelevanceColor = (relevance: string) => {
        if (relevance === 'High') return 'bg-green-100 text-green-800';
        if (relevance === 'Medium') return 'bg-yellow-100 text-yellow-800';
        return 'bg-orange-100 text-orange-800';
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <Lightbulb className="h-6 w-6 text-yellow-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">
                        AI-Powered Solutions
                    </h3>
                </div>
                <button
                    onClick={fetchSolutions}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? (
                        <>
                            <Loader className="animate-spin h-4 w-4 mr-2" />
                            Finding Solutions...
                        </>
                    ) : (
                        <>
                            <Lightbulb className="h-4 w-4 mr-2" />
                            Find Solutions
                        </>
                    )}
                </button>
            </div>

            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {solution && (
                <div className="space-y-6">
                    {/* Overall Confidence */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">
                            Overall Confidence
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getConfidenceColor(solution.confidence)}`}>
                            {(solution.confidence * 100).toFixed(0)}%
                        </span>
                    </div>

                    {/* Suggested Solutions */}
                    <div className="space-y-4">
                        <h4 className="text-md font-semibold text-gray-900">
                            Suggested Solutions ({solution.solutions.length})
                        </h4>

                        {solution.solutions.map((sol, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setExpandedSolution(expandedSolution === index ? null : index)}
                                    className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center flex-1">
                                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                                        <div className="text-left flex-1">
                                            <p className="font-medium text-gray-900">{sol.title}</p>
                                            <p className="text-sm text-gray-500 mt-1">{sol.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center ml-4">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getConfidenceColor(sol.confidence)}`}>
                                            {(sol.confidence * 100).toFixed(0)}%
                                        </span>
                                        {expandedSolution === index ? (
                                            <ChevronUp className="h-5 w-5 text-gray-400 ml-2" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 text-gray-400 ml-2" />
                                        )}
                                    </div>
                                </button>

                                {expandedSolution === index && (
                                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                                        <div className="mb-4">
                                            <h5 className="text-sm font-semibold text-gray-700 mb-2">
                                                Step-by-Step Instructions:
                                            </h5>
                                            <ol className="list-decimal list-inside space-y-2">
                                                {sol.steps.map((step, stepIndex) => (
                                                    <li key={stepIndex} className="text-sm text-gray-600 pl-2">
                                                        {step}
                                                    </li>
                                                ))}
                                            </ol>
                                        </div>

                                        {sol.references && sol.references.length > 0 && (
                                            <div>
                                                <h5 className="text-sm font-semibold text-gray-700 mb-2">
                                                    References:
                                                </h5>
                                                <div className="space-y-1">
                                                    {sol.references.map((ref, refIndex) => (
                                                        <div key={refIndex} className="flex items-center text-sm text-blue-600">
                                                            <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                                                            <span>{ref}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Document Sources */}
                    {solution.documentSources && solution.documentSources.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-md font-semibold text-gray-900">
                                Relevant Documentation ({solution.documentSources.length})
                            </h4>

                            {solution.documentSources.map((source, index) => (
                                <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center">
                                                <FileText className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
                                                <p className="font-medium text-gray-900">
                                                    {source.document.title}
                                                </p>
                                            </div>
                                            <p className="mt-2 text-sm text-gray-600">
                                                {source.document.summary}
                                            </p>
                                        </div>
                                        <div className="ml-4 flex-shrink-0">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getRelevanceColor(source.relevance)}`}>
                                                {source.relevance}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Timestamp */}
                    <p className="text-xs text-gray-500 text-center">
                        Generated on {new Date(solution.generatedAt).toLocaleString()}
                    </p>
                </div>
            )}

            {!solution && !loading && (
                <div className="text-center py-8">
                    <Lightbulb className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                        Click "Find Solutions" to search our documentation for relevant solutions
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                        AI will analyze your ticket and suggest solutions based on indexed documentation
                    </p>
                </div>
            )}
        </div>
    );
};

export default TicketSolutionPanel;

