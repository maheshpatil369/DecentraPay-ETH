import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const STEPS = ['Account', 'Username & PIN', 'Review'];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep]       = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    username: '', pin: '', walletAddress: '', privateKey: '',
  });

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const nextStep = (e) => {
    e.preventDefault();
    if (step === 0) {
      if (!form.fullName || !form.email || !form.password) return toast.error('Fill all fields');
      if (form.password.length < 8)                        return toast.error('Password min 8 characters');
      if (!/[A-Z]/.test(form.password))                    return toast.error('Password needs an uppercase letter');
      if (!/[0-9]/.test(form.password))                    return toast.error('Password needs a number');
      if (form.password !== form.confirmPassword)           return toast.error('Passwords do not match');
    }
    if (step === 1) {
      if (!form.username)          return toast.error('Username required');
      if (form.username.length < 3) return toast.error('Username min 3 characters');
      if (!form.walletAddress)     return toast.error('Wallet address required');
      if (!/^0x[a-fA-F0-9]{40}$/.test(form.walletAddress.trim())) return toast.error('Invalid wallet address');
      if (!form.privateKey)        return toast.error('Private key required');
      if (!/^(0x)?[a-fA-F0-9]{64}$/.test(form.privateKey.trim())) return toast.error('Invalid private key format');
    }
    setStep(s => s + 1);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({
        fullName: form.fullName.trim(),
        email:    form.email.trim(),
        password: form.password,
        username: form.username.replace(/^@/, '').trim(),
        pin:      form.pin || undefined,
        walletAddress: form.walletAddress.trim(),
        privateKey:    form.privateKey.trim(),
      });
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
      setStep(0);
    } finally { setLoading(false); }
  };

  const StepDot = ({ i }) => (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
        ${i < step ? 'bg-dp-accent text-white' : i === step ? 'bg-dp-accent text-white ring-2 ring-dp-accent/30' : 'bg-dp-bg3 text-dp-text3 border border-white/[0.07]'}`}>
        {i < step ? '✓' : i + 1}
      </div>
      <span className={`text-[10px] font-semibold ${i === step ? 'text-dp-accent' : 'text-dp-text3'}`}>{STEPS[i]}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-dp-bg flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="fixed top-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(108,99,255,0.1) 0%, transparent 70%)' }} />

      <div className="card w-full max-w-[460px] relative z-10 fade-up">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-[2rem] font-display font-black text-dp-accent">Ð</span>
          <h1 className="text-[1.5rem] font-display font-bold">Create Account</h1>
        </div>

        <div className="flex mb-7 pb-6 border-b border-white/[0.07]">
          {STEPS.map((_, i) => <StepDot key={i} i={i} />)}
        </div>

        {/* Step 0 */}
        {step === 0 && (
          <form onSubmit={nextStep} className="flex flex-col gap-4">
            <div>
              <label className="input-label">Full Name</label>
              <input className="input-field" name="fullName" value={form.fullName} onChange={set} placeholder="Mahesh Kumar" required />
            </div>
            <div>
              <label className="input-label">Email</label>
              <input className="input-field" type="email" name="email" value={form.email} onChange={set} placeholder="you@example.com" required />
            </div>
            <div>
              <label className="input-label">Password</label>
              <input className="input-field" type="password" name="password" value={form.password} onChange={set} placeholder="Min 8 chars, 1 uppercase, 1 number" required />
            </div>
            <div>
              <label className="input-label">Confirm Password</label>
              <input className="input-field" type="password" name="confirmPassword" value={form.confirmPassword} onChange={set} placeholder="Repeat password" required />
            </div>
            <button type="submit" className="btn-primary w-full mt-2">Next →</button>
          </form>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <form onSubmit={nextStep} className="flex flex-col gap-4">
            <div>
              <label className="input-label">Username</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dp-accent font-bold text-sm">@</span>
                <input className="input-field pl-7" name="username" value={form.username} onChange={set}
                  placeholder="mahesh" pattern="[a-zA-Z0-9_]{3,30}" required />
              </div>
              <p className="text-dp-text3 text-[11px] mt-1">3-30 chars · letters, numbers, underscores</p>
            </div>
            <div>
              <label className="input-label">App Lock PIN <span className="text-dp-text3 normal-case font-normal">(optional)</span></label>
              <input className="input-field" type="password" name="pin" value={form.pin} onChange={set}
                placeholder="4-6 digit PIN" maxLength={6} inputMode="numeric" />
            </div>
            <div>
              <label className="input-label">Wallet Address (Ganache)</label>
              <input className="input-field font-mono text-xs" name="walletAddress" value={form.walletAddress} onChange={set}
                placeholder="0x..." required />
              <p className="text-dp-text3 text-[11px] mt-1">Use a Ganache account address</p>
            </div>
            <div>
              <label className="input-label">Private Key (Ganache)</label>
              <input className="input-field font-mono text-xs" type="password" name="privateKey" value={form.privateKey} onChange={set}
                placeholder="0x..." required />
              <p className="text-dp-text3 text-[11px] mt-1">Used for local signing only</p>
            </div>
            <div className="flex gap-3 mt-2">
              <button type="button" className="btn-secondary flex-1" onClick={() => setStep(0)}>← Back</button>
              <button type="submit" className="btn-primary flex-[2]">Next →</button>
            </div>
          </form>
        )}

        {/* Step 2 — Review */}
        {step === 2 && (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="rounded-[14px] bg-dp-bg2 border border-white/[0.07] overflow-hidden">
              {[
                ['Name',    form.fullName],
                ['Email',   form.email],
                ['Username',`@${form.username}`],
                ['Wallet',  form.walletAddress ? `${form.walletAddress.slice(0, 10)}…${form.walletAddress.slice(-8)}` : 'Not set'],
                ['PIN',     form.pin ? '••••' : 'Not set'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center px-4 py-3 border-b border-white/[0.05] last:border-0">
                  <span className="text-dp-text2 text-[0.8rem]">{k}</span>
                  <span className="font-semibold text-[0.82rem]">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-2">
              <button type="button" className="btn-secondary flex-1" onClick={() => setStep(1)}>← Back</button>
              <button type="submit" className="btn-success flex-[2]" disabled={loading}>
                {loading ? <span className="spinner" /> : '🚀 Create Account'}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-dp-text2 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-dp-accent font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}