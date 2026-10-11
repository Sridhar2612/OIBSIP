import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, XCircle, Mail, ArrowRight } from 'lucide-react';

export const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading');
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const { verifyEmail, resendVerification } = useAuth();

  useEffect(() => {
    if (token) {
      verifyEmail(token).then((res) => {
        if (res.success) {
          setStatus('success');
        } else {
          setStatus('error');
        }
      });
    } else {
      setStatus('error');
    }
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    setResending(true);
    await resendVerification(resendEmail);
    setResending(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl p-8 text-center shadow-2xl">
        {status === 'loading' && (
          <div className="space-y-4">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h2 className="text-xl font-bold text-white">Verifying your email...</h2>
            <p className="text-xs text-stone-400">Please hold on while we confirm your credentials.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="inline-flex p-3 bg-emerald-500/10 text-emerald-400 rounded-full">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold text-white">Email Verified!</h2>
            <p className="text-sm text-stone-300">
              Your account is now fully verified and activated.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full py-3 px-4 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg"
            >
              <span>Proceed to Login</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="inline-flex p-3 bg-red-500/10 text-red-400 rounded-full">
              <XCircle className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold text-white">Verification Link Expired</h2>
            <p className="text-xs text-stone-400 leading-relaxed">
              This verification link is either invalid or has already expired. Enter your email below to receive a new link.
            </p>

            <form onSubmit={handleResend} className="mt-4 space-y-3">
              <div className="relative text-left">
                <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-white placeholder-stone-600 focus:outline-none focus:border-orange-500"
                />
              </div>
              <button
                type="submit"
                disabled={resending}
                className="w-full py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-white font-semibold rounded-xl text-xs transition-all disabled:opacity-50"
              >
                {resending ? 'Sending...' : 'Resend Verification Email'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
