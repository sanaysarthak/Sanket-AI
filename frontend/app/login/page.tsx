"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Shield, Eye, EyeOff, Lock, User, AlertCircle, ChevronDown, Fingerprint, Sparkles } from 'lucide-react';
import { CREDENTIALS, getAgencyColor } from '@/lib/auth';

export default function LoginPage() {
    const router = useRouter();
    const { login, isAuthenticated, isLoading } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showQuickLogin, setShowQuickLogin] = useState(false);

    // Redirect if already authenticated
    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.push('/');
        }
    }, [isAuthenticated, isLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        // Simulate network delay for UX
        await new Promise((r) => setTimeout(r, 600));

        const result = login(username, password);
        if (result.success) {
            router.push('/');
        } else {
            setError(result.error || 'Authentication failed');
            setIsSubmitting(false);
        }
    };

    const handleQuickLogin = (uname: string, pwd: string) => {
        setUsername(uname);
        setPassword(pwd);
        setShowQuickLogin(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
                <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50 overflow-hidden relative">
            {/* Animated Background Blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-br from-purple-300/20 to-pink-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute -bottom-20 right-1/3 w-72 h-72 bg-gradient-to-br from-cyan-300/20 to-blue-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Left Panel - 3D Card with Branding */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 items-center justify-center p-12 relative">
                {/* 3D Floating Card */}
                <div
                    className="relative w-full max-w-xl transform perspective-1000"
                    style={{ perspective: '1000px' }}
                >
                    <div
                        className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-500/10 border border-white/50 p-10 transform transition-all duration-500 hover:rotate-y-2 hover:rotate-x-2"
                        style={{
                            transformStyle: 'preserve-3d',
                            transform: 'rotateY(-5deg) rotateX(2deg)',
                        }}
                    >
                        {/* Floating Badge */}
                        <div
                            className="absolute -top-4 -right-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-lg shadow-blue-500/30 flex items-center gap-1.5"
                            style={{ transform: 'translateZ(20px)' }}
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            Secure Platform
                        </div>

                        {/* Logo */}
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-white/50 flex items-center justify-center shadow-lg shadow-blue-500/10 transform transition-transform hover:scale-105 border border-white/60">
                                <img src="/bprd-logo.png" alt="BPRD Logo" className="w-10 h-auto object-contain" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase">Sanket</h1>
                                <p className="text-blue-600 text-sm font-medium">Intelligence Platform</p>
                            </div>
                        </div>

                        <h2 className="text-3xl font-bold text-slate-900 leading-tight mb-4">
                            Unified Intelligence &
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                Coordinated Response System
                            </span>
                        </h2>

                        <p className="text-slate-600 text-base mb-8 leading-relaxed">
                            Empowering law enforcement with a unified view of disparate data sources. From social signals to CCTV feeds, Sanket fuses intelligence in real-time to accelerate decision-making and ensure seamless cross-agency collaboration.
                        </p>

                        {/* Feature Cards */}
                        {/* Feature Cards */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100">
                                <span className="text-xs font-semibold text-blue-700 block mb-1">Crisis Response</span>
                                <span className="text-[10px] text-blue-600/80 leading-tight block">Real-time multi-agency situational awareness</span>
                            </div>
                            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-100">
                                <span className="text-xs font-semibold text-indigo-700 block mb-1">Pattern Detection</span>
                                <span className="text-[10px] text-indigo-600/80 leading-tight block">Cross-platform patterns & misinformation</span>
                            </div>
                            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-100">
                                <span className="text-xs font-semibold text-purple-700 block mb-1">Unified Dashboards</span>
                                <span className="text-[10px] text-purple-600/80 leading-tight block">Improved decision-making & trend analytics</span>
                            </div>
                            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100">
                                <span className="text-xs font-semibold text-blue-700 block mb-1">Secure Sharing</span>
                                <span className="text-[10px] text-blue-600/80 leading-tight block">Role-based access controls</span>
                            </div>
                        </div>

                        {/* Agency Pills */}
                        <div className="flex flex-wrap gap-2">
                            {['Police', 'IB', 'ACT', 'Fire', 'Bomb Squad', 'WPC'].map((agency) => (
                                <span
                                    key={agency}
                                    className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors cursor-default"
                                >
                                    {agency}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl opacity-20 blur-xl" />
                    <div className="absolute -top-8 -right-8 w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full opacity-20 blur-xl" />
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 sm:p-8 relative z-10">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-blue-500/10 border border-slate-100">
                            <img src="/bprd-logo.png" alt="BPRD Logo" className="w-8 h-auto object-contain" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-900 uppercase">Sanket</h1>
                            <p className="text-blue-600 text-xs font-medium">Intelligence Platform</p>
                        </div>
                    </div>

                    {/* Login Card - Glassmorphism */}
                    <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/80 shadow-xl shadow-slate-200/50 p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome back</h2>
                            <p className="text-slate-500 text-sm">Enter your credentials to access the platform</p>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Username */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Username
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <User className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Enter your username"
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Password
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        className="w-full pl-12 pr-12 py-3.5 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button - 3D Effect */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full py-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 transform ${isSubmitting
                                    ? 'bg-blue-400 cursor-wait'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0'
                                    }`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        <Fingerprint className="w-5 h-5" />
                                        Sign In
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-4 my-6">
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                            <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Demo Access</span>
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                        </div>

                        {/* Quick Login Dropdown */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowQuickLogin(!showQuickLogin)}
                                className="w-full py-3.5 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-600 text-sm flex items-center justify-between hover:bg-slate-100/80 hover:border-slate-300 transition-all"
                            >
                                <span className="font-medium">Select demo account</span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${showQuickLogin ? 'rotate-180' : ''}`} />
                            </button>

                            {showQuickLogin && (
                                <div className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/50 overflow-hidden max-h-64 overflow-y-auto">
                                    {CREDENTIALS.map((cred) => (
                                        <button
                                            key={cred.username}
                                            type="button"
                                            onClick={() => handleQuickLogin(cred.username, cred.password)}
                                            className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-0"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm"
                                                    style={{ backgroundColor: getAgencyColor(cred.user.agency) }}
                                                >
                                                    {cred.user.agencyName.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-900 truncate">{cred.user.name}</p>
                                                    <p className="text-xs text-slate-500">{cred.user.agencyName} • <span className="capitalize">{cred.user.role}</span></p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Security Notice */}
                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <div className="flex items-start gap-3 text-xs text-slate-400">
                                <Lock className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-300" />
                                <p className="leading-relaxed">
                                    This is a secure government system. Unauthorized access is prohibited.
                                    All activities are monitored and logged.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-xs text-slate-400 mt-6">
                        © 2025 Sanket Intelligence Platform. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
