import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth }      from '../context/AuthContext';
import { securityAPI, userAPI } from '../services/api';
import UserAvatar       from '../components/Shared/UserAvatar';
import { shortAddr }    from '../utils/format';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [editName,  setEditName]  = useState(user?.fullName || '');
  const [saving,    setSaving]    = useState(false);
  const [newPin,    setNewPin]    = useState('');
  const [savingPin, setSavingPin] = useState(false);
  const [showPin,   setShowPin]   = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return toast.error('Name cannot be empty');
    setSaving(true);
    try {
      const res = await userAPI.updateProfile({ fullName: editName.trim() });
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setSaving(false); }
  };

  const savePin = async (e) => {
    e.preventDefault();
    if (newPin.length < 4 || newPin.length > 6) return toast.error('PIN must be 4-6 digits');
    if (!/^\d+$/.test(newPin)) return toast.error('PIN must be numeric');
    setSavingPin(true);
    try {
      await securityAPI.setPin(newPin);
      toast.success('App PIN updated!');
      setNewPin('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to set PIN'); }
    finally { setSavingPin(false); }
  };

  const qrVal = JSON.stringify({ app: 'decentrapay', username: user?.username, walletAddress: user?.walletAddress, name: user?.fullName });

  return (
    <div className="max-w-2xl flex flex-col gap-6 fade-up">
      <h2 className="text-[1.7rem] font-display font-bold">Profile</h2>

      {/* Identity card */}
      <div className="card flex items-center gap-5">
        <UserAvatar user={user} size={76} />
        <div>
          <p className="text-[1.3rem] font-display font-bold">{user?.fullName}</p>
          <p className="text-dp-accent font-semibold mt-0.5">@{user?.username}</p>
          <p className="font-mono text-[0.75rem] text-dp-text3 mt-1">{shortAddr(user?.walletAddress)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Edit profile */}
        <div className="card">
          <h3 className="font-display font-bold mb-4">Edit Profile</h3>
          <form onSubmit={saveProfile} className="flex flex-col gap-4">
            <div>
              <label className="input-label">Full Name</label>
              <input className="input-field" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your name" required />
            </div>
            <div>
              <label className="input-label">Username <span className="text-dp-text3 font-normal normal-case">(locked)</span></label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dp-accent font-bold text-sm">@</span>
                <input className="input-field pl-7 opacity-50 cursor-not-allowed" value={user?.username || ''} disabled />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* App PIN */}
        <div className="card">
          <h3 className="font-display font-bold mb-2">App Lock PIN</h3>
          <p className="text-dp-text2 text-[0.82rem] mb-4">4–6 digit PIN to lock the mobile app after inactivity.</p>
          <form onSubmit={savePin} className="flex flex-col gap-4">
            <div>
              <label className="input-label">New PIN</label>
              <input
                className="input-field tracking-[0.3em]"
                type={showPin ? 'text' : 'password'}
                value={newPin}
                onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="4-6 digits"
                inputMode="numeric"
                maxLength={6}
                required
              />
            </div>
            <label className="flex items-center gap-2 text-[0.82rem] text-dp-text2 cursor-pointer select-none">
              <input type="checkbox" checked={showPin} onChange={e => setShowPin(e.target.checked)}
                className="accent-dp-accent w-3.5 h-3.5" />
              Show PIN
            </label>
            <button type="submit" className="btn-primary" disabled={savingPin}>
              {savingPin ? <span className="spinner" /> : 'Update PIN'}
            </button>
          </form>
        </div>
      </div>

      {/* QR + Wallet */}
      <div className="grid grid-cols-2 gap-5">
        <div className="card flex flex-col gap-4">
          <h3 className="font-display font-bold">My Payment QR</h3>
          <div className="p-4 bg-white/[0.03] rounded-[14px] border border-white/[0.07] self-start">
            <QRCodeSVG value={qrVal} size={150} bgColor="transparent" fgColor="#f0f0ff" level="H" />
          </div>
          <p className="text-dp-text2 text-[0.8rem]">Others scan this to pay you</p>
        </div>

        <div className="card">
          <h3 className="font-display font-bold mb-4">Wallet Details</h3>
          {[
            ['Address', user?.walletAddress],
            ['Network', 'Ganache (Local)'],
            ['Member since', user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between items-start gap-3 py-2.5 border-b border-white/[0.05] last:border-0">
              <span className="text-dp-text2 text-[0.8rem] flex-shrink-0">{k}</span>
              <span className="text-[0.8rem] text-right font-mono break-all">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
