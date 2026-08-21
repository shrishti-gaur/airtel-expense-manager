import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, ArrowRight, ShieldAlert } from 'lucide-react';
import Button from '../../components/ui/Button';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      redirectUser(user.role);
    } catch (err) {
      setError(err.message || 'Authentication request failed. Ensure backend service is active.');
    } finally {
      setLoading(false);
    }
  };

  const redirectUser = (role) => {
    if (role === 'Manager') {
      navigate('/manager');
    } else if (role === 'Finance') {
      navigate('/finance');
    } else {
      navigate('/employee');
    }
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-slate-900 px-4 font-sans relative overflow-hidden">
      {/* Decorative Brand Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-red-600/10 blur-[150px]" />
      <div className="absolute bottom-[-20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-rose-500/10 blur-[150px]" />

      <div className="w-full max-w-md animate-fade-in">
        {/* Logo area */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-4xl font-extrabold tracking-tighter text-red-600 font-display">
              airtel
            </span>
            <span className="rounded-md bg-slate-800 px-2.5 py-0.5 text-sm font-bold text-slate-300 border border-slate-700/50">
              Expense
            </span>
          </div>
          <p className="text-sm font-medium text-slate-400">
            Enterprise Claims & Reimbursement Manager
          </p>
        </div>

        {/* Card Form container */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-8 shadow-2xl backdrop-blur-md">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white font-display">Welcome Back</h2>
            <p className="text-xs text-slate-400">Authenticate using corporate single sign-on parameters</p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg bg-rose-950/40 border border-rose-800/40 p-3 text-xs text-rose-300">
              <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5" htmlFor="email">
                Corporate Email or OLM ID
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="email"
                  type="text"
                  required
                  placeholder="name@airtel.com or OLM ID"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5" htmlFor="password">
                Security Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full mt-2" loading={loading}>
              Sign In with AD
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
