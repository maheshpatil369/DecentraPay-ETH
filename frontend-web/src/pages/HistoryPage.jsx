import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuth }    from '../context/AuthContext';
import { paymentAPI } from '../services/api';
import { weiToEth, fmtDate, shortAddr } from '../utils/format';

const DIR_CONFIG = {
  sent:     { icon: '↑', bg: 'bg-dp-accent3/10', color: 'text-dp-accent3', badge: 'bg-dp-accent3/10 text-dp-accent3' },
  received: { icon: '↓', bg: 'bg-dp-accent2/10', color: 'text-dp-accent2', badge: 'bg-dp-accent2/10 text-dp-accent2' },
  split:    { icon: '⊗', bg: 'bg-dp-accent/10',  color: 'text-dp-accent',  badge: 'bg-dp-accent/10 text-dp-accent'   },
};

export default function HistoryPage() {
  const { user }  = useAuth();
  const [txs,     setTxs]     = useState([]);
  const [page,    setPage]     = useState(1);
  const [pages,   setPages]    = useState(1);
  const [total,   setTotal]    = useState(0);
  const [loading, setLoading]  = useState(true);
  const [filter,  setFilter]   = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await paymentAPI.getHistory(page);
      setTxs(res.data.transactions);
      setPages(res.data.pages);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load history'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const txDir = (tx) => {
    if (tx.type === 'split') return 'split';
    return tx.senderAddress?.toLowerCase() === user?.walletAddress?.toLowerCase() ? 'sent' : 'received';
  };

  const txAmount = (tx, dir) => {
    const wei = tx.type === 'split' ? tx.totalAmountWei : tx.amountWei;
    const eth = weiToEth(wei);
    const prefix = dir === 'received' ? '+' : '-';
    return `${prefix}${eth} ETH`;
  };

  const filtered = filter === 'all' ? txs : txs.filter(tx => txDir(tx) === filter);

  return (
    <div className="max-w-2xl flex flex-col gap-6 fade-up">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h2 className="text-[1.7rem] font-display font-bold">History</h2>
          <p className="text-dp-text2 text-sm mt-1">{total} total transactions</p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['all','sent','received','split'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-[0.78rem] font-semibold capitalize border transition-colors
                ${filter === f ? 'bg-dp-accent border-dp-accent text-white' : 'border-white/[0.07] text-dp-text2 hover:border-dp-accent hover:text-dp-text'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><span className="spinner-accent" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12 text-dp-text2">
          <div className="text-4xl mb-3">📭</div>
          <p>No transactions found</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {filtered.map(tx => {
            const dir  = txDir(tx);
            const dc   = DIR_CONFIG[dir];
            const amt  = txAmount(tx, dir);
            return (
              <div key={tx._id}
                className="flex items-start gap-3 px-4 py-3.5 rounded-[14px] border border-transparent hover:bg-dp-surface hover:border-white/[0.07] transition-all">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 mt-0.5 ${dc.bg} ${dc.color}`}>
                  {dc.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[0.9rem]">
                      {dir === 'sent'
                        ? `→ @${tx.recipientUsername || shortAddr(tx.recipientAddress)}`
                        : dir === 'received'
                        ? `← @${tx.senderUsername || shortAddr(tx.senderAddress)}`
                        : `Split · ${tx.splits?.length || 0} recipients`}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${dc.badge}`}>{dir}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full
                      ${tx.status === 'confirmed' ? 'bg-dp-success/10 text-dp-success' : 'bg-dp-danger/10 text-dp-danger'}`}>
                      {tx.status}
                    </span>
                  </div>
                  {tx.note && <p className="text-dp-text3 text-[0.75rem] italic mt-0.5">"{tx.note}"</p>}
                  <div className="flex items-center gap-3 mt-1 text-[0.72rem] text-dp-text3 flex-wrap">
                    <span>{fmtDate(tx.createdAt)}</span>
                    {tx.txHash && (
                      <span className="font-mono bg-dp-bg2 px-1.5 py-0.5 rounded text-[0.68rem]" title={tx.txHash}>
                        {shortAddr(tx.txHash)}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`font-display font-bold text-[0.9rem] whitespace-nowrap mt-0.5 flex-shrink-0
                  ${dir === 'received' ? 'text-dp-accent2' : 'text-dp-accent3'}`}>
                  {amt}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <button className="btn-secondary px-4 py-2 text-sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>← Prev</button>
          <span className="text-dp-text2 text-sm">{page} / {pages}</span>
          <button className="btn-secondary px-4 py-2 text-sm" onClick={() => setPage(p => p + 1)} disabled={page >= pages}>Next →</button>
        </div>
      )}
    </div>
  );
}
