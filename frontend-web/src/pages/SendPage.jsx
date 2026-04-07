import React, { useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { userAPI, paymentsAPI, qrAPI } from '../services/api';
import UserAvatar from '../components/Shared/UserAvatar';
import { normaliseUsername, isValidEthAddress, shortAddr } from '../utils/format';
import { QRCodeSVG } from 'qrcode.react';

const STEP = { ENTER: 'enter', CONFIRM: 'confirm', SUCCESS: 'success' };
const MODE = { USERNAME: 'username', ADDRESS: 'address', QR: 'qr' };

export default function SendPage() {
  const [step,      setStep]      = useState(STEP.ENTER);
  const [mode,      setMode]      = useState(MODE.USERNAME);
  const [recipient, setRecipient] = useState(null);
  const [resolving, setResolving] = useState(false);
  const [sending,   setSending]   = useState(false);
  const [scanning,  setScanning]  = useState(false);
  const [form, setForm] = useState({ username: '', address: '', amountEth: '', message: '', senderPrivateKey: '' });
  const [amountLocked, setAmountLocked] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const debounce  = useRef(null);
  const html5Ref  = useRef(null);
  const fileRef   = useRef(null);
  const qrWrapRef = useRef(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const me = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('dp_user') || 'null'); } catch { return null; }
  }, []);

  const qrValue = useMemo(() => JSON.stringify({
    username: me?.username,
  }), [me?.username]);

  const parseUsernameFromQR = (raw) => {
    if (!raw || typeof raw !== 'string') throw new Error('Invalid QR');
    let parsed;
    try { parsed = JSON.parse(raw); } catch { throw new Error('Invalid QR JSON'); }
    const username = String(parsed?.username || '').toLowerCase().replace(/^@/, '').trim();
    if (!username) throw new Error('QR missing username');
    return username;
  };

  const resolveUserFromQR = async (raw) => {
    try {
      const username = parseUsernameFromQR(raw);
      const res = await qrAPI.resolveUser(username);
      const { walletAddress } = res.data.user || {};
      if (!walletAddress || !isValidEthAddress(walletAddress)) throw new Error('Invalid wallet resolved from QR');

      // Keep UX consistent with @mention style by selecting user mode.
      setMode(MODE.USERNAME);
      set('username', `@${username}`);
      set('address', walletAddress);
      setRecipient({ walletAddress, fullName: 'QR User', username });
      setAmountLocked(false);
      toast.success(`Selected @${username} from QR`);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Invalid QR');
    }
  };

  // ── Username lookup ────────────────────────────────────────────────
  const onUsernameChange = (val) => {
    set('username', val);
    setRecipient(null);
    clearTimeout(debounce.current);
    const q = normaliseUsername(val);
    if (q.length < 2) return;
    debounce.current = setTimeout(async () => {
      setResolving(true);
      try { setRecipient((await userAPI.getByUsername(q)).data.user); }
      catch { setRecipient(null); }
      finally { setResolving(false); }
    }, 450);
  };

  // ── Address lookup ─────────────────────────────────────────────────
  const onAddressBlur = async () => {
    if (!isValidEthAddress(form.address)) return;
    setResolving(true);
    try {
      const res = await userAPI.getByAddress(form.address);
      setRecipient(res.data.user);
    } catch {
      setRecipient({ walletAddress: form.address, fullName: 'External Wallet', username: null });
    } finally { setResolving(false); }
  };

  // ── QR scanner ─────────────────────────────────────────────────────
  const startScan = async () => {
    setScanning(true);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      html5Ref.current = new Html5Qrcode('send-qr-reader');
      await html5Ref.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (text) => {
          stopScan();
          resolveUserFromQR(text);
        },
        () => {}
      );
    } catch {
      toast.error('Camera not accessible. Please allow camera permissions.');
      setScanning(false);
    }
  };

  const stopScan = async () => {
    try { if (html5Ref.current) { await html5Ref.current.stop(); html5Ref.current = null; } }
    catch {}
    setScanning(false);
  };

  const onUploadQR = async (file) => {
    if (!file) return;
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const tmp = new Html5Qrcode('send-qr-file-reader');
      const text = await tmp.scanFile(file, true);
      try { await tmp.clear(); } catch {}
      await resolveUserFromQR(text);
    } catch {
      toast.error('Could not read QR image');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const downloadQR = async () => {
    try {
      const svg = qrWrapRef.current?.querySelector('svg');
      if (!svg) return toast.error('QR not ready');
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => {
          if (!blob) return toast.error('Download failed');
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'decentrapay-qr.png';
          a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 2500);
        }, 'image/png');
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        toast.error('Download failed');
      };
      img.src = url;
    } catch {
      toast.error('Download failed');
    }
  };

  // ── Continue ───────────────────────────────────────────────────────
  const onContinue = (e) => {
    e.preventDefault();
    if (mode === MODE.USERNAME && !recipient)                  return toast.error('User not found');
    if (mode === MODE.ADDRESS && !isValidEthAddress(form.address)) return toast.error('Invalid Ethereum address');
    if (!form.amountEth || +form.amountEth <= 0)               return toast.error('Enter a valid amount');
    if (mode === MODE.ADDRESS && !recipient)
      setRecipient({ walletAddress: form.address, fullName: 'External Wallet', username: null });
    setStep(STEP.CONFIRM);
  };

  // ── Confirm & send ─────────────────────────────────────────────────
  const onConfirm = async () => {
    setSending(true);
    try {
      const receiverAddress =
        mode === MODE.USERNAME ? recipient?.walletAddress : recipient?.walletAddress;
      if (!receiverAddress || !isValidEthAddress(receiverAddress)) throw new Error('Invalid receiver address');

      await paymentsAPI.send({
        receiverAddress,
        amountEth: form.amountEth,
        message: form.message,
        ...(form.senderPrivateKey?.trim() ? { senderPrivateKey: form.senderPrivateKey.trim() } : {}),
      });
      toast.success(`Sent ${form.amountEth} ETH successfully!`);
      setStep(STEP.SUCCESS);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Payment failed');
      setStep(STEP.ENTER);
    } finally { setSending(false); }
  };

  const reset = () => {
    setStep(STEP.ENTER); setMode(MODE.USERNAME); setRecipient(null);
    setForm({ username: '', address: '', amountEth: '', message: '', senderPrivateKey: '' });
    stopScan();
    setAmountLocked(false);
  };

  // ── SUCCESS ────────────────────────────────────────────────────────
  if (step === STEP.SUCCESS) return (
    <div className="max-w-md fade-up">
      <div className="card flex flex-col items-center text-center gap-4 py-12">
        <div className="w-16 h-16 rounded-full border-2 border-dp-success bg-dp-success/10 flex items-center justify-center text-2xl text-dp-success">✓</div>
        <h2 className="text-[1.5rem] font-display font-bold">Payment Sent!</h2>
        <p className="text-dp-text2">You sent <strong className="text-dp-text">{form.amountEth} ETH</strong> to</p>
        <div className="flex items-center gap-3 bg-dp-bg2 px-4 py-3 rounded-[14px] w-full">
          {recipient?.username
            ? <><UserAvatar user={recipient} size={44} /><div className="text-left"><p className="font-semibold">{recipient.fullName}</p><p className="text-dp-text2 text-sm">@{recipient.username}</p></div></>
            : <><div className="w-11 h-11 rounded-full bg-dp-accent/20 flex items-center justify-center text-dp-accent text-xl flex-shrink-0">◎</div><p className="font-mono text-sm text-dp-text2 break-all text-left">{recipient?.walletAddress}</p></>
          }
        </div>
        <button className="btn-primary w-full" onClick={reset}>Send Another</button>
      </div>
    </div>
  );

  // ── CONFIRM ────────────────────────────────────────────────────────
  if (step === STEP.CONFIRM) return (
    <div className="max-w-md fade-up">
      <div className="card flex flex-col gap-5">
        <h2 className="text-[1.5rem] font-display font-bold">Confirm Payment</h2>
        <div>
          <p className="input-label">Sending to</p>
          <div className="flex items-center gap-3 bg-dp-bg2 px-4 py-3 rounded-[14px]">
            {recipient?.username
              ? <><UserAvatar user={recipient} size={48} /><div><p className="font-semibold">{recipient.fullName}</p><p className="text-dp-accent text-sm">@{recipient.username}</p></div></>
              : <><div className="w-12 h-12 rounded-full bg-dp-accent/20 flex items-center justify-center text-dp-accent text-xl flex-shrink-0">◎</div><p className="font-mono text-sm break-all">{recipient?.walletAddress}</p></>
            }
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[3rem] font-display font-black">{form.amountEth}</span>
          <span className="text-dp-text2 text-xl">ETH</span>
        </div>
        {form.message && <p className="text-dp-text2 italic text-sm">"{form.message}"</p>}
        <div className="flex gap-3 pt-2">
          <button className="btn-secondary flex-1" onClick={() => setStep(STEP.ENTER)}>← Edit</button>
          <button className="btn-success flex-[2]" onClick={onConfirm} disabled={sending}>
            {sending ? <span className="spinner" /> : 'Confirm & Send'}
          </button>
        </div>
      </div>
    </div>
  );

  // ── ENTER ──────────────────────────────────────────────────────────
  return (
    <div className="max-w-md fade-up">
      <h2 className="text-[1.7rem] font-display font-bold mb-1">Send Payment</h2>
      <p className="text-dp-text2 text-sm mb-5">Send ETH by username, wallet address, or QR scan</p>

      {/* Mode tabs */}
      <div className="flex gap-0.5 bg-dp-bg2 rounded-[14px] p-1 border border-white/[0.07] mb-5">
        {[[MODE.USERNAME,'@ Username'],[MODE.ADDRESS,'◎ Address'],[MODE.QR,'▣ QR Scan']].map(([m,label]) => (
          <button key={m} onClick={() => { setMode(m); setRecipient(null); stopScan(); }}
            className={`flex-1 py-2 rounded-[10px] text-[0.82rem] font-semibold transition-all ${mode === m ? 'bg-dp-surface text-dp-text shadow-sm' : 'text-dp-text2 hover:text-dp-text'}`}>
            {label}
          </button>
        ))}
      </div>

      <form className="card flex flex-col gap-5" onSubmit={onContinue}>

        {/* USERNAME */}
        {mode === MODE.USERNAME && (
          <div>
            <label className="input-label">Recipient Username</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dp-accent font-bold text-sm">@</span>
              <input className="input-field pl-7" value={form.username}
                onChange={e => onUsernameChange(e.target.value)} placeholder="username" autoComplete="off" />
            </div>
            {resolving && <div className="flex items-center gap-2 text-dp-text2 text-sm mt-2"><span className="spinner-accent w-3.5 h-3.5" /> Looking up…</div>}
            {!resolving && recipient && (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] border border-dp-success/25 bg-dp-success/5 mt-2 fade-up">
                <UserAvatar user={recipient} size={36} />
                <div className="flex-1"><p className="font-semibold text-sm">{recipient.fullName}</p><p className="text-dp-text2 text-xs">@{recipient.username}</p></div>
                <span className="w-5 h-5 rounded-full bg-dp-success flex items-center justify-center text-black text-xs font-bold">✓</span>
              </div>
            )}
            {!resolving && form.username.length > 1 && !recipient && (
              <p className="text-dp-danger text-sm mt-1">User not found</p>
            )}
          </div>
        )}

        {/* ADDRESS */}
        {mode === MODE.ADDRESS && (
          <div>
            <label className="input-label">Wallet Address</label>
            <div className="flex gap-2">
              <input className="input-field font-mono text-xs flex-1" value={form.address}
                onChange={e => { set('address', e.target.value); setRecipient(null); }}
                onBlur={onAddressBlur} placeholder="0x..." />
              <button type="button" className="btn-secondary px-3 text-sm flex-shrink-0"
                onClick={async () => {
                  const t = await navigator.clipboard.readText().catch(() => '');
                  if (t) { set('address', t); setRecipient(null); }
                }}>
                📋 Paste
              </button>
            </div>
            {form.address.length > 5 && !isValidEthAddress(form.address) && (
              <p className="text-dp-danger text-xs mt-1">Invalid Ethereum address</p>
            )}
            {resolving && <div className="flex items-center gap-2 text-dp-text2 text-sm mt-2"><span className="spinner-accent w-3.5 h-3.5" /> Looking up…</div>}
            {!resolving && recipient && isValidEthAddress(form.address) && (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] border border-dp-success/25 bg-dp-success/5 mt-2 fade-up">
                {recipient.username
                  ? <><UserAvatar user={recipient} size={32} /><div><p className="font-semibold text-sm">{recipient.fullName}</p><p className="text-dp-text2 text-xs">@{recipient.username}</p></div></>
                  : <><div className="w-8 h-8 rounded-full bg-dp-accent/20 flex items-center justify-center text-dp-accent text-sm flex-shrink-0">◎</div><p className="text-dp-text2 text-xs font-mono">External wallet</p></>
                }
                <span className="ml-auto w-5 h-5 rounded-full bg-dp-success flex items-center justify-center text-black text-xs font-bold">✓</span>
              </div>
            )}
          </div>
        )}

        {/* QR */}
        {mode === MODE.QR && (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              className="btn-secondary w-full"
              onClick={() => setQrOpen(true)}
              disabled={!me?.username}
            >
              ▣ Generate My QR (username)
            </button>

            <button type="button" className="btn-primary w-full" onClick={startScan} disabled={scanning}>
              📷 Scan using Camera
            </button>

            <button type="button" className="btn-secondary w-full" onClick={() => fileRef.current?.click()}>
              📤 Upload QR Image
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onUploadQR(e.target.files?.[0])}
            />

            {scanning && (
              <>
                <div id="send-qr-reader" className="w-full rounded-[14px] overflow-hidden border border-white/[0.07]" />
                <button type="button" className="btn-secondary w-full" onClick={stopScan}>✕ Cancel</button>
              </>
            )}
            <div id="send-qr-file-reader" className="hidden" />

            {(isValidEthAddress(form.address) || recipient) && (
              <div className="rounded-[14px] bg-dp-bg2 border border-white/[0.07] p-3">
                <p className="text-dp-text2 text-sm font-semibold mb-1">Resolved from QR</p>
                {recipient?.username && (
                  <p className="text-dp-accent font-semibold">@{recipient.username}</p>
                )}
                <p className="font-mono text-xs text-dp-text3 break-all">
                  {shortAddr(form.address || recipient?.walletAddress)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Amount */}
        <div>
          <label className="input-label">Amount (ETH)</label>
          <input className="input-field" type="number" step="0.0001" min="0.0001"
            value={form.amountEth} onChange={e => set('amountEth', e.target.value)} placeholder="0.1" required
            disabled={amountLocked}
          />
          {amountLocked && <p className="text-dp-text3 text-[11px] mt-1">Amount fixed by QR</p>}
        </div>

        {/* Note */}
        <div>
          <label className="input-label">Note <span className="text-dp-text3 font-normal normal-case">(optional)</span></label>
          <input className="input-field" value={form.message}
            onChange={e => set('message', e.target.value)} placeholder="Dinner, rent…" maxLength={256} />
        </div>

        {/* Private key (optional override) */}
        <div>
          <label className="input-label">Private Key <span className="text-dp-text3 font-normal normal-case">(optional)</span></label>
          <input
            className="input-field font-mono text-xs"
            type="password"
            value={form.senderPrivateKey}
            onChange={e => set('senderPrivateKey', e.target.value)}
            placeholder="0x..."
          />
          <p className="text-dp-text3 text-[11px] mt-1">Leave empty to use the private key saved on your account</p>
        </div>

        <button type="submit" className="btn-primary w-full"
          disabled={
            (mode === MODE.USERNAME && !recipient) ||
            (mode === MODE.ADDRESS  && !isValidEthAddress(form.address)) ||
            (mode === MODE.QR       && !recipient)
          }>
          Continue →
        </button>
      </form>

      {/* Simple QR modal */}
      {qrOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button className="absolute inset-0 bg-black/70" onClick={() => setQrOpen(false)} aria-label="Close" />
          <div className="relative w-full max-w-md card fade-up">
            <h3 className="font-display font-bold text-[1.1rem] mb-3">My QR (username)</h3>
            <div className="flex flex-col items-center gap-4">
              <div ref={qrWrapRef} className="p-5 rounded-[14px] bg-white/[0.03] border border-white/[0.07]">
                <QRCodeSVG value={qrValue} size={220} bgColor="transparent" fgColor="#f0f0ff" level="H" includeMargin={false} />
              </div>
              <p className="text-dp-accent font-semibold">@{me?.username}</p>
              <p className="font-mono text-[11px] text-dp-text3 break-all">{qrValue}</p>
              <div className="flex gap-2 w-full">
                <button className="btn-secondary flex-1" onClick={() => setQrOpen(false)}>Close</button>
                <button className="btn-primary flex-1" onClick={downloadQR}>⬇ Download PNG</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}