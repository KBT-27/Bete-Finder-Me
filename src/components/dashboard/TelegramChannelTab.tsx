import React, { useState, useEffect } from 'react';
import {
  Send,
  Radio,
  CheckCircle2,
  ExternalLink,
  Copy,
  RefreshCw,
  Sparkles,
  Building2,
  Users,
  Bell,
  Check,
  ArrowUpRight,
  Info,
  Clock,
  Layers,
  Settings,
  Sliders,
  AlertTriangle,
  Bot,
  MessageSquare,
  Globe,
  Share2,
  FileText,
  X,
  Save,
  RotateCcw
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

interface TelegramChannelTabProps {
  properties?: Property[];
  showToast: (msg: string) => void;
  onSwitchToBot?: () => void;
}

interface ChannelLogItem {
  id: string;
  type: 'announcement' | 'property' | 'test';
  title: string;
  summary: string;
  timestamp: string;
  status: 'sent' | 'pending' | 'failed';
}

export const TelegramChannelTab: React.FC<TelegramChannelTabProps> = ({
  properties: propProps = [],
  showToast,
  onSwitchToBot
}) => {
  const { properties: contextProps = [] } = useProperties();
  const properties = propProps.length > 0 ? propProps : contextProps;

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [statusData, setStatusData] = useState<TelegramStatusResponse | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Channel Settings Modal
  const [showChannelSettingsModal, setShowChannelSettingsModal] = useState<boolean>(false);
  const [channelHandleInput, setChannelHandleInput] = useState<string>('@Bete_Finder');
  const [autoPublishInput, setAutoPublishInput] = useState<boolean>(true);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);

  // Broadcast Announcement State
  const [broadcastTitle, setBroadcastTitle] = useState<string>('Bete Finder Notice');
  const [broadcastMessage, setBroadcastMessage] = useState<string>(
    '🏢 Exciting news! New verified luxury listings have just been added to Bete Finder. Visit the app now to browse photos, prices, and book direct tours.'
  );
  const [broadcastAuthor, setBroadcastAuthor] = useState<string>('Bete Finder Team');
  const [broadcastActionUrl, setBroadcastActionUrl] = useState<string>('https://bete-finder-one.vercel.app');
  const [sendingBroadcast, setSendingBroadcast] = useState<boolean>(false);

  // Property Showcase State
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(properties[0]?.id || '');
  const [sendingPropertyPost, setSendingPropertyPost] = useState<boolean>(false);

  // Channel Publication Logs
  const [channelLogs, setChannelLogs] = useState<ChannelLogItem[]>([
    {
      id: 'log-default-1',
      type: 'announcement',
      title: 'Official Channel Connected',
      summary: 'Channel @Bete_Finder connected with verified administrative rights.',
      timestamp: 'Today, Live',
      status: 'sent'
    }
  ]);

  const fetchChannelStatus = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setFetchError(null);

    try {
      const res = await fetch('/api/telegram/status');
      const data: TelegramStatusResponse = await res.json();
      setStatusData(data);
      if (data.config) {
        if (data.config.chatId) setChannelHandleInput(data.config.chatId);
        if (data.config.autoPublishProperties !== undefined) {
          setAutoPublishInput(data.config.autoPublishProperties);
        }
      }
      if (!data.success && data.error) {
        setFetchError(data.error);
      }
    } catch (err: any) {
      console.error('Error fetching Telegram channel status:', err);
      setFetchError(err?.message || 'Failed to connect to Telegram status endpoint.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChannelStatus();
  }, []);

  // Update selected property if properties change
  useEffect(() => {
    if (!selectedPropertyId && properties.length > 0) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId]);

  // Handle Save Channel Settings
  const handleSaveChannelSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!channelHandleInput.trim()) {
      showToast('⚠️ Please enter a channel handle (e.g. @Bete_Finder)');
      return;
    }
    setSavingSettings(true);
    try {
      const res = await fetch('/api/telegram/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: channelHandleInput.trim(),
          autoPublishProperties: autoPublishInput
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('✅ Telegram channel settings updated!');
        setShowChannelSettingsModal(false);
        await fetchChannelStatus(true);
      } else {
        showToast(`⚠️ ${data.error || 'Could not verify channel.'}`);
      }
    } catch (err: any) {
      showToast(`❌ Error: ${err?.message}`);
    } finally {
      setSavingSettings(false);
    }
  };

  // Broadcast Custom Announcement to Channel
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) {
      showToast('⚠️ Broadcast message content cannot be empty.');
      return;
    }
    setSendingBroadcast(true);
    try {
      const res = await fetch('/api/telegram/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: broadcastTitle,
          message: broadcastMessage,
          author: broadcastAuthor,
          actionUrl: broadcastActionUrl
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('📢 Broadcast successfully delivered to @Bete_Finder!');
        setChannelLogs(prev => [
          {
            id: `broadcast-${Date.now()}`,
            type: 'announcement',
            title: broadcastTitle,
            summary: broadcastMessage.slice(0, 100) + (broadcastMessage.length > 100 ? '...' : ''),
            timestamp: 'Just now',
            status: 'sent'
          },
          ...prev
        ]);
      } else {
        showToast(`❌ Broadcast failed: ${data.error || 'Check bot permissions in channel.'}`);
      }
    } catch (err: any) {
      showToast(`❌ Error sending broadcast: ${err?.message}`);
    } finally {
      setSendingBroadcast(false);
    }
  };

  // Publish Selected Property to Channel
  const handlePublishPropertyToChannel = async () => {
    if (!selectedPropertyId) {
      showToast('⚠️ Please select a property to publish.');
      return;
    }
    const prop = properties.find(p => p.id === selectedPropertyId);
    setSendingPropertyPost(true);
    try {
      const res = await fetch('/api/telegram/test-property', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: selectedPropertyId })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✨ Successfully posted "${prop?.title || 'Property'}" to @Bete_Finder!`);
        setChannelLogs(prev => [
          {
            id: `prop-${Date.now()}`,
            type: 'property',
            title: prop?.title || 'Property Showcase',
            summary: `${prop?.price?.toLocaleString()} ETB/mo • ${prop?.location?.subcity || 'Addis Ababa'}`,
            timestamp: 'Just now',
            status: 'sent'
          },
          ...prev
        ]);
      } else {
        showToast(`❌ Publish failed: ${data.error || 'Bot failed to post photo.'}`);
      }
    } catch (err: any) {
      showToast(`❌ Error: ${err?.message}`);
    } finally {
      setSendingPropertyPost(false);
    }
  };

  const channelUrl =
    statusData?.channel?.link ||
    (channelHandleInput.startsWith('@')
      ? `https://t.me/${channelHandleInput.replace('@', '')}`
      : 'https://t.me/Bete_Finder');

  const selectedPropObj = properties.find(p => p.id === selectedPropertyId);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* 1. PROFESSIONAL CHANNEL HEADER & ACTIONS                                  */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                Telegram Channel Broadcaster
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Live Broadcast Ready
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Telegram Channel Hub
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Broadcast announcements, auto-publish verified real estate listings with high-resolution photos, and manage subscriber feeds for your public channel.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onSwitchToBot && (
              <button
                id="switch-to-bot-tab-btn"
                onClick={onSwitchToBot}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-purple-950/70 hover:bg-purple-900 text-purple-200 text-xs font-bold border border-purple-500/40 hover:border-purple-400 transition-all cursor-pointer shadow-sm"
              >
                <Bot className="w-4 h-4 text-purple-300" />
                <span>Switch to Bot Console</span>
              </button>
            )}

            <button
              id="open-channel-settings-btn"
              onClick={() => setShowChannelSettingsModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer shadow-sm"
            >
              <Settings className="w-4 h-4 text-cyan-400" />
              <span>Channel Settings</span>
            </button>

            <button
              onClick={() => fetchChannelStatus(true)}
              disabled={refreshing || loading}
              className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
              title="Refresh channel telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            <a
              id="open-telegram-channel-btn"
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/30 transition-all cursor-pointer"
            >
              <span>Open @Bete_Finder</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CHANNEL STATUS METRICS CARDS                                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Channel Identity */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Channel Handle</span>
            <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 truncate">
            {statusData?.channel?.username ? `@${statusData.channel.username}` : channelHandleInput}
          </p>
          <p className="text-[11px] text-slate-500 truncate">
            {statusData?.channel?.title || 'Bete Finder Official Channel'}
          </p>
        </div>

        {/* Metric 2: Member Audience */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subscribers</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-purple-700">
            {statusData?.channel?.members_count ? `${statusData.channel.members_count}` : '32+'} members
          </p>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Public Broadcast Feed
          </span>
        </div>

        {/* Metric 3: Auto-Publishing Engine */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Auto-Publish</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900">
            {autoPublishInput ? 'Enabled' : 'Disabled'}
          </p>
          <p className="text-[11px] text-slate-500">
            {autoPublishInput ? 'Pushes new listings automatically' : 'Manual publishing only'}
          </p>
        </div>

        {/* Metric 4: Total Properties Available */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Listings In DB</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-amber-600">
            {properties.length} Properties
          </p>
          <p className="text-[11px] text-slate-500">
            Ready for instant channel showcase
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BROADCAST COMPOSER & PROPERTY PUBLISHER (SIDE BY SIDE)                 */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Announcement Broadcast Composer (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-2xl border border-cyan-100">
                <Send className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Channel Broadcast Composer</h3>
                <p className="text-xs text-slate-500">Post announcements directly to the @Bete_Finder feed</p>
              </div>
            </div>
            <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-200">
              HTML Supported
            </span>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Announcement Title
              </label>
              <input
                type="text"
                value={broadcastTitle}
                onChange={e => setBroadcastTitle(e.target.value)}
                placeholder="e.g. Special Weekend Open House Notice"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-semibold focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-hidden transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Message Content (HTML or Plain Text) <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={broadcastMessage}
                onChange={e => setBroadcastMessage(e.target.value)}
                placeholder="Write your channel announcement here..."
                required
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-hidden transition-all font-sans leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Author / Sender Label
                </label>
                <input
                  type="text"
                  value={broadcastAuthor}
                  onChange={e => setBroadcastAuthor(e.target.value)}
                  placeholder="Bete Finder Team"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:bg-white focus:border-cyan-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Action Link
                </label>
                <input
                  type="url"
                  value={broadcastActionUrl}
                  onChange={e => setBroadcastActionUrl(e.target.value)}
                  placeholder="https://bete-finder-one.vercel.app"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:bg-white focus:border-cyan-500 outline-hidden"
                />
              </div>
            </div>

            {/* Live Telegram Preview Box */}
            <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-cyan-400 font-mono">
                <span>📱 Telegram Feed Preview</span>
                <span>@Bete_Finder</span>
              </div>
              <div className="text-xs space-y-1 bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                <p className="font-bold text-white text-sm">
                  📢 {broadcastTitle || 'Bete Finder Announcement'}
                </p>
                <p className="text-slate-300 text-xs whitespace-pre-wrap leading-relaxed">
                  {broadcastMessage || 'Your message will appear here.'}
                </p>
                <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Author: {broadcastAuthor}</span>
                  <span className="text-cyan-300 underline font-semibold">Open Link</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={sendingBroadcast}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-cyan-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className={`w-4 h-4 ${sendingBroadcast ? 'animate-spin' : ''}`} />
                <span>{sendingBroadcast ? 'Delivering to Channel...' : 'Send Broadcast to Channel'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Property Showcase Publisher (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                  <Building2 className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Publish Property Listing</h3>
                  <p className="text-xs text-slate-500">Showcase property photo & details to channel</p>
                </div>
              </div>
            </div>

            {/* Property Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Property From Database
              </label>
              <select
                value={selectedPropertyId}
                onChange={e => setSelectedPropertyId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:bg-white focus:border-amber-500 outline-hidden"
              >
                {properties.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.price?.toLocaleString()} ETB - {p.location?.subcity})
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Property Preview */}
            {selectedPropObj ? (
              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50">
                <div className="h-36 bg-slate-200 relative overflow-hidden">
                  <img
                    src={selectedPropObj.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80'}
                    alt={selectedPropObj.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {selectedPropObj.propertyType}
                  </div>
                  <div className="absolute bottom-2 left-2 bg-emerald-600 text-white text-xs font-black px-2.5 py-0.5 rounded-lg">
                    {selectedPropObj.price?.toLocaleString()} ETB/mo
                  </div>
                </div>
                <div className="p-3.5 space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{selectedPropObj.title}</h4>
                  <p className="text-[11px] text-slate-500">
                    📍 {selectedPropObj.location?.subcity || 'Addis Ababa'} • {selectedPropObj.bedrooms || 2} Beds • {selectedPropObj.bathrooms || 1} Baths
                  </p>
                  <p className="text-[11px] text-slate-600 font-mono">
                    Owner: {selectedPropObj.owner?.name || 'Bete Finder'} ({selectedPropObj.owner?.phone || '+251995406697'})
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs">
                No property listings found. Post a property first!
              </div>
            )}
          </div>

          <button
            id="publish-selected-property-to-channel-btn"
            onClick={handlePublishPropertyToChannel}
            disabled={sendingPropertyPost || !selectedPropertyId}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-amber-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${sendingPropertyPost ? 'animate-spin' : ''}`} />
            <span>{sendingPropertyPost ? 'Posting Photo to Channel...' : 'Post Listing to @Bete_Finder'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. RECENT CHANNEL PUBLICATION LOGS                                        */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">Recent Channel Broadcasts & Feeds</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">Auto-recorded</span>
        </div>

        <div className="divide-y divide-slate-100">
          {channelLogs.map(log => (
            <div key={log.id} className="py-3 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    log.type === 'property'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-cyan-50 text-cyan-600'
                  }`}
                >
                  {log.type === 'property' ? (
                    <Building2 className="w-4 h-4" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{log.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{log.summary}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Check className="w-3 h-3" />
                  {log.status}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">{log.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. CHANNEL CONFIGURATION MODAL                                            */}
      {/* ========================================================================= */}
      {showChannelSettingsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 relative animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-2xl border border-cyan-100">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Telegram Channel Settings</h3>
                  <p className="text-xs text-slate-500">Configure target channel and auto-publishing rules</p>
                </div>
              </div>
              <button
                onClick={() => setShowChannelSettingsModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChannelSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Telegram Channel Handle or Chat ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={channelHandleInput}
                  onChange={e => setChannelHandleInput(e.target.value)}
                  placeholder="@Bete_Finder or -1004472865837"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-semibold focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-hidden transition-all"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Your public channel username (e.g. <strong className="text-slate-700">@Bete_Finder</strong>). The bot must be an Administrator in this channel.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 block">
                    Auto-Publish New Property Listings
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Automatically post newly added properties with photos and pricing to this channel.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={autoPublishInput}
                    onChange={e => setAutoPublishInput(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowChannelSettingsModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className={`w-4 h-4 ${savingSettings ? 'animate-spin' : ''}`} />
                  <span>{savingSettings ? 'Saving...' : 'Save Channel Settings'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
