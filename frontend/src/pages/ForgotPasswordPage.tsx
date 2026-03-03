import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import { Button } from '@/components/ui';
import { ArrowLeft, Mail, KeyRound, CircleCheckBig } from 'lucide-react';

type Step = 'email' | 'reset' | 'done';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.reset_token) {
        setToken(res.data.reset_token);
        setMessage('A reset token has been generated. Enter it below with your new password.');
      } else {
        setMessage(res.data.message || 'If that email exists, a reset link has been generated.');
      }
      setStep('reset');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/reset-password', { token, new_password: newPassword });
      setMessage(res.data.message || 'Password reset successfully');
      setStep('done');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 mb-4">
            <span className="text-white font-bold text-2xl">BS</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-sm text-gray-500 mt-1">BonneSante Medicals — ASAL Enterprise</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
          {message && step !== 'email' && (
            <div className="mb-4 p-3 rounded-lg bg-blue-50 text-blue-700 text-sm">{message}</div>
          )}

          {/* Step 1: Request Token */}
          {step === 'email' && (
            <form onSubmit={handleRequestToken} className="space-y-4">
              <div className="flex items-center gap-2 mb-2 text-gray-600">
                <Mail size={20} />
                <h2 className="text-lg font-semibold text-gray-900">Enter your email</h2>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                We'll generate a password reset token for your account.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  placeholder="your@email.com"
                />
              </div>
              <Button type="submit" loading={loading} className="w-full">Request Reset Token</Button>
            </form>
          )}

          {/* Step 2: Enter Token & New Password */}
          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="flex items-center gap-2 mb-2 text-gray-600">
                <KeyRound size={20} />
                <h2 className="text-lg font-semibold text-gray-900">Set new password</h2>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reset Token</label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-mono"
                  placeholder="Paste your reset token"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  placeholder="Min 8 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  placeholder="Repeat new password"
                />
              </div>
              <Button type="submit" loading={loading} className="w-full">Reset Password</Button>
              <button type="button" onClick={() => { setStep('email'); setError(''); setMessage(''); }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 mt-2">
                Back to email step
              </button>
            </form>
          )}

          {/* Step 3: Success */}
          {step === 'done' && (
            <div className="text-center py-4">
              <CircleCheckBig size={48} className="mx-auto text-green-500 mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Password Reset!</h2>
              <p className="text-sm text-gray-500 mb-6">{message}</p>
              <Link to="/login" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700">
                Go to Login
              </Link>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <Link to="/login" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
