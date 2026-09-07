import React, { useState, useEffect, useMemo } from 'react';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Star, 
  Mail, 
  Phone, 
  User, 
  ExternalLink, 
  RefreshCw, 
  Download, 
  AlertCircle, 
  Check, 
  Send,
  Building2,
  Crown,
  Sparkles,
  Inbox
} from 'lucide-react';
import { OwnerFeedback } from '../../types';
import { 
  getOwnerFeedbacks, 
  updateFeedbackStatus, 
  deleteOwnerFeedback, 
  clearAllOwnerFeedbacks,
  syncFeedbacksFromServer 
} from '../../lib/feedback';

interface OwnerFeedbackTabProps {
  onShowToast: (msg: string) => void;
}

export const OwnerFeedbackTab: React.FC<OwnerFeedbackTabProps> = ({ onShowToast }) => {
  const [feedbacks, setFeedbacks] = useState<OwnerFeedback[]>(getOwnerFeedbacks());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [feedbackToDelete, setFeedbackToDelete] = useState<OwnerFeedback | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  // Sync listener for real-time feedback updates
  useEffect(() => {
    const handleFeedbacksChanged = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setFeedbacks(e.detail);
      } else {
        setFeedbacks(getOwnerFeedbacks());
      }
    };

    window.addEventListener('bete_feedbacks_changed', handleFeedbacksChanged);
    syncFeedbacksFromServer().then((synced) => {
      if (synced) setFeedbacks(synced);
    });

    return () => {
      window.removeEventListener('bete_feedbacks_changed', handleFeedbacksChanged);
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const synced = await syncFeedbacksFromServer();
    setFeedbacks(synced);
    setIsRefreshing(false);
    onShowToast('🔄 Owner feedbacks synced from database!');
  };

  // Status toggle
  const handleToggleStatus = async (fb: OwnerFeedback) => {
    const nextStatus = fb.status === 'new' ? 'read' : fb.status === 'read' ? 'new' : 'read';
    const updated = await updateFeedbackStatus(fb.id, nextStatus);
    setFeedbacks(updated);
    onShowToast(`Feedback marked as ${nextStatus.toUpperCase()}`);
  };

  // Save reply notes
  const handleSaveReplyNotes = async (id: string) => {
    if (!replyInput.trim()) return;
    const updated = await updateFeedbackStatus(id, 'replied', replyInput.trim());
    setFeedbacks(updated);
    setActiveReplyId(null);
    setReplyInput('');
    onShowToast('✅ Reply note saved for this feedback!');
  };

  // Confirm delete single feedback
  const handleConfirmDelete = async () => {
    if (!feedbackToDelete) return;
    const updated = await deleteOwnerFeedback(feedbackToDelete.id);
    setFeedbacks(updated);
    onShowToast(`Deleted feedback from ${feedbackToDelete.name}`);
    setFeedbackToDelete(null);
  };

  // Confirm clear all
  const handleConfirmClearAll = async () => {
    const cleared = await clearAllOwnerFeedbacks();
    setFeedbacks(cleared);
    setShowClearAllModal(false);
    onShowToast('🗑️ All owner feedbacks cleared from database.');
  };

  // Export to JSON
  const handleExport = () => {
    const dataStr = JSON.stringify(feedbacks, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bete_owner_feedbacks_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    onShowToast('📥 Exported feedbacks to JSON file.');
  };

  // Filtering calculations
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((fb) => {
      // Category filter
      if (selectedCategory !== 'all' && fb.category !== selectedCategory) return false;
      // Status filter
      if (selectedStatus !== 'all' && fb.status !== selectedStatus) return false;
      // Rating filter
      if (selectedRating !== 'all' && String(fb.rating) !== selectedRating) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inName = (fb.name || '').toLowerCase().includes(q);
        const inEmail = (fb.email || '').toLowerCase().includes(q);
        const inPhone = (fb.phone || '').toLowerCase().includes(q);
        const inMsg = (fb.message || '').toLowerCase().includes(q);
        const inProp = (fb.propertyTitle || '').toLowerCase().includes(q);
        return inName || inEmail || inPhone || inMsg || inProp;
      }
      return true;
    });
  }, [feedbacks, selectedCategory, selectedStatus, selectedRating, searchQuery]);

  // Summary Metrics
  const totalCount = feedbacks.length;
  const newCount = feedbacks.filter((f) => f.status === 'new').length;
  const avgRating = totalCount > 0
    ? (feedbacks.reduce((acc, f) => acc + (f.rating || 5), 0) / totalCount).toFixed(1)
    : '5.0';
  const rentalInquiries = feedbacks.filter((f) => f.category === 'rental').length;
  const saleInquiries = feedbacks.filter((f) => f.category === 'sale').length;

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Executive Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shadow-inner">
                <Inbox className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                Owner Direct Feedbacks Suite
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Customer & User Feedback Inbox
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Real-time inbox collecting feedback, rental & sales inquiries, and platform ratings sent directly to Owner Kaleb Bereket.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Sync Feedbacks'}</span>
            </button>

            <button
              onClick={handleExport}
              disabled={feedbacks.length === 0}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Feedbacks</span>
            </button>

            {feedbacks.length > 0 && (
              <button
                onClick={() => setShowClearAllModal(true)}
                className="px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold text-xs rounded-xl border border-rose-500/30 shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">Total Feedbacks</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{totalCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Direct inquiries & reviews</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">New & Unread</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-2xl sm:text-3xl font-black text-amber-600">{newCount}</p>
            {newCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Awaiting owner review</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">Average Satisfaction</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{avgRating} <span className="text-sm text-slate-400 font-normal">/ 5.0</span></p>
          <p className="text-[11px] text-slate-400 mt-1">Platform user satisfaction</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">Rental & Sale Topics</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{rentalInquiries + saleInquiries}</p>
          <p className="text-[11px] text-slate-400 mt-1">{rentalInquiries} Rent · {saleInquiries} Sale inquiries</p>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search feedback by sender name, email, phone, or keyword..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Categories</option>
            <option value="rental">Rental Inquiries</option>
            <option value="sale">Sale Inquiries</option>
            <option value="platform">Platform Suggestions</option>
            <option value="support">Support & Help</option>
            <option value="bug">Reported Issues</option>
            <option value="general">General</option>
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="new">New / Unread ({newCount})</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
          </select>

          {/* Rating Dropdown */}
          <select
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Ratings</option>
            <option value="5">★★★★★ (5 Stars)</option>
            <option value="4">★★★★☆ (4 Stars)</option>
            <option value="3">★★★☆☆ (3 Stars)</option>
            <option value="2">★★☆☆☆ (2 Stars)</option>
            <option value="1">★☆☆☆☆ (1 Star)</option>
          </select>

        </div>

        {/* Active Filters readout */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 flex-wrap gap-2">
          <span>Showing <strong className="text-slate-900 font-bold">{filteredFeedbacks.length}</strong> of {totalCount} feedbacks</span>
          {(selectedCategory !== 'all' || selectedStatus !== 'all' || selectedRating !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedStatus('all');
                setSelectedRating('all');
                setSearchQuery('');
              }}
              className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Feedback Cards List */}
      {filteredFeedbacks.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Feedbacks Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {feedbacks.length === 0 
              ? 'No feedbacks have been submitted yet. Visitors can send feedback using the "Send Feedback to Owner" button.' 
              : 'No feedbacks match the active search and filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFeedbacks.map((fb) => {
            const isNew = fb.status === 'new';
            const isReplied = fb.status === 'replied';

            return (
              <div 
                key={fb.id}
                className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all shadow-xs ${
                  isNew 
                    ? 'border-indigo-300 ring-2 ring-indigo-500/10' 
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  
                  {/* Sender Info & Badges */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                      {fb.name ? fb.name.charAt(0).toUpperCase() : 'U'}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-black text-slate-900">{fb.name}</h4>
                        
                        {/* Status Badge */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isNew 
                            ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse' 
                            : isReplied 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {fb.status}
                        </span>

                        {/* Category Badge */}
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {fb.category.toUpperCase()}
                        </span>
                      </div>

                      {/* Contact Channels */}
                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        {fb.email && (
                          <a 
                            href={`mailto:${fb.email}?subject=Regarding your feedback on Bete Finder`}
                            className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{fb.email}</span>
                          </a>
                        )}

                        {fb.phone && (
                          <a 
                            href={`tel:${fb.phone}`}
                            className="flex items-center gap-1 hover:text-emerald-600 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{fb.phone}</span>
                          </a>
                        )}

                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="w-3 h-3" />
                          {new Date(fb.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rating Stars & Quick Status Toggle */}
                  <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                    {/* Stars */}
                    <div className="flex items-center gap-0.5 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/80">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            (fb.rating || 5) >= star 
                              ? 'fill-amber-400 text-amber-500' 
                              : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Mark Read/New Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(fb)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                        isNew
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {isNew ? 'Mark as Read' : 'Mark as New'}
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => setFeedbackToDelete(fb)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete feedback"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Optional Property Context */}
                {fb.propertyTitle && (
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Inquiry regarding: <strong className="text-slate-900">{fb.propertyTitle}</strong></span>
                  </div>
                )}

                {/* Message Body */}
                <div className="mt-3.5 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                  {fb.message}
                </div>

                {/* Reply Note / Actions */}
                {fb.replyNotes && (
                  <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Owner Response / Internal Note:</span>
                    </div>
                    <p className="text-emerald-950 whitespace-pre-wrap">{fb.replyNotes}</p>
                  </div>
                )}

                {/* Inline Reply Box Trigger */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  {activeReplyId === fb.id ? (
                    <div className="w-full space-y-2">
                      <textarea
                        rows={2}
                        value={replyInput}
                        onChange={(e) => setReplyInput(e.target.value)}
                        placeholder="Type internal note or reply record for this feedback..."
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveReplyNotes(fb.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Note & Mark Replied</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveReplyId(null);
                            setReplyInput('');
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveReplyId(fb.id);
                        setReplyInput(fb.replyNotes || '');
                      }}
                      className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{fb.replyNotes ? 'Edit Note' : 'Add Owner Response Note'}</span>
                    </button>
                  )}

                  {fb.email && (
                    <a
                      href={`mailto:${fb.email}?subject=Response from Owner Kaleb Bereket - Bete Finder`}
                      className="text-slate-500 hover:text-indigo-600 font-medium flex items-center gap-1"
                    >
                      <span>Direct Email</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {feedbackToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-base font-black text-slate-900">Delete Feedback?</h4>
              <p className="text-xs text-slate-600">
                Are you sure you want to permanently erase feedback from <strong>{feedbackToDelete.name}</strong>?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFeedbackToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Delete Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Modal */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-base font-black text-slate-900">Erase All Feedbacks?</h4>
              <p className="text-xs text-slate-600">
                This will delete all {totalCount} received customer feedbacks from the database permanently.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearAllModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Yes, Erase All
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
