import React, { useState, useEffect } from 'react';
import { RefreshCw, Database, CheckCircle2, Cloud, Sparkles, Smartphone } from 'lucide-react';
import { useProperties } from '../../context/PropertyContext';
import { useLanguage } from '../../context/LanguageContext';

export const SyncStatusBar: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isNeonConnected, isDatabaseSyncing, lastDbSyncTimestamp, syncWithDatabase } = useProperties();
  const { isAmharic } = useLanguage();
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Update seconds ago and countdown
  useEffect(() => {
    const timer = setInterval(() => {
      const diffSec = Math.max(0, Math.floor((Date.now() - lastDbSyncTimestamp) / 1000));
      setSecondsAgo(diffSec);
      setCountdown(prev => (prev <= 1 ? 3 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [lastDbSyncTimestamp]);

  const handleManualSync = async () => {
    const res = await syncWithDatabase();
    setCountdown(3);
    setSyncFeedback(res.success ? (isAmharic ? 'ተመሳስሏል' : 'Synced!') : 'Retried');
    setTimeout(() => setSyncFeedback(null), 2500);
  };

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-slate-700 text-[11px] font-bold">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-emerald-800 font-extrabold flex items-center gap-1">
          <Database className="w-3 h-3 text-emerald-600" />
          <span>Auto-Sync: {countdown}s</span>
        </span>
        <button
          onClick={handleManualSync}
          disabled={isDatabaseSyncing}
          title="Force Database Sync across all devices"
          className="ml-1 p-0.5 hover:bg-emerald-200/60 rounded-full transition-colors text-emerald-700 cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${isDatabaseSyncing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-white px-3 sm:px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-extrabold text-emerald-400 flex items-center gap-1">
            <Cloud className="w-3.5 h-3.5" />
            <span>Neon PostgreSQL Cloud</span>
          </span>
        </div>

        <span className="text-slate-600 hidden sm:inline">•</span>

        <div className="flex items-center gap-1.5 text-slate-300">
          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
          <span>
            {isAmharic ? 'በሁሉም መሣሪያዎች የቀጥታ ማመሳሰል' : 'Cross-Device Live Sync'}
          </span>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-sm font-mono border border-emerald-500/30">
            Every 3s (in {countdown}s)
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-slate-400 text-[11px] hidden md:inline">
          {secondsAgo === 0 ? 'Just synced' : `Synced ${secondsAgo}s ago`}
        </span>

        {syncFeedback && (
          <span className="text-emerald-400 font-bold text-[11px] animate-in fade-in flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{syncFeedback}</span>
          </span>
        )}

        <button
          onClick={handleManualSync}
          disabled={isDatabaseSyncing}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer text-[11px] font-bold"
        >
          <RefreshCw className={`w-3 h-3 text-emerald-400 ${isDatabaseSyncing ? 'animate-spin' : ''}`} />
          <span>{isDatabaseSyncing ? 'Syncing...' : 'Sync Now'}</span>
        </button>
      </div>
    </div>
  );
};
