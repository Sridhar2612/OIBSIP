import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, User } from 'lucide-react';

export const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await adminLogin(email, password);
    setSubmitting(false);
    if (res.success) {
      navigate('/admin/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-stone-950">
      <div className="w-full max-w-md bg-stone-900 border border-amber-900/50 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>

        <div className="text-center mb-8 relative">
          <div className="inline-flex p-3 bg-amber-500/10 rounded-2xl text-amber-400 mb-3 border border-amber-500/20">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Admin Portal</h2>
          <p className="text-xs text-amber-300/80 mt-1">Authorized personnel only — Inventory & Order Control</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative">
          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1.5">Admin Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@slicecraft.com"
                className="w-full pl-10 pr-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1.5">Security Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-950 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            {submitting ? (
              <span className="w-5 h-5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Authorize & Enter Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-stone-800 text-center">
          <Link
            to="/login"
            className="inline-flex items-center text-xs text-stone-400 hover:text-orange-400 transition-colors"
          >
            <User className="w-3.5 h-3.5 mr-1" />
            Switch to Regular Customer Login
          </Link>
        </div>
      </div>
    </div>
  );
};
