import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LoginRequest } from '../types';
import { Eye, EyeOff, LogIn, User, Lock, Zap, Brain, Shield } from 'lucide-react';

const Login: React.FC = () => {
    const { login } = useAuth();
    const [formData, setFormData] = useState<LoginRequest>({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await login(formData);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-ai-dark py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 bg-ai-grid bg-grid opacity-20"></div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-ai-blue-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-ai-purple-500/10 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>

            <div className="max-w-md w-full space-y-8 relative z-10">
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-gradient-to-br from-ai-blue-500 to-ai-cyan-500 rounded-2xl flex items-center justify-center mb-8 animate-float ai-glow">
                        <Brain className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold ai-text-gradient mb-2">
                        IntelliOps AI
                    </h1>
                    <h2 className="text-2xl font-semibold text-ai-gray-200 mb-4">
                        Co-Pilot
                    </h2>
                    <p className="text-ai-gray-400 text-lg">
                        Intelligent Operations Assistant
                    </p>

                    {/* Feature highlights */}
                    <div className="flex justify-center space-x-6 mt-6">
                        <div className="flex items-center space-x-2 text-ai-gray-300">
                            <Zap className="h-4 w-4 text-ai-cyan-400" />
                            <span className="text-sm">AI-Powered</span>
                        </div>
                        <div className="flex items-center space-x-2 text-ai-gray-300">
                            <Shield className="h-4 w-4 text-ai-emerald-400" />
                            <span className="text-sm">Secure</span>
                        </div>
                    </div>
                </div>

                <div className="ai-card p-8 ai-glow">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-ai-gray-200 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-ai-gray-400" />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="ai-input w-full pl-10 pr-3"
                                        placeholder="Enter your email"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-ai-gray-200 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-ai-gray-400" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="ai-input w-full pl-10 pr-10"
                                        placeholder="Enter your password"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="text-ai-gray-400 hover:text-ai-gray-200 transition-colors duration-200"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5" />
                                            ) : (
                                                <Eye className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-900/50 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm backdrop-blur-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="ai-button-primary w-full flex justify-center items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Authenticating...</span>
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="h-5 w-5" />
                                        <span>Access System</span>
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="text-center">
                            <div className="bg-ai-gray-800/50 rounded-lg p-4 border border-ai-gray-700">
                                <p className="text-sm text-ai-gray-300 mb-2">Demo Credentials</p>
                                <div className="font-mono text-xs text-ai-cyan-400">
                                    <div>admin@intelliops.com</div>
                                    <div>password</div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Decorative elements */}
                <div className="flex justify-center space-x-2 mt-8">
                    <div className="w-2 h-2 bg-ai-blue-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-ai-cyan-500 rounded-full animate-pulse delay-200"></div>
                    <div className="w-2 h-2 bg-ai-purple-500 rounded-full animate-pulse delay-500"></div>
                </div>
            </div>
        </div>
    );
};

export default Login;
