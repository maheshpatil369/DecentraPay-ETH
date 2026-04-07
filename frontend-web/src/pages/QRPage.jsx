import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

// html5-qrcode is loaded dynamically to avoid SSR issues
let Html5Qrcode;

export default function QRPage() {
  const { user } = useAuth();
  const [tab,      setTab]      = useState('show');
  const [scanning, setScanning] = useState(false);
  const [scanned,  setScanned]  = useState(null);
  const scannerRef = useRef(null);
  const html5Ref   = useRef(null);

  const qrValue = JSON.stringify({
    app: 'decentrapay',
    username:      user?.username,
    walletAddress: user?.walletAddress,
    name:          user?.fullName,
  });

  const startScan = async () => {
    setScanning(true);
    setScanned(null);
    try {
      const { Html5Qrcode: H } = await import('html5-qrcode');
      Html5Qrcode = H;
      html5Ref.current = new Html5Qrcode('dp-qr-reader');
      await html5Ref.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (text) => {
          stopScan();
          try { setScanned(JSON.parse(text)); }
          catch { setScanned({ raw: text }); }
        },
        () => {} // on error — ignore frame errors
      );
    } catch {
      toast.error('Camera not accessible. Allow camera permissions.');
      setScanning(false);
    }
  };

  const stopScan = async () => {
    try { if (html5Ref.current) { await html5Ref.current.stop(); html5Ref.current = null; } }
    catch {}
    setScanning(false);
  };

  useEffect(() => () => { stopScan(); }, []);

  return (
    <div className="max-w-md flex flex-col gap-6 fade-up">
      <div>
        <h2 className="text-[1.7rem] font-display font-bold">QR Payments</h2>
        <p className="text-dp-text2 text-sm mt-1">Show your QR to receive, or scan to pay</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 bg-dp-bg2 rounded-[14px] p-1 border border-white/[0.07]">
        {[['show','▣ My QR Code'], ['scan','◎ Scan QR']].map(([t, label]) => (
          <button key={t} onClick={() => { setTab(t); stopScan(); setScanned(null); }}
            className={`flex-1 py-2.5 rounded-[10px] text-sm font-semibold transition-all ${tab === t ? 'bg-dp-surface text-dp-text shadow-sm' : 'text-dp-text2 hover:text-dp-text'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Show My QR */}
      {tab === 'show' && (
        <div className="card flex flex-col items-center gap-5">
          <div className="p-5 rounded-[14px] bg-white/[0.03] border border-white/[0.07]">
            <QRCodeSVG value={qrValue} size={200} bgColor="transparent" fgColor="#f0f0ff" level="H" includeMargin={false} />
          </div>
          <div className="text-center">
            <p className="text-[1.3rem] font-display font-bold text-dp-accent">@{user?.username}</p>
            <p className="text-dp-text mt-1">{user?.fullName}</p>
            <p className="font-mono text-[0.72rem] text-dp-text3 mt-1 break-all">{user?.walletAddress}</p>
          </div>
          <button className="btn-secondary w-full" onClick={() => { navigator.clipboard.writeText(user?.walletAddress || ''); toast.success('Address copied!'); }}>
            📋 Copy Wallet Address
          </button>
        </div>
      )}

      {/* Scan QR */}
      {tab === 'scan' && (
        <div className="card flex flex-col items-center gap-4">
          {!scanning && !scanned && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <span className="text-6xl text-dp-accent">◎</span>
              <p className="text-dp-text2 text-sm">Point camera at a DecentraPay QR code</p>
              <button className="btn-primary" onClick={startScan}>Start Camera</button>
            </div>
          )}

          {/* QR Reader mount point */}
          <div id="dp-qr-reader" ref={scannerRef}
            className={`w-full rounded-[14px] overflow-hidden ${scanning ? 'block' : 'hidden'}`} />

          {scanning && (
            <button className="btn-secondary w-full" onClick={stopScan}>✕ Cancel Scan</button>
          )}

          {scanned && (
            <div className="w-full flex flex-col items-center gap-3 text-center py-2 fade-up">
              <div className="w-14 h-14 rounded-full border-2 border-dp-success bg-dp-success/10 flex items-center justify-center text-xl text-dp-success">✓</div>
              {scanned.username ? (
                <>
                  <p className="text-lg font-display font-bold">{scanned.name}</p>
                  <p className="text-dp-accent font-semibold">@{scanned.username}</p>
                  <p className="font-mono text-[0.72rem] text-dp-text3 break-all">{scanned.walletAddress}</p>
                  <a href={`/send?to=${scanned.username}`} className="btn-primary w-full">Send Payment →</a>
                </>
              ) : (
                <p className="text-dp-text2 break-all text-sm">{scanned.raw}</p>
              )}
              <button className="btn-secondary w-full" onClick={() => setScanned(null)}>Scan Again</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
