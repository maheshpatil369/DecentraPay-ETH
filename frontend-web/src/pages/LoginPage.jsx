import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ emailOrUsername: '', password: '' });
  const [loading, setLoading] = useState(false);

  const onChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.emailOrUsername.trim(), form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-dp-bg flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="fixed top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 70%)' }} />
      <div className="fixed bottom-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(0,212,170,0.08) 0%, transparent 70%)' }} />

      <div className="card w-full max-w-[420px] relative z-10 shadow-glow fade-up">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[2.2rem] font-display font-black text-dp-accent leading-none">Ð</span>
          <h1 className="text-[1.6rem] font-display font-bold">DecentraPay</h1>
        </div>
        <p className="text-dp-text2 text-sm mb-8">Sign in to your account</p>

        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div>
            <label className="input-label">Email or Username</label>
            <input
              className="input-field"
              name="emailOrUsername"
              value={form.emailOrUsername}
              onChange={onChange}
              placeholder="you@example.com or @username"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="input-label">Password</label>
            <input
              className="input-field"
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-dp-text2 text-sm mt-6">
          No account?{' '}
          <Link to="/register" className="text-dp-accent font-semibold hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
