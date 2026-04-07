import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth }    from '../context/AuthContext';
import { paymentAPI } from '../services/api';
import UserAvatar     from '../components/Shared/UserAvatar';
import { fmtEth, weiToEth, fmtDate, shortAddr } from '../utils/format';

const StatCard = ({ label, value, unit = 'ETH', icon, color }) => (
  <div className="card flex items-center gap-4 hover:border-dp-accent/40 transition-colors">
    <div className="w-11 h-11 rounded-[12px] flex items-center justify-center text-xl flex-shrink-0"
         style={{ background: `${color}20`, color }}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[1.2rem] font-display font-bold truncate">
        {value} <span className="text-dp-text2 text-xs font-normal font-body">{unit}</span>
      </p>
      <p className="text-dp-text2 text-[0.78rem] mt-0.5">{label}</p>
    </div>
  </div>
);

const QuickAction = ({ to, icon, label, color }) => (
  <Link to={to} className="card flex flex-col items-center gap-2.5 py-5 hover:border-dp-accent/40 hover:-translate-y-1 transition-all cursor-pointer">
    <div className="w-11 h-11 rounded-[14px] flex items-center justify-center text-xl"
         style={{ background: `${color}20`, color }}>
      {icon}
    </div>
    <span className="text-dp-text2 text-[0.8rem] font-semibold">{label}</span>
  </Link>
);

export default function DashboardPage() {
  const { user }  = useAuth();
  const [stats,   setStats]   = useState(null);
  const [txs,     setTxs]     = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, hRes] = await Promise.all([
        paymentAPI.getStats(),
        paymentAPI.getHistory(1),
      ]);
      setStats(sRes.data.stats);
      setTxs(hRes.data.transactions.slice(0, 5));
    } catch { toast.error('Failed to load dashboard data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const txDir = (tx) => {
    if (tx.type === 'split') return 'split';
    return tx.senderAddress?.toLowerCase() === user?.walletAddress?.toLowerCase() ? 'sent' : 'received';
  };

  const dirStyle = (dir) => ({
    sent:     { bg: 'bg-dp-accent3/10', color: 'text-dp-accent3', icon: '↑' },
    received: { bg: 'bg-dp-accent2/10', color: 'text-dp-accent2', icon: '↓' },
    split:    { bg: 'bg-dp-accent/10',  color: 'text-dp-accent',  icon: '⊗' },
  }[dir] || { bg: 'bg-dp-accent/10', color: 'text-dp-accent', icon: '⊗' });

  return (
    <div className="max-w-3xl flex flex-col gap-8 fade-up">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-[1.6rem] font-display font-bold">
            {greeting}, <span className="text-dp-accent">{user?.fullName?.split(' ')[0]}</span> 👋
          </h2>
          <p className="text-dp-text2 text-[0.82rem] font-mono mt-1">{shortAddr(user?.walletAddress)}</p>
        </div>
        <UserAvatar user={user} size={52} />
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <span className="spinner-accent" style={{ width: 32, height: 32, borderWidth: 3 }} />
        </div>
      ) : (
        <>
          {/* Live ETH Balance card */}
          <div className="rounded-[22px] p-6 border border-dp-accent/30 relative overflow-hidden"
               style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.15) 0%, rgba(0,212,170,0.08) 100%)' }}>
            <div className="absolute inset-0 opacity-10"
                 style={{ background: 'radial-gradient(circle at 80% 20%, #6c63ff 0%, transparent 60%)' }} />
            <p className="text-dp-text2 text-sm mb-1 relative z-10">Available Balance</p>
            <p className="text-[2.4rem] font-display font-black relative z-10">
              {fmtEth(stats?.balanceEth ?? 0)}
              <span className="text-dp-text2 text-lg font-normal ml-2">ETH</span>
            </p>
            <p className="text-dp-text3 text-xs font-mono mt-1 relative z-10">{user?.walletAddress}</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Total Sent"     value={fmtEth(stats?.sentEth     ?? 0)} icon="↑" color="#ff6b9d" />
            <StatCard label="Total Received" value={fmtEth(stats?.receivedEth ?? 0)} icon="↓" color="#00d4aa" />
            <StatCard label="Transactions"   value={stats?.count ?? 0} unit="txs" icon="⟳" color="#6c63ff" />
          </div>
        </>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="font-display font-bold mb-3">Quick Actions</h3>
        <div className="grid grid-cols-4 gap-3">
          <QuickAction to="/send"    icon="↑" label="Send"    color="#6c63ff" />
          <QuickAction to="/split"   icon="⊗" label="Split"   color="#ff6b9d" />
          <QuickAction to="/qr"      icon="▣" label="QR Pay"  color="#00d4aa" />
          <QuickAction to="/history" icon="◷" label="History" color="#ffb703" />
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-display font-bold">Recent Transactions</h3>
          <Link to="/history" className="text-dp-accent text-[0.82rem] hover:underline">View all →</Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><span className="spinner-accent" /></div>
        ) : txs.length === 0 ? (
          <div className="card text-center py-10 text-dp-text2">
            <div className="text-4xl mb-2">🌐</div>
            <p>No transactions yet. Send your first payment!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {txs.map(tx => {
              const dir    = txDir(tx);
              const ds     = dirStyle(dir);
              const amtWei = tx.type === 'split' ? tx.totalAmountWei : tx.amountWei;
              return (
                <div key={tx._id} className="flex items-center gap-3 px-3 py-3.5 rounded-[12px] hover:bg-dp-surface transition-colors">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${ds.bg} ${ds.color}`}>
                    {ds.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[0.88rem]">
                      {dir === 'sent'
                        ? `→ @${tx.recipientUsername || shortAddr(tx.recipientAddress)}`
                        : dir === 'received'
                        ? `← @${tx.senderUsername || shortAddr(tx.senderAddress)}`
                        : `Split (${tx.splits?.length || 0} recipients)`}
                    </p>
                    <p className="text-dp-text2 text-[0.73rem] mt-0.5">{fmtDate(tx.createdAt)}</p>
                    {tx.note && <p className="text-dp-text3 text-[0.72rem] italic">"{tx.note}"</p>}
                  </div>
                  <span className={`font-display font-bold text-[0.9rem] whitespace-nowrap ${dir === 'received' ? 'text-dp-accent2' : 'text-dp-accent3'}`}>
                    {dir === 'received' ? '+' : '-'}{weiToEth(amtWei)} ETH
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}