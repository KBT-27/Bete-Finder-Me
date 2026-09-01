import React, { useState, useEffect } from 'react';
import { RefreshCw, Database, CheckCircle2, Cloud, Smartphone, Sliders, Clock, ChevronDown } from 'lucide-react';
import { useProperties } from '../../context/PropertyContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const SyncStatusBar: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { user, role } = useAuth();
  const { 
    isNeonConnected, 
    isDatabaseSyncing, 
    lastDbSyncTimestamp, 
    syncWithDatabase, 
    syncIntervalSeconds, 
    setSyncIntervalSeconds 
  } = useProperties();
  const { isAmharic } = useLanguage();

  const [secondsAgo, setSecondsAgo] = useState(0);
  const [countdown, setCountdown] = useState(syncIntervalSeconds);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [showIntervalMenu, setShowIntervalMenu] = useState(false);
  const [customIntervalInput, setCustomIntervalInput] = useState<string>('');

  // ONLY visible to Owner (per user explicit requirement)
  const isOwner = user?.role === 'owner' || role === 'owner';

  // Update countdown & sync timers
  useEffect(() => {
    setCountdown(syncIntervalSeconds);
  }, [syncIntervalSeconds, lastDbSyncTimestamp]);

  useEffect(() => {
    const timer = setInterval(() => {
      const diffSec = Math.max(0, Math.floor((Date.now() - lastDbSyncTimestamp) / 1000));
      setSecondsAgo(diffSec);
      setCountdown(prev => (prev <= 1 ? syncIntervalSeconds : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [lastDbSyncTimestamp, syncIntervalSeconds]);

  if (!isOwner) {
    return null;
  }

  const handleManualSync = async () => {
    const res = await syncWithDatabase();
    setCountdown(syncIntervalSeconds);
    setSyncFeedback(res.success ? (isAmharic ? 'ተመሳስሏል' : 'Synced!') : 'Retried');
    setTimeout(() => setSyncFeedback(null), 2500);
  };

  const handleSelectInterval = (sec: number) => {
    setSyncIntervalSeconds(sec);
    setCountdown(sec);
    setShowIntervalMenu(false);
    setSyncFeedback(isAmharic ? `${sec}ሰ ተቀናብሯል` : `Interval: ${sec}s`);
    setTimeout(() => setSyncFeedback(null), 2500);
  };

  const handleCustomIntervalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customIntervalInput, 10);
    if (!isNaN(val) && val >= 1 && val <= 300) {
      handleSelectInterval(val);
      setCustomIntervalInput('');
    }
  };

  const intervalPresets = [
    { label: '1s (Turbo)', value: 1 },
    { label: '2s (Fast)', value: 2 },
    { label: '3s (Default)', value: 3 },
    { label: '5s', value: 5 },
    { label: '10s', value: 10 },
    { label: '15s', value: 15 },
    { label: '30s', value: 30 },
    { label: '60s', value: 60 },
  ];

  if (compact) {
    return (
      <div className="relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-slate-700 text-[11px] font-bold">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <button
          onClick={() => setShowIntervalMenu(!showIntervalMenu)}
          className="text-emerald-800 font-extrabold flex items-center gap-1 hover:underline cursor-pointer"
          title="Click to adjust auto-sync time"
        >
          <Database className="w-3 h-3 text-emerald-600" />
          <span>Auto-Sync: {countdown}s ({syncIntervalSeconds}s)</span>
          <ChevronDown className="w-2.5 h-2.5 opacity-60" />
        </button>
        <button
          onClick={handleManualSync}
          disabled={isDatabaseSyncing}
          title="Force Database Sync across all devices"
          className="ml-1 p-0.5 hover:bg-emerald-200/60 rounded-full transition-colors text-emerald-700 cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${isDatabaseSyncing ? 'animate-spin' : ''}`} />
        </button>

        {showIntervalMenu && (
          <div className="absolute top-full left-0 mt-2 z-50 w-48 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700 p-2 text-xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
              <span>Sync Frequency</span>
              <Sliders className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="space-y-0.5">
              {intervalPresets.map(preset => (
                <button
                  key={preset.value}
                  onClick={() => handleSelectInterval(preset.value)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    syncIntervalSeconds === preset.value
                      ? 'bg-emerald-500 text-white font-bold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span>{preset.label}</span>
                  {syncIntervalSeconds === preset.value && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-white px-3 sm:px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs relative z-40">
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {/* Database indicator */}
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

        {/* Live sync & countdown */}
        <div className="flex items-center gap-1.5 text-slate-300">
          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
          <span>
            {isAmharic ? 'በሁሉም መሣሪያዎች የቀጥታ ማመሳሰል' : 'Cross-Device Live Sync'}
          </span>

          {/* Interactive Interval Picker Trigger */}
          <div className="relative inline-block">
            <button
              onClick={() => setShowIntervalMenu(!showIntervalMenu)}
              className="inline-flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-emerald-300 px-2 py-0.5 rounded-md font-mono border border-emerald-500/40 hover:border-emerald-400 transition-all cursor-pointer shadow-xs"
              title="Click to adjust auto-sync time interval"
            >
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>Every {syncIntervalSeconds}s (in {countdown}s)</span>
              <Sliders className="w-2.5 h-2.5 text-slate-400 ml-0.5" />
            </button>

            {/* Interval Adjuster Popover Menu */}
            {showIntervalMenu && (
              <div 
                className="absolute top-full left-0 mt-2 w-56 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 p-2.5 text-xs z-50 animate-in fade-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 px-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-400">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{isAmharic ? 'የማመሳሰያ ሰዓት ማስተካከያ' : 'Adjust Sync Interval'}</span>
                  </div>
                  <button 
                    onClick={() => setShowIntervalMenu(false)}
                    className="text-slate-400 hover:text-white text-xs font-bold p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-[10px] text-slate-400 px-1 mb-2 leading-tight">
                  {isAmharic 
                    ? 'በሁሉም መሣሪያዎች ዳታ በስንት ሰኮንድ ውስጥ እንዲመሳሰል ይፈልጋሉ?' 
                    : 'Choose how frequently all devices fetch live changes from Neon DB:'}
                </p>

                <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                  {intervalPresets.map(preset => (
                    <button
                      key={preset.value}
                      onClick={() => handleSelectInterval(preset.value)}
                      className={`text-left px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                        syncIntervalSeconds === preset.value
                          ? 'bg-emerald-600 text-white font-bold ring-1 ring-emerald-400'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <span>{preset.label}</span>
                      {syncIntervalSeconds === preset.value && <CheckCircle2 className="w-3 h-3 text-emerald-200" />}
                    </button>
                  ))}
                </div>

                {/* Custom seconds form */}
                <form onSubmit={handleCustomIntervalSubmit} className="pt-2 border-t border-slate-800">
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">
                    Custom Seconds (1 - 300s):
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={300}
                      value={customIntervalInput}
                      onChange={(e) => setCustomIntervalInput(e.target.value)}
                      placeholder={`${syncIntervalSeconds}s`}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white placeholder:text-slate-500 font-mono focus:ring-1 focus:ring-emerald-400"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      Set
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Relative time indicator */}
        <span className="text-slate-400 text-[11px] hidden md:inline font-mono">
          {secondsAgo === 0 ? 'Just synced' : `Synced ${secondsAgo}s ago`}
        </span>

        {/* Sync feedback notification */}
        {syncFeedback && (
          <span className="text-emerald-400 font-bold text-[11px] animate-in fade-in flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{syncFeedback}</span>
          </span>
        )}

        {/* Manual force sync button */}
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
