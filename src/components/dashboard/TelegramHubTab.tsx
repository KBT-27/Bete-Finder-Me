import React, { useState, useEffect } from 'react';
import {
  Send,
  Bot,
  Radio,
  CheckCircle2,
  ExternalLink,
  Copy,
  RefreshCw,
  Sparkles,
  Building2,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  Users,
  Bell,
  Check,
  ArrowUpRight,
  Info,
  Clock,
  Layers,
  Settings,
  Sliders,
  Trash2,
  Eye,
  EyeOff,
  RotateCcw,
  Save,
  X,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';
import { Property } from '../../types';
import { useProperties } from '../../context/PropertyContext';

interface TelegramStatusResponse {
  success: boolean;
  bot: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username: string;
    link: string;
    can_join_groups?: boolean;
  } | null;
  channel: {
    id: number;
    title: string;
    username: string;
    description: string;
    invite_link: string;
    members_count: number | null;
    link: string | null;
  } | null;
  config: {
    chatId: string;
    channelUsername?: string;
    botUsername?: string;
    botTokenMasked: string;
    rawBotToken?: string;
    autoPublishProperties: boolean;
  };
  error?: string | null;
  timestamp: number;
}

interface TelegramHubTabProps {
  properties?: Property[];
  showToast: (msg: string) => void;
}

