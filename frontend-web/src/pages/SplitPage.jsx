import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { userAPI, paymentAPI } from '../services/api';
import UserAvatar from '../components/Shared/UserAvatar';
import { normaliseUsername } from '../utils/format';

export default function SplitPage() {
  const [recipients, setRecipients] = useState([]);
  const [query,      setQuery]      = useState('');
  const [found,      setFound]      = useState(null);
  const [searching,  setSearching]  = useState(false);
  const [mode,       setMode]       = useState('equal');
  const [totalEth,   setTotalEth]   = useState('');
  const [groupNote,  setGroupNote]  = useState('');
  const [sending,    setSending]    = useState(false);
  const [done,       setDone]       = useState(false);
  const debounce = useRef(null);

  const onQuery = (val) => {
    setQuery(val); setFound(null);
    clearTimeout(debounce.current);
    const q = normaliseUsername(val);
    if (q.length < 2) return;
    debounce.current = setTimeout(async () => {
      setSearching(true);
      try { setFound((await userAPI.getByUsername(q)).data.user); }
      catch { setFound(null); }
      finally { setSearching(false); }
    }, 400);
  };

  const addRecipient = () => {
    if (!found) return;
    if (recipients.find(r => r.user.username === found.username)) return toast.error('Already added');
    setRecipients(p => [...p, { user: found, amountEth: '' }]);
    setQuery(''); setFound(null);
  };

  const remove    = (u) => setRecipients(p => p.filter(r => r.user.username !== u));
  const updateAmt = (u, v) => setRecipients(p => p.map(r => r.user.username === u ? { ...r, amountEth: v } : r));

  const equalSplit = () => {
    if (!totalEth || !recipients.length) return;
    const share = (parseFloat(totalEth) / recipients.length).toFixed(6);
    setRecipients(p => p.map(r => ({ ...r, amountEth: share })));
  };

  const onSend = async () => {
    if (recipients.length < 2) return toast.error('Need at least 2 recipients');
    const inv = recipients.find(r => !r.amountEth || +r.amountEth <= 0);
    if (inv) return toast.error(`Set amount for @${inv.user.username}`);
    setSending(true);
    try {
      // No private key — backend uses stored key
      await paymentAPI.splitPayment({
        recipients: recipients.map(r => ({ username: r.user.username, amountEth: r.amountEth })),
        groupNote,
      });
      toast.success('Split payment sent!');
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Split failed');
    } finally { setSending(false); }
  };

  const reset = () => { setDone(false); setRecipients([]); setTotalEth(''); setGroupNote(''); };
  const total = recipients.reduce((s, r) => s + (+r.amountEth || 0), 0);

  if (done) return (
    <div className="max-w-md fade-up">
      <div className="card flex flex-col items-center text-center gap-4 py-12">
        <div className="w-16 h-16 rounded-full border-2 border-dp-success bg-dp-success/10 flex items-center justify-center text-2xl text-dp-success">✓</div>
        <h2 className="text-[1.5rem] font-display font-bold">Split Sent!</h2>
        <p className="text-dp-text2">{recipients.length} recipients received their share.</p>
        <button className="btn-primary mt-2" onClick={reset}>New Split</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-[560px] flex flex-col gap-6 fade-up">
      <div>
        <h2 className="text-[1.7rem] font-display font-bold">Split Payment</h2>
        <p className="text-dp-text2 text-sm mt-1">Divide a bill across multiple people in one transaction</p>
      </div>

      <div className="card flex flex-col gap-3">
        <h3 className="font-display font-bold">Add Recipients</h3>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dp-accent font-bold text-sm">@</span>
            <input className="input-field pl-7" value={query} onChange={e => onQuery(e.target.value)} placeholder="username" />
          </div>
          <button className="btn-secondary px-4" onClick={addRecipient} disabled={!found}>+ Add</button>
        </div>
        {searching && <p className="text-dp-text2 text-sm flex items-center gap-2"><span className="spinner-accent w-3.5 h-3.5" />Looking up…</p>}
        {found && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-[12px] bg-dp-accent/5 border border-dp-accent/20">
            <UserAvatar user={found} size={32} />
            <span className="font-semibold text-sm">@{found.username}</span>
            <span className="text-dp-text2 text-xs">{found.fullName}</span>
          </div>
        )}
      </div>

      {recipients.length > 0 && (
        <div className="card flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold">Recipients ({recipients.length})</h3>
            <div className="flex rounded-[10px] border border-white/[0.07] overflow-hidden">
              {['equal','custom'].map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className={`px-3 py-1.5 text-[0.78rem] capitalize transition-colors ${mode === m ? 'bg-dp-accent text-white' : 'text-dp-text2 hover:text-dp-text'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          {mode === 'equal' && (
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="input-label">Total ETH to split</label>
                <input className="input-field" type="number" step="0.001" min="0"
                  value={totalEth} onChange={e => setTotalEth(e.target.value)} placeholder="1.5" />
              </div>
              <button className="btn-secondary px-4 py-3 text-sm" onClick={equalSplit}>Split Equal</button>
            </div>
          )}
          <div className="flex flex-col gap-2">
            {recipients.map(({ user, amountEth }) => (
              <div key={user.username} className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] bg-dp-bg2">
                <UserAvatar user={user} size={34} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">@{user.username}</p>
                  <p className="text-dp-text2 text-xs">{user.fullName}</p>
                </div>
                <input className="input-field text-right text-sm py-1.5 w-24"
                  type="number" step="0.0001" min="0" placeholder="ETH"
                  value={amountEth} onChange={e => updateAmt(user.username, e.target.value)} />
                <button onClick={() => remove(user.username)} className="text-dp-text3 hover:text-dp-danger text-lg transition-colors">✕</button>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-white/[0.07] text-sm">
            <span className="text-dp-text2">Total</span>
            <span className="font-display font-bold">{total.toFixed(6)} ETH</span>
          </div>
          <div>
            <label className="input-label">Group Note</label>
            <input className="input-field" value={groupNote} onChange={e => setGroupNote(e.target.value)} placeholder="Dinner, trip, rent…" maxLength={256} />
          </div>
          {/* No private key field */}
          <button className="btn-primary w-full" onClick={onSend} disabled={sending || recipients.length < 2}>
            {sending ? <span className="spinner" /> : `Send Split (${total.toFixed(4)} ETH)`}
          </button>
        </div>
      )}

      {recipients.length === 0 && (
        <div className="card text-center py-10 text-dp-text3 border-dashed">Add at least 2 recipients above</div>
      )}
    </div>
  );
}