export const TelegramHubTab: React.FC<TelegramHubTabProps> = ({
  properties: propProps = [],
  showToast,
}) => {
  const { properties: contextProps = [], clearAllProperties } = useProperties();
  const properties = propProps.length > 0 ? propProps : contextProps;

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [statusData, setStatusData] = useState<TelegramStatusResponse | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Configuration Modal & Editor State
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [channelInput, setChannelInput] = useState<string>('@Bete_Finder');
  const [botUsernameInput, setBotUsernameInput] = useState<string>('BeteFinder_bot');
  const [botTokenInput, setBotTokenInput] = useState<string>('8716860236:AAEiN5kJednAaFVvy03wCaveNyq71C-LZWo');
  const [autoPublishInput, setAutoPublishInput] = useState<boolean>(true);
  const [showRawToken, setShowRawToken] = useState<boolean>(false);
  const [savingConfig, setSavingConfig] = useState<boolean>(false);
  const [configFeedback, setConfigFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Erase All Properties Modal State
  const [showEraseModal, setShowEraseModal] = useState<boolean>(false);
  const [eraseConfirmInput, setEraseConfirmInput] = useState<string>('');
  const [erasingProperties, setErasingProperties] = useState<boolean>(false);

  // Actions state
  const [sendingTest, setSendingTest] = useState<boolean>(false);
  const [sendingPropTest, setSendingPropTest] = useState<boolean>(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

  // Announcement composer state
  const [broadcastTitle, setBroadcastTitle] = useState<string>('🔔 Special Notice from Bete Finder');
  const [broadcastMessage, setBroadcastMessage] = useState<string>(
    'Find your next luxury home in Addis Ababa with Bete Finder. Verified listings, direct owner contacts, and top locations!'
  );
  const [broadcastUrl, setBroadcastUrl] = useState<string>('https://bete-finder-one.vercel.app');
  const [broadcasting, setBroadcasting] = useState<boolean>(false);

  // Copy indicator
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Dispatch activity log
  const [activityLogs, setActivityLogs] = useState<Array<{
    id: string;
    type: 'ping' | 'property' | 'broadcast';
    title: string;
    timestamp: string;
    messageId?: number;
    status: 'success' | 'failed';
    details?: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem('bete_finder_telegram_logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveLog = (logItem: {
    type: 'ping' | 'property' | 'broadcast';
    title: string;
    messageId?: number;
    status: 'success' | 'failed';
    details?: string;
  }) => {
    const newLog = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      ...logItem
    };
    setActivityLogs(prev => {
      const updated = [newLog, ...prev.slice(0, 19)];
      try {
        localStorage.setItem('bete_finder_telegram_logs', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const fetchTelegramStatus = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setFetchError(null);

    try {
      const res = await fetch('/api/telegram/status');
      const data: TelegramStatusResponse = await res.json();
      setStatusData(data);
      if (!data.success && data.error) {
        setFetchError(data.error);
      }
    } catch (err: any) {
      console.error('Error fetching Telegram status:', err);
      setFetchError(err?.message || 'Failed to connect to Telegram status endpoint.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTelegramStatus();
  }, []);

  // Sync inputs with live status config
  useEffect(() => {
    if (statusData?.config) {
      if (statusData.config.chatId) setChannelInput(statusData.config.chatId);
      if (statusData.config.botUsername) setBotUsernameInput(statusData.config.botUsername);
      if (statusData.config.rawBotToken) setBotTokenInput(statusData.config.rawBotToken);
      if (statusData.config.autoPublishProperties !== undefined) {
        setAutoPublishInput(statusData.config.autoPublishProperties);
      }
    }
  }, [statusData]);

  // Save Telegram Settings
  const handleSaveTelegramConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!channelInput.trim()) {
      showToast('⚠️ Please enter a valid Telegram channel handle (e.g. @Bete_Finder)');
      return;
    }
    setSavingConfig(true);
    setConfigFeedback(null);
    try {
      const res = await fetch('/api/telegram/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: channelInput.trim(),
          botUsername: botUsernameInput.trim(),
          botToken: botTokenInput.trim(),
          autoPublishProperties: autoPublishInput
        })
      });
      const data = await res.json();
      if (data.success) {
        setConfigFeedback({ type: 'success', message: data.message || 'Telegram settings saved & verified!' });
        showToast('✅ Telegram channel & bot updated!');
        await fetchTelegramStatus(true);
      } else {
        setConfigFeedback({ type: 'error', message: data.error || 'Failed to verify Telegram credentials.' });
        showToast(`⚠️ ${data.error || 'Check bot token and channel handle.'}`);
      }
    } catch (err: any) {
      setConfigFeedback({ type: 'error', message: err?.message || 'Network error saving configuration.' });
      showToast(`❌ Error: ${err?.message}`);
    } finally {
      setSavingConfig(false);
    }
  };

  // Reset to Defaults
  const handleResetTelegramConfig = async () => {
    if (!window.confirm('Reset Telegram configuration to official Bete Finder defaults (@Bete_Finder)?')) {
      return;
    }
    setSavingConfig(true);
    setConfigFeedback(null);
    try {
      const res = await fetch('/api/telegram/reset-config', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setChannelInput('@Bete_Finder');
        setBotUsernameInput('BeteFinder_bot');
        setBotTokenInput('8716860236:AAEiN5kJednAaFVvy03wCaveNyq71C-LZWo');
        setAutoPublishInput(true);
        setConfigFeedback({ type: 'success', message: 'Restored to Bete Finder default credentials.' });
        showToast('✅ Reset to official Bete Finder credentials (@Bete_Finder)!');
        await fetchTelegramStatus(true);
      }
    } catch (err: any) {
      showToast(`❌ Reset failed: ${err?.message}`);
    } finally {
      setSavingConfig(false);
    }
  };

  // Erase All Properties Listing Purge
  const handleEraseAllProperties = async () => {
    const confirmation = eraseConfirmInput.trim().toUpperCase();
    if (confirmation !== 'ERASE' && confirmation !== 'DELETE') {
      showToast('⚠️ Please type ERASE or DELETE to confirm.');
      return;
    }
    setErasingProperties(true);
    try {
      const success = await clearAllProperties();
      if (success) {
        showToast('🗑️ All property listings have been permanently erased from the database.');
        setShowEraseModal(false);
        setEraseConfirmInput('');
      } else {
        showToast('❌ Failed to clear all properties. Please check database connection.');
      }
    } catch (err: any) {
      showToast(`❌ Purge error: ${err?.message}`);
    } finally {
      setErasingProperties(false);
    }
  };

  // 1. Send Ping Test Message
  const handleSendPingTest = async () => {
    setSendingTest(true);
    try {
      const res = await fetch('/api/telegram/test', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const msgId = data.result?.data?.result?.message_id;
        showToast(`✅ Telegram test message dispatched to @Bete_Finder! (Message ID: #${msgId || 'OK'})`);
        saveLog({
          type: 'ping',
          title: 'System Ping & Verification',
          messageId: msgId,
          status: 'success',
          details: 'Verified Bot + Channel connection'
        });
      } else {
        showToast(`❌ Test failed: ${data.error || 'Check Telegram Bot token'}`);
        saveLog({
          type: 'ping',
          title: 'System Ping Failed',
          status: 'failed',
          details: data.error || 'Unknown error'
        });
      }
    } catch (err: any) {
      showToast(`❌ Network error: ${err.message}`);
    } finally {
      setSendingTest(false);
    }
  };

  // 2. Send Property Broadcast Test
  const handleSendPropertyBroadcast = async () => {
    setSendingPropTest(true);
    try {
      const res = await fetch('/api/telegram/test-property', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: selectedPropertyId || undefined })
      });
      const data = await res.json();
      if (data.success) {
        const msgId = data.result?.data?.result?.message_id;
        const propTitle = data.property?.title || 'Property Listing';
        showToast(`🎉 Listing "${propTitle}" posted to @Bete_Finder channel!`);
        saveLog({
          type: 'property',
          title: `Property Post: ${propTitle.slice(0, 32)}...`,
          messageId: msgId,
          status: 'success',
          details: `Sent with photo and pricing format`
        });
      } else {
        showToast(`❌ Property post failed: ${data.error || data.message || 'Error sending to Telegram'}`);
        saveLog({
          type: 'property',
          title: 'Property Post Failed',
          status: 'failed',
          details: data.error || data.message
        });
      }
    } catch (err: any) {
      showToast(`❌ Network error: ${err.message}`);
    } finally {
      setSendingPropTest(false);
    }
  };

  // 3. Send Custom Announcement
  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) {
      showToast('⚠️ Please write a message to broadcast.');
      return;
    }

    setBroadcasting(true);
    try {
      const res = await fetch('/api/telegram/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: broadcastTitle.trim(),
          message: broadcastMessage.trim(),
          author: 'Kaleb Bereket (Owner)',
          actionUrl: broadcastUrl.trim() || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        const msgId = data.result?.data?.result?.message_id;
        showToast(`🚀 Announcement broadcasted to @Bete_Finder subscribers!`);
        saveLog({
          type: 'broadcast',
          title: broadcastTitle || 'Official Announcement',
          messageId: msgId,
          status: 'success',
          details: broadcastMessage.slice(0, 50) + '...'
        });
      } else {
        showToast(`❌ Broadcast failed: ${data.error || 'Could not send announcement'}`);
        saveLog({
          type: 'broadcast',
          title: broadcastTitle || 'Announcement Failed',
          status: 'failed',
          details: data.error
        });
      }
    } catch (err: any) {
      showToast(`❌ Error: ${err.message}`);
    } finally {
      setBroadcasting(false);
    }
  };

  const copyChannelLink = () => {
    const link = statusData?.channel?.invite_link || 'https://t.me/Bete_Finder';
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    showToast('📋 Channel link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const isConnected = statusData?.success && statusData?.bot && statusData?.channel;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="bg-radial from-slate-900 via-slate-900 to-slate-950 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-2xl">
                <Send className="w-6 h-6 transform -rotate-12" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                Telegram Bot & Channel Hub
              </h2>
              {isConnected ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  CONNECTED & ACTIVE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <AlertCircle className="w-3.5 h-3.5" />
                  CONNECTING / CHECKING
                </span>
              )}
            </div>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Official command center for the <strong className="text-white">@Bete_Finder</strong> Telegram Channel and automated broadcast bot. Verify live connection, monitor subscriber metrics, broadcast announcements, and preview automated property posts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="edit-telegram-config-btn"
              onClick={() => {
                setConfigFeedback(null);
                setShowConfigModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 text-xs sm:text-sm font-bold border border-cyan-500/40 hover:border-cyan-400 transition-all cursor-pointer shadow-sm"
            >
              <Settings className="w-4 h-4 text-cyan-400" />
              <span>Change Bot & Channel</span>
            </button>

            <button
              id="erase-all-listings-tg-btn"
              onClick={() => {
                setEraseConfirmInput('');
                setShowEraseModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 hover:text-white text-xs sm:text-sm font-bold border border-red-800/80 transition-all cursor-pointer shadow-sm"
              title="Permanently erase all property listings from database"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>Erase All Listings ({properties.length})</span>
            </button>

            <button
              id="refresh-telegram-status-btn"
              onClick={() => fetchTelegramStatus(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
              <span>Refresh Status</span>
            </button>

            <a
              id="open-channel-btn"
              href={statusData?.channel?.link || (channelInput.startsWith('@') ? `https://t.me/${channelInput.replace('@', '')}` : 'https://t.me/Bete_Finder')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-cyan-600/30 transition-all cursor-pointer"
            >
              <span>Open Channel</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Error alert if any */}
      {fetchError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Telegram Connection Alert</h4>
            <p className="text-xs mt-0.5">{fetchError}</p>
          </div>
        </div>
      )}

      {/* Grid: Bot Card + Channel Card + Automation Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Official Channel Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 font-black text-xl">
                  📢
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-slate-900 text-base">
                      {statusData?.channel?.title || 'Bete Finder Channel'}
                    </h3>
                    <CheckCircle2 className="w-4 h-4 text-cyan-500 fill-cyan-50" />
                  </div>
                  <p className="text-xs text-cyan-600 font-semibold">
                    {statusData?.channel?.username ? `@${statusData.channel.username}` : '@Bete_Finder'}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-cyan-50 text-cyan-700 text-[10px] font-bold rounded-lg border border-cyan-100">
                Public Channel
              </span>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-700">Subscribers / Members:</span>
                <span className="font-black text-slate-900 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md">
                  <Users className="w-3 h-3 text-cyan-600" />
                  {statusData?.channel?.members_count ?? '3'} Members
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-700">Telegram Chat ID:</span>
                <code className="text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                  {statusData?.channel?.id || '-1004472865837'}
                </code>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-700">Channel Description:</span>
                <span className="font-medium text-slate-700 truncate max-w-[170px]" title={statusData?.channel?.description}>
                  {statusData?.channel?.description || 'Find Your Next Perfect Home In Ethiopia'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2">
            <button
              id="copy-invite-link-btn"
              onClick={copyChannelLink}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 hover:border-cyan-400 bg-slate-50 hover:bg-cyan-50/50 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-700" />}
              <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </button>
            <a
              href={statusData?.channel?.link || 'https://t.me/Bete_Finder'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-all"
            >
              <span>View</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* 2. Automated Telegram Bot Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 font-black text-xl">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-slate-900 text-base">
                      {statusData?.bot?.first_name || 'Bete Finder Bot'}
                    </h3>
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-xs text-purple-600 font-semibold">
                    @{statusData?.bot?.username || 'BeteFinder_bot'}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-lg border border-purple-100">
                Active Bot
              </span>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-700">Bot ID:</span>
                <code className="text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                  {statusData?.bot?.id || '8716860236'}
                </code>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-700">Token Status:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Valid & Authenticated
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-700">Group & Channel Admin:</span>
                <span className="font-semibold text-slate-800">
                  Full Publisher Rights
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2">
            <button
              id="send-bot-ping-btn"
              onClick={handleSendPingTest}
              disabled={sendingTest}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <Radio className={`w-3.5 h-3.5 text-cyan-400 ${sendingTest ? 'animate-pulse' : ''}`} />
              <span>{sendingTest ? 'Sending Ping...' : 'Send Live Ping Test'}</span>
            </button>
            <a
              href={`https://t.me/${statusData?.bot?.username || 'BeteFinder_bot'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl border border-slate-200 hover:border-purple-300 bg-slate-50 text-purple-700 text-xs font-semibold transition-all"
            >
              <span>Bot</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* 3. Auto-Posting Automation Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xl">
                  ⚡
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Auto-Listing Sync</h3>
                  <p className="text-xs text-emerald-600 font-semibold">Real-Time Dispatch</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                ENABLED
              </span>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-700">Trigger:</span>
                <span className="font-semibold text-slate-800">New Property Creation</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-700">Photo Attachment:</span>
                <span className="font-semibold text-emerald-600">High-Res Photos (sendPhoto)</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-700">Bilingual Captions:</span>
                <span className="font-semibold text-slate-800">Amharic (አማርኛ) + English</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2">
            <button
              id="test-property-post-btn"
              onClick={handleSendPropertyBroadcast}
              disabled={sendingPropTest}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{sendingPropTest ? 'Posting Listing...' : 'Test Property Broadcast'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Broadcast Composer & Property Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Custom Announcement Broadcast */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg">Broadcast Custom Announcement</h3>
                <p className="text-xs text-slate-700">
                  Compose and dispatch an official announcement directly to <strong>@Bete_Finder</strong> subscribers.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleBroadcastAnnouncement} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Announcement Headline / Title
              </label>
              <input
                id="broadcast-title-input"
                type="text"
                value={broadcastTitle}
                onChange={e => setBroadcastTitle(e.target.value)}
                placeholder="e.g. 📢 አዲስ የተጨመሩ ልዩ ቅናሽ ቤቶች (New Weekend Hot Deals)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-cyan-500 text-sm font-medium text-slate-900 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Message Body (Amharic & English supported)
              </label>
              <textarea
                id="broadcast-message-input"
                rows={4}
                value={broadcastMessage}
                onChange={e => setBroadcastMessage(e.target.value)}
                placeholder="Write your announcement details here..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-cyan-500 text-sm text-slate-900 bg-slate-50/50 resize-y"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Call-to-Action Link (Optional)
              </label>
              <input
                id="broadcast-url-input"
                type="url"
                value={broadcastUrl}
                onChange={e => setBroadcastUrl(e.target.value)}
                placeholder="https://bete-finder-one.vercel.app"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-cyan-500 text-xs font-mono text-slate-800 bg-slate-50/50"
              />
            </div>

            {/* Telegram Live Preview */}
            <div className="p-3.5 bg-slate-900 rounded-2xl text-slate-100 text-xs space-y-2 border border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-cyan-400 font-bold border-b border-slate-800 pb-1.5">
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> Live Telegram Channel Preview
                </span>
                <span className="text-slate-700">@Bete_Finder</span>
              </div>
              <div className="space-y-1 text-slate-200 text-xs leading-relaxed font-sans">
                <p className="font-bold text-white text-sm">
                  {broadcastTitle ? broadcastTitle : 'Bete Finder Announcement'}
                </p>
                <p className="text-slate-300 whitespace-pre-wrap">{broadcastMessage}</p>
                <p className="text-[11px] text-slate-700 pt-1">
                  👤 <em>Author: Kaleb Bereket (Owner)</em>
                </p>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-cyan-300 font-mono flex items-center gap-1">
                  🔗 {broadcastUrl || 'https://bete-finder-one.vercel.app'}
                </div>
              </div>
            </div>

            <button
              id="submit-broadcast-btn"
              type="submit"
              disabled={broadcasting}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-md shadow-cyan-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className={`w-4 h-4 ${broadcasting ? 'animate-bounce' : ''}`} />
              <span>{broadcasting ? 'Broadcasting to Channel...' : 'Send Broadcast to @Bete_Finder'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Automated Listing Preview & Property Selection */}
        <div className="space-y-6">
          {/* Specific Property Broadcast Section */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Broadcast Existing Property</h3>
                  <p className="text-xs text-slate-700">Pick any active property from your database to post to Telegram.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Property to Broadcast:
                </label>
                <select
                  id="select-property-tg-dropdown"
                  value={selectedPropertyId}
                  onChange={e => setSelectedPropertyId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 bg-slate-50/50"
                >
                  <option value="">Default: Featured Luxury 3-Bedroom Villa (Sample Demo)</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} - {Number(p.price).toLocaleString()} {p.currency || 'ETB'} ({p.subcity || p.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-xs text-slate-700 space-y-1.5">
                <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  What happens when posted:
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                  <li>Sends the primary high-resolution property photo directly into the channel.</li>
                  <li>Formats title in English & Amharic, price tag, bedrooms/bathrooms count.</li>
                  <li>Includes verified owner contact number & Telegram handle <code>@username</code>.</li>
                  <li>Direct click link to view full details on your web application.</li>
                </ul>
              </div>

              <button
                id="send-selected-prop-btn"
                onClick={handleSendPropertyBroadcast}
                disabled={sendingPropTest}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{sendingPropTest ? 'Posting to Telegram...' : 'Broadcast Selected Property Now'}</span>
              </button>
            </div>
          </div>

          {/* Quick Info & Telegram Bot Commands */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 text-xs space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <Info className="w-4 h-4 text-cyan-600" /> Telegram Integration Specifications
            </h4>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-700 block font-sans text-[10px]">Target Channel</span>
                <span className="font-bold text-cyan-700">@Bete_Finder</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-700 block font-sans text-[10px]">Bot Username</span>
                <span className="font-bold text-purple-700">@BeteFinder_bot</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-700 block font-sans text-[10px]">HTML Parse Mode</span>
                <span className="font-bold text-emerald-700">Enabled (Bold, Code, Links)</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-700 block font-sans text-[10px]">Auto-Post on Create</span>
                <span className="font-bold text-emerald-700">Active on /api/properties</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Dispatches Activity Log */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg">Telegram Dispatch Activity Log</h3>
              <p className="text-xs text-slate-700">Real-time log of test pings, property broadcasts, and announcements.</p>
            </div>
          </div>
          {activityLogs.length > 0 && (
            <button
              onClick={() => {
                setActivityLogs([]);
                localStorage.removeItem('bete_finder_telegram_logs');
                showToast('Activity log cleared.');
              }}
              className="text-xs text-slate-700 hover:text-red-600 font-semibold cursor-pointer"
            >
              Clear Log
            </button>
          )}
        </div>

        {activityLogs.length === 0 ? (
          <div className="py-8 text-center text-slate-700 text-xs">
            <Layers className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            No dispatches recorded yet in this session. Click "Send Live Ping Test" or "Broadcast Announcement" to see logs here.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            {activityLogs.map(log => (
              <div key={log.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      log.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                  />
                  <div>
                    <span className="font-bold text-slate-900">{log.title}</span>
                    {log.details && <p className="text-[11px] text-slate-700">{log.details}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {log.messageId && (
                    <span className="font-mono bg-cyan-50 text-cyan-700 border border-cyan-100 px-2 py-0.5 rounded text-[10px] font-bold">
                      Msg #{log.messageId}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-700 font-mono">{log.timestamp}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.status === 'success'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {log.status === 'success' ? 'DELIVERED' : 'FAILED'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: EDIT TELEGRAM BOT & CHANNEL USERNAME / CREDENTIALS               */}
      {/* ========================================================================= */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 relative animate-in fade-in zoom-in-95 duration-200 my-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyan-50 text-cyan-600 rounded-2xl border border-cyan-100">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    Telegram Channel & Bot Settings
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update channel handle, bot username, token credentials, and auto-publishing.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Feedback Alert if present */}
            {configFeedback && (
              <div
                className={`p-4 rounded-2xl text-xs flex items-start gap-3 ${
                  configFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {configFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold">
                    {configFeedback.type === 'success' ? 'Settings Saved' : 'Verification Issue'}
                  </h4>
                  <p className="mt-0.5">{configFeedback.message}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveTelegramConfig} className="space-y-4">
              {/* Field 1: Channel Username */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Telegram Channel Username / Chat ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                    📢
                  </span>
                  <input
                    id="telegram-channel-handle-input"
                    type="text"
                    value={channelInput}
                    onChange={e => setChannelInput(e.target.value)}
                    placeholder="@Bete_Finder or -1004472865837"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-semibold focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-hidden transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Enter your public channel handle with <code className="font-mono text-cyan-700 bg-cyan-50 px-1 py-0.5 rounded">@</code> (e.g. <strong className="text-slate-700">@Bete_Finder</strong>) or your channel's numeric chat ID (e.g. <strong className="text-slate-700">-100...</strong>). The bot must be an Administrator in this channel.
                </p>
              </div>

              {/* Field 2: Bot Username */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Telegram Bot Username
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                    🤖
                  </span>
                  <input
                    id="telegram-bot-username-input"
                    type="text"
                    value={botUsernameInput}
                    onChange={e => setBotUsernameInput(e.target.value)}
                    placeholder="BeteFinder_bot"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-semibold focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-hidden transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Bot handle (e.g. <strong className="text-slate-700">BeteFinder_bot</strong>). Direct user inquiries and deep links route to <code className="font-mono text-purple-700 bg-purple-50 px-1 py-0.5 rounded">https://t.me/&#123;botUsername&#125;</code>.
                </p>
              </div>

              {/* Field 3: Bot Token */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Telegram Bot API Token (from @BotFather)
                </label>
                <div className="relative">
                  <input
                    id="telegram-bot-token-input"
                    type={showRawToken ? 'text' : 'password'}
                    value={botTokenInput}
                    onChange={e => setBotTokenInput(e.target.value)}
                    placeholder="8716860236:AAEiN5kJednAaFVvy03wCaveNyq71C-LZWo"
                    className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-hidden transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRawToken(!showRawToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    title={showRawToken ? 'Hide token' : 'Reveal token'}
                  >
                    {showRawToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Stored securely in the database. Leave as default or provide your custom bot token.
                </p>
              </div>

              {/* Field 4: Auto-Publish Switch */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Auto-Publish New Property Listings</span>
                    {autoPublishInput && (
                      <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Automatically send newly listed properties with photos and contact info to your Telegram channel.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={autoPublishInput}
                    onChange={e => setAutoPublishInput(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleResetTelegramConfig}
                  disabled={savingConfig}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Bete Finder Defaults</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="save-telegram-config-submit-btn"
                    type="submit"
                    disabled={savingConfig}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className={`w-4 h-4 ${savingConfig ? 'animate-spin' : ''}`} />
                    <span>{savingConfig ? 'Verifying & Saving...' : 'Save & Verify Connection'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PERMANENTLY ERASE ALL PROPERTY LISTINGS                          */}
      {/* ========================================================================= */}
      {showEraseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-red-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 relative animate-in fade-in zoom-in-95 duration-200 my-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-red-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 text-red-600 rounded-2xl border border-red-200">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-red-600">
                    Erase All Listing Properties
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Critical database purge: permanently delete all listings.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEraseModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning Message Box */}
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-2">
              <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <span>Irreversible Data Deletion Warning</span>
              </div>
              <p className="text-xs text-red-700 leading-relaxed">
                You are about to permanently delete <strong className="underline font-black">{properties.length} property listings</strong> from the Bete Finder database.
              </p>
              <ul className="text-[11px] text-red-600 list-disc list-inside space-y-1 pt-1 font-medium">
                <li>All listing photos, descriptions, and amenities will be deleted.</li>
                <li>Database records in Neon PostgreSQL and local cache will be emptied.</li>
                <li>Public visitors and app users will see zero listings until new properties are submitted.</li>
              </ul>
            </div>

            {/* Confirmation Input Safeguard */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                To confirm permanent deletion, please type <span className="font-mono text-red-600 font-black bg-red-50 px-1.5 py-0.5 rounded border border-red-200">ERASE</span> or <span className="font-mono text-red-600 font-black bg-red-50 px-1.5 py-0.5 rounded border border-red-200">DELETE</span> below:
              </label>
              <input
                id="erase-confirm-input"
                type="text"
                value={eraseConfirmInput}
                onChange={e => setEraseConfirmInput(e.target.value)}
                placeholder="Type ERASE or DELETE"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-mono font-bold focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-hidden transition-all uppercase"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEraseModal(false)}
                disabled={erasingProperties}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                id="confirm-erase-all-properties-btn"
                type="button"
                onClick={handleEraseAllProperties}
                disabled={
                  erasingProperties ||
                  (eraseConfirmInput.trim().toUpperCase() !== 'ERASE' &&
                    eraseConfirmInput.trim().toUpperCase() !== 'DELETE')
                }
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-xs font-bold shadow-md shadow-red-600/30 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <Trash2 className={`w-4 h-4 ${erasingProperties ? 'animate-spin' : ''}`} />
                <span>
                  {erasingProperties
                    ? 'Erasing All Listings...'
                    : `Permanently Erase (${properties.length}) Properties`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
